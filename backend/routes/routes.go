package routes

import (
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/tonnarruda/my-personal-finance/handlers"
)

// SetupRoutes configura todas as rotas da aplicação
func SetupRoutes(categoryHandler *handlers.CategoryHandler, accountHandler *handlers.AccountHandler, authHandler *handlers.AuthHandler, transactionHandler *handlers.TransactionHandler, keepAliveHandler *handlers.KeepAliveHandler) *gin.Engine {
	router := gin.Default()

	// Middleware CORS robusto
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000",
			"https://thefinancer.vercel.app",
			"https://thefinancer.vercel.app/",
			"https://vercel.app",
			"https://*.vercel.app",
			"https://my-personal-finance.vercel.app",
			"https://my-personal-finance.vercel.app/",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With", "Referer"},
		ExposeHeaders:    []string{"Content-Length", "Set-Cookie"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Grupo de rotas para categorias
	categories := router.Group("/api/categories", handlers.SessionAuthMiddleware())
	{
		// Rota OPTIONS para CORS preflight
		categories.OPTIONS("", func(c *gin.Context) {
			c.Status(204)
		})
		categories.OPTIONS("/:id", func(c *gin.Context) {
			c.Status(204)
		})

		categories.POST("", categoryHandler.CreateCategory)
		categories.GET("", categoryHandler.GetAllCategories)
		categories.GET("/by-type", categoryHandler.GetCategoriesByType)
		categories.GET("/with-subcategories", categoryHandler.GetCategoriesWithSubcategories)
		categories.GET("/:id", categoryHandler.GetCategoryByID)
		categories.GET("/:id/subcategories", categoryHandler.GetSubcategories)
		categories.PUT("/:id", categoryHandler.UpdateCategory)
		categories.PATCH("/:id/color", categoryHandler.UpdateCategoryColor)
		categories.DELETE("/:id", categoryHandler.DeleteCategory)
		categories.DELETE("/:id/permanent", categoryHandler.HardDeleteCategory)
	}

	// Grupo de rotas para contas
	accounts := router.Group("/api/accounts", handlers.SessionAuthMiddleware())
	{
		// Rota OPTIONS para CORS preflight
		accounts.OPTIONS("", func(c *gin.Context) {
			c.Status(204)
		})
		accounts.OPTIONS("/:id", func(c *gin.Context) {
			c.Status(204)
		})

		accounts.POST("", accountHandler.CreateAccount)
		accounts.GET("", accountHandler.GetAllAccounts)
		accounts.GET("/:id", accountHandler.GetAccountByID)
		accounts.GET("/:id/initial-transaction", accountHandler.GetInitialTransaction)
		accounts.PUT("/:id", accountHandler.UpdateAccount)
		accounts.DELETE("/:id", accountHandler.DeleteAccount)
	}

	// Grupo de rotas para transações
	transactions := router.Group("/api/transactions", handlers.SessionAuthMiddleware())
	{
		transactions.OPTIONS("", func(c *gin.Context) { c.Status(204) })
		transactions.OPTIONS(":id", func(c *gin.Context) { c.Status(204) })

		transactions.POST("", transactionHandler.CreateTransaction)
		transactions.GET("", transactionHandler.GetAllTransactions)
		transactions.GET(":id", transactionHandler.GetTransactionByID)
		transactions.PUT(":id", transactionHandler.UpdateTransaction)
		transactions.DELETE(":id", transactionHandler.DeleteTransaction)
	}

	// Rotas de autenticação
	router.OPTIONS("/api/signup", func(c *gin.Context) { c.Status(204) })
	router.OPTIONS("/api/login", func(c *gin.Context) { c.Status(204) })
	router.OPTIONS("/api/logout", func(c *gin.Context) { c.Status(204) })
	router.OPTIONS("/api/me", func(c *gin.Context) { c.Status(204) })
	router.POST("/api/signup", authHandler.SignupHandler)
	router.POST("/api/login", authHandler.LoginHandler)
	router.POST("/api/logout", authHandler.LogoutHandler)
	// Proteger rota /api/me
	router.GET("/api/me", handlers.SessionAuthMiddleware(), authHandler.GetMeHandler)

	// Rota de health check
	router.GET("/health", func(c *gin.Context) {
		// Log detalhado da requisição de health check
		log.Printf("[HEALTH-CHECK] ✅ Requisição recebida | IP: %s | User-Agent: %s | Timestamp: %s",
			c.ClientIP(),
			c.GetHeader("User-Agent"),
			time.Now().Format("2006-01-02 15:04:05"),
		)

		c.JSON(200, gin.H{
			"status":    "OK",
			"message":   "My Finance API está funcionando!",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	// Rotas de keep-alive
	router.POST("/api/keep-alive-logs", keepAliveHandler.LogKeepAlive)
	router.GET("/api/keep-alive-stats", keepAliveHandler.GetKeepAliveStats)

	return router
}
