package main

import (
	"fmt"
	"net/http"
	"os"
	"time"
)

const (
	BACKEND_URL = "https://my-personal-finance.onrender.com/health"
	INTERVAL    = 5 * time.Second
)

func getBackendURL() string {
	if url := os.Getenv("REACT_APP_API_BASE_URL"); url != "" {
		// Substitui /api por /health
		return url[:len(url)-4] + "/health"
	}
	return BACKEND_URL
}

func pingBackend() {
	start := time.Now()
	url := getBackendURL()

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Get(url)
	duration := time.Since(start).Milliseconds()

	if err != nil {
		fmt.Printf("[%s] ❌ Error: %v\n", time.Now().Format("2006-01-02 15:04:05"), err)
	} else {
		defer resp.Body.Close()

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
