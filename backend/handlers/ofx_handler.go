package handlers

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/tonnarruda/my-personal-finance/database"
	"github.com/tonnarruda/my-personal-finance/structs"
)

type OFXHandler struct {
	DB *database.Database
}

func NewOFXHandler(db *database.Database) *OFXHandler {
	return &OFXHandler{DB: db}
}

// ImportOFXResponse representa a resposta da importação OFX
type ImportOFXResponse struct {
	Success              bool     `json:"success"`
	Message              string   `json:"message"`
	TransactionsImported int      `json:"transactions_imported"`
	TransactionsSkipped  int      `json:"transactions_skipped"`
	Errors               []string `json:"errors,omitempty"`
}

// PreviewOFXResponse representa a resposta da pré-visualização OFX
type PreviewOFXResponse struct {
	Success      bool                `json:"success"`
	Message      string              `json:"message"`
	Transactions []OFXTransactionDTO `json:"transactions"`
	Errors       []string            `json:"errors,omitempty"`
}

// OFXTransactionDTO representa uma transação OFX para o frontend
type OFXTransactionDTO struct {
	ID          string    `json:"id"`
	Amount      float64   `json:"amount"`
	Date        time.Time `json:"date"`
	Description string    `json:"description"`
	Memo        string    `json:"memo"`
	Type        string    `json:"type"` // "income" ou "expense"
}

// ImportOFX processa arquivo OFX e importa transações
func (h *OFXHandler) ImportOFX(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id é obrigatório"})
		return
	}

	// Parse do formulário multipart
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao processar formulário", "details": err.Error()})
		return
	}

	// Obter account_id do formulário
	accountIDs := form.Value["account_id"]
	if len(accountIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "account_id é obrigatório"})
		return
	}
	accountID := accountIDs[0]

	// Verificar se a conta existe e pertence ao usuário
	account, err := h.DB.GetAccountByID(accountID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar conta", "details": err.Error()})
		return
	}
	if account == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Conta não encontrada"})
		return
	}

	// Obter arquivo OFX
	files := form.File["ofx_file"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Arquivo OFX é obrigatório"})
		return
	}
	file := files[0]

	// Abrir arquivo
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao abrir arquivo", "details": err.Error()})
		return
	}
	defer src.Close()

	// Ler conteúdo do arquivo
	content, err := io.ReadAll(src)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ler arquivo", "details": err.Error()})
		return
	}

	// Processar arquivo OFX
	response, err := h.processOFXFile(content, accountID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao processar arquivo OFX", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// processOFXFile processa o conteúdo do arquivo OFX
func (h *OFXHandler) processOFXFile(content []byte, accountID, userID string) (*ImportOFXResponse, error) {
	response := &ImportOFXResponse{
		Success: true,
		Message: "Arquivo OFX processado com sucesso",
		Errors:  []string{},
	}

	// Parse do arquivo OFX usando parsing manual
	transactions, err := h.parseOFXManually(content)
	if err != nil {
		return nil, fmt.Errorf("erro ao fazer parse do arquivo OFX: %v", err)
	}

	// Buscar ou criar categoria padrão para importação
	defaultCategory, err := h.DB.EnsureTransferCategory()
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar categoria padrão: %v", err)
	}

	// Processar cada transação encontrada
	for _, ofxTx := range transactions {
		// Converter transação OFX para nossa estrutura
		tx, err := h.convertOFXTransactionManual(ofxTx, accountID, userID, defaultCategory.ID)
		if err != nil {
			response.Errors = append(response.Errors, fmt.Sprintf("Erro ao converter transação: %v", err))
			response.TransactionsSkipped++
			continue
		}

		// Verificar se transação já existe (por data, valor e descrição)
		exists, err := h.transactionExists(tx, userID)
		if err != nil {
			response.Errors = append(response.Errors, fmt.Sprintf("Erro ao verificar transação existente: %v", err))
			response.TransactionsSkipped++
			continue
		}

		if exists {
			response.TransactionsSkipped++
			continue
		}

		// Criar transação no banco
		if err := h.DB.CreateTransaction(*tx); err != nil {
			response.Errors = append(response.Errors, fmt.Sprintf("Erro ao criar transação: %v", err))
			response.TransactionsSkipped++
			continue
		}

		response.TransactionsImported++
	}

	// Atualizar mensagem de sucesso
	if response.TransactionsImported > 0 {
		response.Message = fmt.Sprintf("Importação concluída! %d transações importadas, %d ignoradas.",
			response.TransactionsImported, response.TransactionsSkipped)
	} else {
		response.Message = "Nenhuma transação nova encontrada para importar."
	}

	return response, nil
}

// PreviewOFX faz o parsing do arquivo OFX e retorna as transações encontradas para revisão
func (h *OFXHandler) PreviewOFX(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id é obrigatório"})
		return
	}

	fileHeader, err := c.FormFile("ofx_file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao obter arquivo OFX", "details": err.Error()})
		return
	}

	// Abrir o arquivo
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao abrir arquivo OFX", "details": err.Error()})
		return
	}
	defer file.Close()

	// Ler o conteúdo do arquivo
	content, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ler arquivo OFX", "details": err.Error()})
		return
	}

	// Parse do arquivo OFX
	transactions, err := h.parseOFXManually(content)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Erro ao fazer parse do arquivo OFX", "details": err.Error()})
		return
	}

	// Converter para DTOs
	var transactionDTOs []OFXTransactionDTO
	for _, tx := range transactions {
		txType := "expense"
		if tx.Amount > 0 {
			txType = "income"
		}

		dto := OFXTransactionDTO{
			ID:          tx.ID,
			Amount:      tx.Amount,
			Date:        tx.Date,
			Description: tx.Description,
			Memo:        tx.Memo,
			Type:        txType,
		}
		transactionDTOs = append(transactionDTOs, dto)
	}

	response := &PreviewOFXResponse{
		Success:      true,
		Message:      fmt.Sprintf("Arquivo OFX processado com sucesso. %d transações encontradas.", len(transactionDTOs)),
		Transactions: transactionDTOs,
		Errors:       []string{},
	}

	c.JSON(http.StatusOK, response)
}

// OFXTransaction representa uma transação extraída do arquivo OFX
type OFXTransaction struct {
	Amount      float64
	Date        time.Time
	Description string
	Memo        string
	ID          string
}

// parseOFXManually faz o parsing manual do arquivo OFX
func (h *OFXHandler) parseOFXManually(content []byte) ([]OFXTransaction, error) {
	var transactions []OFXTransaction
	contentStr := string(content)

	// Procurar por blocos STMTTRN (transações)
	lines := strings.Split(contentStr, "\n")
	var currentTx *OFXTransaction

	for _, line := range lines {
		line = strings.TrimSpace(line)

		if line == "<STMTTRN>" {
			currentTx = &OFXTransaction{}
		} else if line == "</STMTTRN>" && currentTx != nil {
			// Finalizar transação atual
			if currentTx.Amount != 0 && !currentTx.Date.IsZero() {
				transactions = append(transactions, *currentTx)
			}
			currentTx = nil
		} else if currentTx != nil {
			// Processar campos da transação
			if strings.HasPrefix(line, "<TRNAMT>") {
				amountStr := strings.TrimPrefix(line, "<TRNAMT>")
				if amount, err := parseFloat(amountStr); err == nil {
					currentTx.Amount = amount
				}
			} else if strings.HasPrefix(line, "<DTPOSTED>") {
				dateStr := strings.TrimPrefix(line, "<DTPOSTED>")
				if date, err := parseOFXDate(dateStr); err == nil {
					currentTx.Date = date
				}
			} else if strings.HasPrefix(line, "<NAME>") {
				currentTx.Description = strings.TrimPrefix(line, "<NAME>")
			} else if strings.HasPrefix(line, "<MEMO>") {
				currentTx.Memo = strings.TrimPrefix(line, "<MEMO>")
			} else if strings.HasPrefix(line, "<FITID>") {
				currentTx.ID = strings.TrimPrefix(line, "<FITID>")
			}
		}
	}

	return transactions, nil
}

// convertOFXTransactionManual converte uma transação OFX manual para nossa estrutura
func (h *OFXHandler) convertOFXTransactionManual(ofxTx OFXTransaction, accountID, userID, categoryID string) (*structs.Transaction, error) {
	// Determinar tipo da transação baseado no valor
	txType := "expense"
	if ofxTx.Amount > 0 {
		txType = "income"
	}

	// Converter valor para centavos (multiplicar por 100)
	amount := int(ofxTx.Amount * 100)
	if amount < 0 {
		amount = -amount // Garantir que o valor seja positivo
	}

	// Usar data da transação ou data atual se não disponível
	datePosted := ofxTx.Date
	if datePosted.IsZero() {
		datePosted = time.Now()
	}

	// Criar descrição limpa
	description := strings.TrimSpace(ofxTx.Description)
	if description == "" {
		description = strings.TrimSpace(ofxTx.Memo)
	}
	if description == "" {
		description = "Transação importada"
	}

	// Criar transação
	tx := &structs.Transaction{
		ID:             uuid.New().String(),
		UserID:         userID,
		Description:    description,
		Amount:         amount,
		Type:           txType,
		CategoryID:     categoryID,
		AccountID:      accountID,
		DueDate:        datePosted,
		CompetenceDate: datePosted,
		IsPaid:         true, // Transações importadas são consideradas pagas
		Observation:    fmt.Sprintf("Importado via OFX - %s", ofxTx.ID),
		IsRecurring:    false,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	return tx, nil
}

// parseFloat converte string para float64
func parseFloat(s string) (float64, error) {
	// Remover caracteres não numéricos exceto ponto e sinal
	s = strings.TrimSpace(s)

	// Se a string está vazia, retornar 0
	if s == "" {
		return 0, nil
	}

	// Converter para float64
	var result float64
	_, err := fmt.Sscanf(s, "%f", &result)
	return result, err
}

// parseOFXDate converte data OFX para time.Time
func parseOFXDate(dateStr string) (time.Time, error) {
	// Formato OFX: YYYYMMDDHHMMSS ou YYYYMMDD
	dateStr = strings.TrimSpace(dateStr)
	if len(dateStr) >= 8 {
		year := dateStr[0:4]
		month := dateStr[4:6]
		day := dateStr[6:8]

		dateStr = fmt.Sprintf("%s-%s-%s", year, month, day)
		return time.Parse("2006-01-02", dateStr)
	}
	return time.Time{}, fmt.Errorf("formato de data inválido: %s", dateStr)
}

// transactionExists verifica se uma transação já existe
func (h *OFXHandler) transactionExists(tx *structs.Transaction, userID string) (bool, error) {
	// Buscar transações do usuário na mesma data e com valor similar
	transactions, err := h.DB.GetAllTransactionsByUser(userID)
	if err != nil {
		return false, err
	}

	for _, existingTx := range transactions {
		// Verificar se é a mesma conta
		if existingTx.AccountID != tx.AccountID {
			continue
		}

		// Verificar se é a mesma data (com tolerância de 1 dia)
		dateDiff := existingTx.DueDate.Sub(tx.DueDate)
		if dateDiff < -24*time.Hour || dateDiff > 24*time.Hour {
			continue
		}

		// Verificar se é o mesmo valor (com tolerância de 1 centavo)
		amountDiff := existingTx.Amount - tx.Amount
		if amountDiff < -1 || amountDiff > 1 {
			continue
		}

		// Verificar se a descrição é similar
		if strings.Contains(strings.ToLower(existingTx.Description), strings.ToLower(tx.Description)) ||
			strings.Contains(strings.ToLower(tx.Description), strings.ToLower(existingTx.Description)) {
			return true, nil
		}
	}

	return false, nil
}
