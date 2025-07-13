package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/tonnarruda/my-personal-finance/services"
)

const jwtSecret = "supersecretkey123" // Troque por uma chave forte em produção

// Sessão em memória (não é mais necessário, mas mantido para referência)
// var sessionStore = struct {
// 	m map[string]SessionData
// 	sync.RWMutex
// }{m: make(map[string]SessionData)}
//
// type SessionData struct {
// 	UserID    string
// 	ExpiresAt time.Time
// }

const sessionCookieName = "session_token"
const sessionDuration = 30 * time.Minute

// Middleware para proteger rotas
func SessionAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Log de debug
		fmt.Printf("[AUTH] Verificando autenticação para: %s | User-Agent: %s\n",
			c.Request.URL.Path, c.GetHeader("User-Agent"))

		var tokenString string

		// Primeiro tenta pegar do cookie
		cookie, err := c.Cookie(sessionCookieName)
		if err == nil {
			tokenString = cookie
			fmt.Printf("[AUTH] ✅ Token encontrado no cookie\n")
		} else {
			// Se não encontrar no cookie, tenta pegar do header Authorization
			authHeader := c.GetHeader("Authorization")
			if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				tokenString = authHeader[7:]
				fmt.Printf("[AUTH] ✅ Token encontrado no header Authorization\n")
			} else {
				fmt.Printf("[AUTH] ❌ Token não encontrado nem no cookie nem no header\n")
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Sessão expirada ou inválida"})
				return
			}
		}

		// Validar e decodificar JWT
		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			fmt.Printf("[AUTH] ❌ JWT inválido: %v\n", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Sessão expirada ou inválida"})
			return
		}

		// Checar expiração
		exp, ok := claims["exp"].(float64)
		if !ok || int64(exp) < time.Now().Unix() {
			fmt.Printf("[AUTH] ❌ Token expirado\n")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Sessão expirada ou inválida"})
			return
		}

		userID, ok := claims["user_id"].(string)
		if !ok || userID == "" {
			fmt.Printf("[AUTH] ❌ User ID não encontrado no token\n")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Sessão expirada ou inválida"})
			return
		}

		fmt.Printf("[AUTH] ✅ Usuário autenticado: %s\n", userID)

		email, _ := claims["email"].(string)
		name, _ := claims["name"].(string)
		// Renovar JWT (rolling session)
		newToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"user_id": userID,
			"email":   email,
			"name":    name,
			"iat":     time.Now().Unix(),
			"exp":     time.Now().Add(sessionDuration).Unix(),
		})
		newTokenString, _ := newToken.SignedString([]byte(jwtSecret))

		// Configuração de cookie melhorada para Safari
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     sessionCookieName,
			Value:    newTokenString,
			Path:     "/",
			MaxAge:   int(sessionDuration.Seconds()),
			Secure:   false, // Mudança para false para desenvolvimento
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode, // Mudança para Strict
		})
		c.Set("user_id", userID)
		c.Next()
	}
}

type SignupRequest struct {
	Nome  string `json:"nome" binding:"required"`
	Email string `json:"email" binding:"required,email"`
	Senha string `json:"senha" binding:"required,min=8"`
}

type LoginRequest struct {
	Email string `json:"email" binding:"required,email"`
	Senha string `json:"senha" binding:"required"`
}

type AuthHandler struct {
	UserService *services.UserService
}

func NewAuthHandler(userService *services.UserService) *AuthHandler {
	return &AuthHandler{UserService: userService}
}

func (h *AuthHandler) SignupHandler(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "dados inválidos", "detalhe": err.Error()})
		return
	}
	user, err := h.UserService.CriarUsuario(req.Nome, req.Email, req.Senha)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"id":    user.ID,
		"nome":  user.Nome,
		"email": user.Email,
	})
}

func (h *AuthHandler) LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"erro": "dados inválidos", "detalhe": err.Error()})
		return
	}

	fmt.Printf("[LOGIN] Tentativa de login para: %s | User-Agent: %s\n",
		req.Email, c.GetHeader("User-Agent"))

	user, err := h.UserService.AutenticarUsuario(req.Email, req.Senha)
	if err != nil {
		fmt.Printf("[LOGIN] ❌ Falha na autenticação: %v\n", err)
		c.JSON(http.StatusUnauthorized, gin.H{"erro": err.Error()})
		return
	}

	fmt.Printf("[LOGIN] ✅ Usuário autenticado: %s\n", user.ID)

	// Configura as categorias padrão para o usuário se for a primeira vez
	err = h.UserService.SetupDefaultCategoriesForUser(user.ID)
	if err != nil {
		fmt.Printf("Erro ao configurar categorias padrão para usuário %s: %v\n", user.ID, err)
	}

	// Gera JWT de sessão com claims extras
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"name":    user.Nome,
		"iat":     time.Now().Unix(),
		"exp":     time.Now().Add(sessionDuration).Unix(),
	})
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"erro": "Erro ao gerar token de sessão"})
		return
	}

	// Configuração de cookie melhorada para Safari
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     sessionCookieName,
		Value:    tokenString,
		Path:     "/",
		MaxAge:   int(sessionDuration.Seconds()),
		Secure:   false, // Mudança para false para desenvolvimento
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode, // Mudança para Strict
	})

	fmt.Printf("[LOGIN] ✅ Cookie definido para usuário: %s\n", user.ID)

	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"nome":  user.Nome,
		"email": user.Email,
		"token": tokenString, // Adicionando o token no response
	})
}

// GetMeHandler retorna os dados do usuário autenticado
func (h *AuthHandler) GetMeHandler(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id é obrigatório"})
		return
	}
	user, err := h.UserService.GetUserByID(userID)
	if err != nil || user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"nome":  user.Nome,
		"email": user.Email,
	})
}

// LogoutHandler limpa o cookie de sessão
func (h *AuthHandler) LogoutHandler(c *gin.Context) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,    // Expira imediatamente
		Secure:   false, // Mudança para false para desenvolvimento
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode, // Mudança para Strict
	})
	c.JSON(http.StatusOK, gin.H{"message": "Logout realizado com sucesso"})
}
