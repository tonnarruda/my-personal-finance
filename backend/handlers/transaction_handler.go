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

	// Preencher campos obrigatórios
	if req.ID == "" {
		req.ID = uuid.New().String()
	}
	if req.CreatedAt.IsZero() {
		req.CreatedAt = time.Now()
	}
	req.UpdatedAt = time.Now()

	// Verificar se é uma transferência
	if req.Type == "transfer" {
		// Para transferências, category_id contém o ID da conta destino
		destAccountID := req.CategoryID

		// Buscar ou criar a categoria "Transferência"
		transferCategory, err := h.DB.EnsureTransferCategory()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to ensure transfer category", "details": err.Error()})
			return
		}

		// Gerar ID único para vincular as duas transações
		transferID := uuid.New().String()

		// Criar transação de débito na conta origem
		debitTx := structs.Transaction{
			ID:                  uuid.New().String(),
			UserID:              req.UserID,
			Description:         req.Description,
			Amount:              req.Amount,
			Type:                "expense",
			CategoryID:          transferCategory.ID,
			AccountID:           req.AccountID, // Conta origem
			DueDate:             req.DueDate,
			CompetenceDate:      req.CompetenceDate,
			IsPaid:              req.IsPaid,
			Observation:         req.Observation,
			IsRecurring:         req.IsRecurring,
			RecurringType:       req.RecurringType,
			Installments:        req.Installments,
			CurrentInstallment:  req.CurrentInstallment,
			ParentTransactionID: req.ParentTransactionID,
			TransferID:          &transferID,
			CreatedAt:           time.Now(),
			UpdatedAt:           time.Now(),
		}

		// Criar transação de crédito na conta destino
		creditTx := structs.Transaction{
			ID:                  uuid.New().String(),
			UserID:              req.UserID,
			Description:         req.Description,
			Amount:              req.Amount,
			Type:                "income",
			CategoryID:          transferCategory.ID,
			AccountID:           destAccountID, // Conta destino
			DueDate:             req.DueDate,
			CompetenceDate:      req.CompetenceDate,
			IsPaid:              req.IsPaid,
			Observation:         req.Observation,
			IsRecurring:         req.IsRecurring,
			RecurringType:       req.RecurringType,
			Installments:        req.Installments,
			CurrentInstallment:  req.CurrentInstallment,
			ParentTransactionID: req.ParentTransactionID,
			TransferID:          &transferID,
			CreatedAt:           time.Now(),
			UpdatedAt:           time.Now(),
		}

		// Criar ambas as transações
		if err := h.DB.CreateTransaction(debitTx); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create debit transaction", "details": err.Error()})
			return
		}

		if err := h.DB.CreateTransaction(creditTx); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create credit transaction", "details": err.Error()})
			return
		}

		// Retornar as duas transações criadas
		c.JSON(http.StatusCreated, gin.H{
			"debit_transaction":  debitTx,
			"credit_transaction": creditTx,
			"transfer_id":        transferID,
		})
	} else {
		// Lógica normal para transações que não são transferências
		if err := h.DB.CreateTransaction(req); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, req)
	}
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

	// Garantir que sempre retorne um array, mesmo que vazio
	if txs == nil {
		txs = []structs.Transaction{}
	}

	// Forçar serialização como array vazio se não há transações
	if len(txs) == 0 {
		c.JSON(http.StatusOK, []structs.Transaction{})
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

	// Usar map para permitir updates parciais
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Remover campos que não devem ser atualizados diretamente
	delete(updates, "id")
	delete(updates, "user_id")
	delete(updates, "created_at")

	if err := h.DB.UpdateTransactionPartial(id, userID, updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Buscar a transação atualizada para retornar
	updatedTx, err := h.DB.GetTransactionByID(id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated transaction"})
		return
	}

	c.JSON(http.StatusOK, updatedTx)
}

// DeleteTransaction remove uma transação
func (h *TransactionHandler) DeleteTransaction(c *gin.Context) {
	id := c.Param("id")
	userID := c.Query("user_id")
	if id == "" || userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id and user_id are required"})
		return
	}

	// Buscar a transação para verificar se é uma transferência
	tx, err := h.DB.GetTransactionByID(id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if tx == nil {
		c.Status(http.StatusNotFound)
		return
	}

	// Se a transação tem transfer_id, deletar todas as transações vinculadas
	if tx.TransferID != nil && *tx.TransferID != "" {
		if err := h.DB.DeleteTransactionsByTransferID(*tx.TransferID, userID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete transfer transactions", "details": err.Error()})
			return
		}
	} else {
		// Deletar apenas a transação individual
		if err := h.DB.DeleteTransaction(id, userID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.Status(http.StatusNoContent)
}
