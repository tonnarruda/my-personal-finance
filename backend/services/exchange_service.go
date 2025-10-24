package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// ExchangeServiceInterface define a interface para serviços de câmbio
type ExchangeServiceInterface interface {
	GetExchangeRate(fromCurrency, toCurrency string, amount float64) (*ExchangeRateResponse, error)
	GetExchangeRateSimple(fromCurrency, toCurrency string) (float64, error)
}

// ExchangeRateResponse representa a resposta da API de câmbio
type ExchangeRateResponse struct {
	Result             string             `json:"result"`
	Documentation      string             `json:"documentation"`
	TermsOfUse         string             `json:"terms_of_use"`
	TimeLastUpdateUnix int64              `json:"time_last_update_unix"`
	TimeLastUpdateUTC  string             `json:"time_last_update_utc"`
	TimeNextUpdateUnix int64              `json:"time_next_update_unix"`
	TimeNextUpdateUTC  string             `json:"time_next_update_utc"`
	BaseCode           string             `json:"base_code"`
	TargetCode         string             `json:"target_code"`
	ConversionRate     float64            `json:"conversion_rate"`
	ConversionResult   float64            `json:"conversion_result"`
}

// ExchangeService serviço para obter taxas de câmbio
type ExchangeService struct {
	apiKey string
	client *http.Client
}

// NewExchangeService cria uma nova instância do serviço de câmbio
func NewExchangeService(apiKey string) *ExchangeService {
	return &ExchangeService{
		apiKey: apiKey,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetExchangeRate obtém a taxa de câmbio entre duas moedas
func (s *ExchangeService) GetExchangeRate(fromCurrency, toCurrency string, amount float64) (*ExchangeRateResponse, error) {
	// Se as moedas são iguais, retorna taxa 1:1
	if fromCurrency == toCurrency {
		return &ExchangeRateResponse{
			Result:             "success",
			BaseCode:           fromCurrency,
			TargetCode:         toCurrency,
			ConversionRate:     1.0,
			ConversionResult:   amount,
			TimeLastUpdateUnix: time.Now().Unix(),
		}, nil
	}

	// URL da API ExchangeRate-API (versão gratuita)
	url := fmt.Sprintf("https://v6.exchangerate-api.com/v6/%s/pair/%s/%s/%.2f", 
		s.apiKey, fromCurrency, toCurrency, amount)

	resp, err := s.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("erro ao fazer requisição para API de câmbio: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API de câmbio retornou status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("erro ao ler resposta da API de câmbio: %w", err)
	}

	var exchangeResponse ExchangeRateResponse
	if err := json.Unmarshal(body, &exchangeResponse); err != nil {
		return nil, fmt.Errorf("erro ao decodificar resposta da API de câmbio: %w", err)
	}

	if exchangeResponse.Result != "success" {
		return nil, fmt.Errorf("API de câmbio retornou erro: %s", exchangeResponse.Result)
	}

	return &exchangeResponse, nil
}

// GetExchangeRateSimple obtém apenas a taxa de câmbio (sem conversão de valor)
func (s *ExchangeService) GetExchangeRateSimple(fromCurrency, toCurrency string) (float64, error) {
	response, err := s.GetExchangeRate(fromCurrency, toCurrency, 1.0)
	if err != nil {
		return 0, err
	}
	return response.ConversionRate, nil
}

// MockExchangeService para desenvolvimento/testes (sem API key)
type MockExchangeService struct{}

// NewMockExchangeService cria um serviço mock para desenvolvimento
func NewMockExchangeService() *MockExchangeService {
	return &MockExchangeService{}
}

// GetExchangeRate retorna taxas mockadas para desenvolvimento
func (m *MockExchangeService) GetExchangeRate(fromCurrency, toCurrency string, amount float64) (*ExchangeRateResponse, error) {
	// Taxas mockadas para desenvolvimento
	rates := map[string]float64{
		"BRL_USD": 0.20,  // 1 BRL = 0.20 USD
		"USD_BRL": 5.00,  // 1 USD = 5.00 BRL
		"BRL_EUR": 0.18,  // 1 BRL = 0.18 EUR
		"EUR_BRL": 5.56,  // 1 EUR = 5.56 BRL
		"USD_EUR": 0.85,  // 1 USD = 0.85 EUR
		"EUR_USD": 1.18,  // 1 EUR = 1.18 USD
	}

	// Se as moedas são iguais
	if fromCurrency == toCurrency {
		return &ExchangeRateResponse{
			Result:             "success",
			BaseCode:           fromCurrency,
			TargetCode:         toCurrency,
			ConversionRate:     1.0,
			ConversionResult:   amount,
			TimeLastUpdateUnix: time.Now().Unix(),
		}, nil
	}

	// Buscar taxa de câmbio
	rateKey := fmt.Sprintf("%s_%s", fromCurrency, toCurrency)
	rate, exists := rates[rateKey]
	if !exists {
		return nil, fmt.Errorf("taxa de câmbio não encontrada para %s -> %s", fromCurrency, toCurrency)
	}

	convertedAmount := amount * rate

	return &ExchangeRateResponse{
		Result:             "success",
		BaseCode:           fromCurrency,
		TargetCode:         toCurrency,
		ConversionRate:     rate,
		ConversionResult:   convertedAmount,
		TimeLastUpdateUnix: time.Now().Unix(),
	}, nil
}

// GetExchangeRateSimple obtém apenas a taxa de câmbio (sem conversão de valor)
func (m *MockExchangeService) GetExchangeRateSimple(fromCurrency, toCurrency string) (float64, error) {
	response, err := m.GetExchangeRate(fromCurrency, toCurrency, 1.0)
	if err != nil {
		return 0, err
	}
	return response.ConversionRate, nil
}
