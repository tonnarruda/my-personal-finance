package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tonnarruda/my-personal-finance/services"
	"github.com/tonnarruda/my-personal-finance/structs"
	"github.com/tonnarruda/my-personal-finance/utils"
)

type AccountHandler struct {
	accountService *services.AccountService
}

// NewAccountHandler cria uma nova instância do handler de contas
func NewAccountHandler(accountService *services.AccountService) *AccountHandler {
	return &AccountHandler{
		accountService: accountService,
	}
}

// CreateAccount cria uma nova conta
func (h *AccountHandler) CreateAccount(c *gin.Context) {
	// Obter user_id do query parameter
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id é obrigatório",
		})
		return
	}

	var req structs.CreateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dados inválidos: " + err.Error(),
		})
		return
	}

	// Definir o user_id no request
	req.UserID = userID

	account, err := h.accountService.CreateAccount(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Conta criada com sucesso",
		"account": account,
	})
}

// GetAccountByID busca uma conta pelo ID
func (h *AccountHandler) GetAccountByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID da conta é obrigatório",
		})
		return
	}

	// Obter user_id do corpo da requisição
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id é obrigatório",
		})
		return
	}

	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID deve ser um UUID válido",
		})
		return
	}

	account, err := h.accountService.GetAccountByID(id, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"account": account,
	})
}

// GetAllAccounts busca todas as contas
func (h *AccountHandler) GetAllAccounts(c *gin.Context) {
	// Obter user_id do corpo da requisição
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id é obrigatório",
		})
		return
	}

	accounts, err := h.accountService.GetAllAccounts(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"accounts": accounts,
	})
}

// UpdateAccount atualiza uma conta existente
func (h *AccountHandler) UpdateAccount(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID da conta é obrigatório",
		})
		return
	}

	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID deve ser um UUID válido",
		})
		return
	}

	var req structs.UpdateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dados inválidos: " + err.Error(),
		})
		return
	}

	account, err := h.accountService.UpdateAccount(id, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Conta atualizada com sucesso",
		"account": account,
	})
}

// DeleteAccount remove uma conta (soft delete)
func (h *AccountHandler) DeleteAccount(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID da conta é obrigatório",
		})
		return
	}

	// Obter user_id do corpo da requisição
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id é obrigatório",
		})
		return
	}

	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID deve ser um UUID válido",
		})
		return
	}

	err := h.accountService.DeleteAccount(id, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Conta removida com sucesso",
	})
}

// GetInitialTransaction busca a transação inicial de uma conta
func (h *AccountHandler) GetInitialTransaction(c *gin.Context) {
	accountID := c.Param("id")
	if accountID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID da conta é obrigatório",
		})
		return
	}

	// Obter user_id do query parameter
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id é obrigatório",
		})
		return
	}

	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(accountID) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID deve ser um UUID válido",
		})
		return
	}

	transaction, err := h.accountService.GetInitialTransaction(accountID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transaction": transaction,
	})
}
