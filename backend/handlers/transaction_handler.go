package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/tonnarruda/my-personal-finance/database"
	"github.com/tonnarruda/my-personal-finance/services"
	"github.com/tonnarruda/my-personal-finance/structs"
)

type TransactionHandler struct {
	DB              *database.Database
	ExchangeService services.ExchangeServiceInterface
}

// CreateTransaction cria uma nova transação
func (h *TransactionHandler) CreateTransaction(c *gin.Context) {
	// Obter user_id do query parameter
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id é obrigatório"})
		return
	}

	var req structs.Transaction
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Println("DECODE ERROR:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	// Preencher campos obrigatórios
	req.UserID = userID
	if req.ID == "" {
		req.ID = uuid.New().String()
	}
	if req.CreatedAt.IsZero() {
		req.CreatedAt = time.Now()
	}
	req.UpdatedAt = time.Now()

	// Debug: verificar campos recebidos
	fmt.Printf("DEBUG Backend - Campos recebidos: UseManualRate=%v, ManualRate=%v\n", req.UseManualRate, req.ManualRate)

	// Verificar se é uma transferência
	if req.Type == "transfer" {
		// Para transferências, category_id contém o ID da conta destino
		destAccountID := req.CategoryID

		// Buscar as contas de origem e destino
		originAccount, err := h.DB.GetAccountByID(req.AccountID, req.UserID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get origin account", "details": err.Error()})
			return
		}
		if originAccount == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Origin account not found"})
			return
		}

		destAccount, err := h.DB.GetAccountByID(destAccountID, req.UserID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get destination account", "details": err.Error()})
			return
		}
		if destAccount == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Destination account not found"})
			return
		}

		// Buscar ou criar a categoria "Transferência"
		transferCategory, err := h.DB.EnsureTransferCategory()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to ensure transfer category", "details": err.Error()})
			return
		}

		// Gerar ID único para vincular as duas transações
		transferID := uuid.New().String()

		// Calcular valor convertido se as moedas forem diferentes
		var convertedAmount int
		var exchangeRate float64 = 1.0
		var exchangeInfo *services.ExchangeRateResponse

		if originAccount.Currency != destAccount.Currency {
			// Verificar se deve usar taxa manual
			if req.UseManualRate != nil && *req.UseManualRate && req.ManualRate != nil {
				// Usar taxa manual
				exchangeRate = *req.ManualRate
				amountInCurrency := float64(req.Amount) / 100.0
				convertedAmount = int(amountInCurrency * exchangeRate * 100)
			} else {
				// Usar API de câmbio
				amountInCurrency := float64(req.Amount) / 100.0

				exchangeInfo, err = h.ExchangeService.GetExchangeRate(originAccount.Currency, destAccount.Currency, amountInCurrency)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get exchange rate", "details": err.Error()})
					return
				}

				// Converter o valor convertido de volta para centavos
				convertedAmount = int(exchangeInfo.ConversionResult * 100)
				exchangeRate = exchangeInfo.ConversionRate
			}
		} else {
			convertedAmount = req.Amount
		}

		// Criar observação com informações de câmbio se aplicável
		observation := req.Observation
		if originAccount.Currency != destAccount.Currency {
			exchangeInfo := fmt.Sprintf("Câmbio: %.4f %s/%s", exchangeRate, originAccount.Currency, destAccount.Currency)
			if observation != "" {
				observation = observation + " | " + exchangeInfo
			} else {
				observation = exchangeInfo
			}
		}

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
			Observation:         observation,
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
			Amount:              convertedAmount, // Valor convertido
			Type:                "income",
			CategoryID:          transferCategory.ID,
			AccountID:           destAccountID, // Conta destino
			DueDate:             req.DueDate,
			CompetenceDate:      req.CompetenceDate,
			IsPaid:              req.IsPaid,
			Observation:         observation,
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

		// Preparar resposta com informações de câmbio
		response := gin.H{
			"debit_transaction":  debitTx,
			"credit_transaction": creditTx,
			"transfer_id":        transferID,
		}

		// Adicionar informações de câmbio se aplicável
		if originAccount.Currency != destAccount.Currency {
			response["exchange_info"] = gin.H{
				"from_currency":    originAccount.Currency,
				"to_currency":      destAccount.Currency,
				"exchange_rate":    exchangeRate,
				"original_amount":  req.Amount,
				"converted_amount": convertedAmount,
			}
		}

		// Retornar as duas transações criadas
		c.JSON(http.StatusCreated, response)
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
