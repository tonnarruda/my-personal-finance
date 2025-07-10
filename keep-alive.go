package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	BACKEND_URL = "https://my-personal-finance.onrender.com"
	INTERVAL    = 1 * time.Second
)

type KeepAliveLog struct {
	Timestamp   string `json:"timestamp"`
	Status      int    `json:"status"`
	Response    string `json:"response"`
	Duration    int64  `json:"duration_ms"`
	Success     bool   `json:"success"`
	Environment string `json:"environment"`
}

func getBackendURL() string {
	if url := os.Getenv("REACT_APP_API_BASE_URL"); url != "" {
		// Remove /api se existir
		if strings.HasSuffix(url, "/api") {
			return url[:len(url)-4]
		}
		return url
	}
	return BACKEND_URL
}

func sendLogToBackend(logData KeepAliveLog) {
	backendURL := getBackendURL()
	logEndpoint := fmt.Sprintf("%s/api/keep-alive-logs", backendURL)

	jsonData, err := json.Marshal(logData)
	if err != nil {
		fmt.Printf("[%s] ❌ Error marshaling log data: %v\n", time.Now().Format("2006-01-02 15:04:05"), err)
		return
	}

	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	resp, err := client.Post(logEndpoint, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		// Não logar erro do envio de log para não fazer spam
		return
	}
	defer resp.Body.Close()
}

func pingBackend() {
	start := time.Now()
	backendURL := getBackendURL()
	healthURL := fmt.Sprintf("%s/health", backendURL)

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(healthURL)
	duration := time.Since(start).Milliseconds()
	timestamp := time.Now().Format("2006-01-02 15:04:05")

	var logData KeepAliveLog
	logData.Timestamp = timestamp
	logData.Duration = duration
	logData.Environment = os.Getenv("ENVIRONMENT")

	if err != nil {
		fmt.Printf("[%s] ❌ Error: %v\n", timestamp, err)

		logData.Status = 0
		logData.Response = err.Error()
		logData.Success = false
	} else {
		defer resp.Body.Close()

		logData.Status = resp.StatusCode
		logData.Response = resp.Status
		logData.Success = resp.StatusCode == 200

		if resp.StatusCode == 200 {
			fmt.Printf("[%s] ✅ Health check: %d %s (%.2fs)\n",
				timestamp,
				resp.StatusCode,
				resp.Status,
				float64(duration)/1000)
		} else {
			fmt.Printf("[%s] ⚠️  Health check: %d %s (%.2fs)\n",
				timestamp,
				resp.StatusCode,
				resp.Status,
				float64(duration)/1000)
		}
	}

	// Enviar log para o backend (de forma assíncrona)
	go sendLogToBackend(logData)
}

func main() {
	backendURL := getBackendURL()

	fmt.Printf("🚀 Starting keep-alive service for %s/health\n", backendURL)
	fmt.Printf("📤 Logs will be sent to: %s/api/keep-alive-logs\n", backendURL)
	fmt.Printf("⏰ Interval: %v\n", INTERVAL)
	fmt.Printf("📅 Started at: %s\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("🌍 Environment: %s\n", os.Getenv("ENVIRONMENT"))
	fmt.Println("")

	// Primeira chamada imediata
	pingBackend()

	// Configurar ticker para chamadas periódicas
	ticker := time.NewTicker(INTERVAL)
	defer ticker.Stop()

	// Canal para graceful shutdown
	sigChan := make(chan os.Signal, 1)

	// Loop principal
	for {
		select {
		case <-ticker.C:
			pingBackend()
		case <-sigChan:
			fmt.Println("\n🛑 Shutting down keep-alive service...")
			return
		}
	}
}
