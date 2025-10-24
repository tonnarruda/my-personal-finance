package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tonnarruda/my-personal-finance/services"
)

type ExchangeHandler struct {
	exchangeService services.ExchangeServiceInterface
}

// NewExchangeHandler cria uma nova instância do handler de câmbio
func NewExchangeHandler(exchangeService services.ExchangeServiceInterface) *ExchangeHandler {
	return &ExchangeHandler{
		exchangeService: exchangeService,
	}
}

// GetExchangeRateRequest representa a requisição para obter taxa de câmbio
type GetExchangeRateRequest struct {
	FromCurrency string  `json:"from_currency" binding:"required"`
	ToCurrency   string  `json:"to_currency" binding:"required"`
	Amount       float64 `json:"amount" binding:"required,min=0"`
}

// GetExchangeRate obtém a taxa de câmbio entre duas moedas
func (h *ExchangeHandler) GetExchangeRate(c *gin.Context) {
	var req GetExchangeRateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	// Validar moedas suportadas
	supportedCurrencies := []string{"BRL", "USD", "EUR", "GBP", "JPY", "CAD", "AUD"}
	if !isValidCurrency(req.FromCurrency, supportedCurrencies) || !isValidCurrency(req.ToCurrency, supportedCurrencies) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Moeda não suportada"})
		return
	}

	exchangeRate, err := h.exchangeService.GetExchangeRate(req.FromCurrency, req.ToCurrency, req.Amount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao obter taxa de câmbio", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, exchangeRate)
}

// GetExchangeRateSimple obtém apenas a taxa de câmbio (sem conversão de valor)
func (h *ExchangeHandler) GetExchangeRateSimple(c *gin.Context) {
	fromCurrency := c.Query("from")
	toCurrency := c.Query("to")

	if fromCurrency == "" || toCurrency == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parâmetros 'from' e 'to' são obrigatórios"})
		return
	}

	// Validar moedas suportadas
	supportedCurrencies := []string{"BRL", "USD", "EUR", "GBP", "JPY", "CAD", "AUD"}
	if !isValidCurrency(fromCurrency, supportedCurrencies) || !isValidCurrency(toCurrency, supportedCurrencies) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Moeda não suportada"})
		return
	}

	rate, err := h.exchangeService.GetExchangeRateSimple(fromCurrency, toCurrency)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao obter taxa de câmbio", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"from_currency": fromCurrency,
		"to_currency":   toCurrency,
		"rate":          rate,
	})
}

// isValidCurrency verifica se a moeda é válida
func isValidCurrency(currency string, supportedCurrencies []string) bool {
	for _, supported := range supportedCurrencies {
		if currency == supported {
			return true
		}
	}
	return false
}
