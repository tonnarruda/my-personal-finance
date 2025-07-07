package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tonnarruda/my-personal-finance/services"
)

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
	c.JSON(http.StatusOK, gin.H{
		"id":    user.ID,
		"nome":  user.Nome,
		"email": user.Email,
	})
}
