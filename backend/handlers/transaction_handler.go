package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/tonnarruda/my-personal-finance/database"
	"github.com/tonnarruda/my-personal-finance/structs"
)

type TransactionHandler struct {
	DB *database.Database
}

// CreateTransaction cria uma nova transação
func (h *TransactionHandler) CreateTransaction(c *gin.Context) {
	var req structs.Transaction
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Println("DECODE ERROR:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}
	if req.ID == "" {
		req.ID = uuid.New().String()
	}
	if req.CreatedAt.IsZero() {
		req.CreatedAt = time.Now()
	}
	req.UpdatedAt = time.Now()
	if err := h.DB.CreateTransaction(req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, req)
}

// GetAllTransactions lista todas as transações do usuário
func (h *TransactionHandler) GetAllTransactions(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}
	txs, err := h.DB.GetAllTransactionsByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, txs)
}

// GetTransactionByID busca uma transação pelo ID
func (h *TransactionHandler) GetTransactionByID(c *gin.Context) {
	id := c.Param("id")
	userID := c.Query("user_id")
	if id == "" || userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id and user_id are required"})
		return
	}
	tx, err := h.DB.GetTransactionByID(id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if tx == nil {
		c.Status(http.StatusNotFound)
		return
	}
	c.JSON(http.StatusOK, tx)
}

// UpdateTransaction atualiza uma transação existente
func (h *TransactionHandler) UpdateTransaction(c *gin.Context) {
	id := c.Param("id")
	userID := c.Query("user_id")
	if id == "" || userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id and user_id are required"})
		return
	}
	var req structs.Transaction
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	req.UpdatedAt = time.Now()
	if err := h.DB.UpdateTransaction(id, userID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, req)
}

// DeleteTransaction remove uma transação
func (h *TransactionHandler) DeleteTransaction(c *gin.Context) {
	id := c.Param("id")
	userID := c.Query("user_id")
	if id == "" || userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id and user_id are required"})
		return
	}
	if err := h.DB.DeleteTransaction(id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
