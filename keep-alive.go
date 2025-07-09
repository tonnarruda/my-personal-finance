package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

const (
	BACKEND_URL = "https://my-personal-finance.onrender.com/health"
	LOG_URL     = "https://my-personal-finance.onrender.com/api/keep-alive-logs"
	INTERVAL    = 20 * time.Second
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
		// Substitui /api por /health
		return url[:len(url)-4] + "/health"
	}
	return BACKEND_URL
}

func getLogURL() string {
	if url := os.Getenv("REACT_APP_API_BASE_URL"); url != "" {
		return url + "/keep-alive-logs"
	}
	return LOG_URL
}

func pingBackend() {
	start := time.Now()
	url := getBackendURL()

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(url)
	duration := time.Since(start).Milliseconds()

	log := KeepAliveLog{
		Timestamp:   time.Now().Format(time.RFC3339),
		Duration:    duration,
		Environment: os.Getenv("ENVIRONMENT") + " (keep-alive)",
	}

	if err != nil {
		log.Status = 0
		log.Response = fmt.Sprintf("Error: %v", err)
		log.Success = false
		fmt.Printf("[%s] ❌ Error: %v\n", time.Now().Format("2006-01-02 15:04:05"), err)
	} else {
		defer resp.Body.Close()

		body, _ := io.ReadAll(resp.Body)
		log.Status = resp.StatusCode
		log.Response = string(body)
		log.Success = resp.StatusCode == 200

		if resp.StatusCode == 200 {
			fmt.Printf("[%s] ✅ Health check: %d %s (%.2fs)\n",
				time.Now().Format("2006-01-02 15:04:05"),
				resp.StatusCode,
				resp.Status,
				float64(duration)/1000)
		} else {
			fmt.Printf("[%s] ⚠️  Health check: %d %s (%.2fs)\n",
				time.Now().Format("2006-01-02 15:04:05"),
				resp.StatusCode,
				resp.Status,
				float64(duration)/1000)
		}
	}

	// Enviar log para o backend
	sendLogToBackend(log)
}

func sendLogToBackend(log KeepAliveLog) {
	logURL := getLogURL()

	jsonData, err := json.Marshal(log)
	if err != nil {
		fmt.Printf("[%s] ❌ Error marshaling log: %v\n",
			time.Now().Format("2006-01-02 15:04:05"), err)
		return
	}

	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	req, err := http.NewRequest("POST", logURL, bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("[%s] ❌ Error creating request: %v\n",
			time.Now().Format("2006-01-02 15:04:05"), err)
		return
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("[%s] ❌ Error sending log to backend: %v\n",
			time.Now().Format("2006-01-02 15:04:05"), err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		fmt.Printf("[%s] 📝 Log sent to backend successfully\n",
			time.Now().Format("2006-01-02 15:04:05"))
	} else {
		fmt.Printf("[%s] ⚠️  Log sent to backend with status: %d\n",
			time.Now().Format("2006-01-02 15:04:05"), resp.StatusCode)
	}
}

func main() {
	backendURL := getBackendURL()

	fmt.Printf("🚀 Starting keep-alive service for %s\n", backendURL)
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
