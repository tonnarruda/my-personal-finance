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
const sessionDuration = 1 * time.Minute

// Middleware para proteger rotas
func SessionAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Cookie(sessionCookieName)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Sessão expirada ou inválida"})
			return
		}
		// Validar e decodificar JWT
		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(cookie, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Sessão expirada ou inválida"})
			return
		}
		// Checar expiração
		exp, ok := claims["exp"].(float64)
		if !ok || int64(exp) < time.Now().Unix() {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Sessão expirada ou inválida"})
			return
		}
		userID, ok := claims["user_id"].(string)
		if !ok || userID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Sessão expirada ou inválida"})
			return
		}
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
		c.SetCookie(
			sessionCookieName,
			newTokenString,
			int(sessionDuration.Seconds()),
			"/",
			"",
			true, // Secure
			true, // HttpOnly
		)
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
	user, err := h.UserService.AutenticarUsuario(req.Email, req.Senha)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"erro": err.Error()})
		return
	}

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

	// Define cookie seguro
	c.SetCookie(
		sessionCookieName,
		tokenString,
		int(sessionDuration.Seconds()),
		"/",
		"",
		true, // Secure
		true, // HttpOnly
	)

	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"nome":  user.Nome,
		"email": user.Email,
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
