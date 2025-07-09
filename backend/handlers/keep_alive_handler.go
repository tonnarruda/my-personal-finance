package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type KeepAliveLog struct {
	Timestamp   string `json:"timestamp"`
	Status      int    `json:"status"`
	Response    string `json:"response"`
	Duration    int64  `json:"duration_ms"`
	Success     bool   `json:"success"`
	Environment string `json:"environment"`
}

type KeepAliveHandler struct{}

func NewKeepAliveHandler() *KeepAliveHandler {
	return &KeepAliveHandler{}
}

// LogKeepAlive recebe logs do serviço keep-alive
func (h *KeepAliveHandler) LogKeepAlive(c *gin.Context) {
	var keepAliveLog KeepAliveLog

	if err := c.ShouldBindJSON(&keepAliveLog); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid JSON payload",
		})
		return
	}

	// Log no console do servidor
	log.Printf("[KEEP-ALIVE] %s | Status: %d | Duration: %dms | Success: %t | Env: %s",
		keepAliveLog.Timestamp,
		keepAliveLog.Status,
		keepAliveLog.Duration,
		keepAliveLog.Success,
		keepAliveLog.Environment,
	)

	// Log detalhado se houver erro
	if !keepAliveLog.Success {
		log.Printf("[KEEP-ALIVE ERROR] Response: %s", keepAliveLog.Response)
	}

	// Responder com sucesso
	c.JSON(http.StatusOK, gin.H{
		"message":   "Keep-alive log received",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// GetKeepAliveStats retorna estatísticas dos logs de keep-alive
func (h *KeepAliveHandler) GetKeepAliveStats(c *gin.Context) {
	// Por enquanto retorna dados mockados
	// Em uma implementação real, você salvaria os logs no banco
	c.JSON(http.StatusOK, gin.H{
		"total_checks": 0,
		"success_rate": 0.0,
		"avg_duration": 0,
		"last_check":   time.Now().Format(time.RFC3339),
		"status":       "active",
	})
}
