package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/tonnarruda/my-personal-finance/handlers"
)

// SetupRoutes configura todas as rotas da aplicação
func SetupRoutes(categoryHandler *handlers.CategoryHandler, authHandler *handlers.AuthHandler) *gin.Engine {
	router := gin.Default()

	// Middleware CORS robusto
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Grupo de rotas para categorias
	categories := router.Group("/api/categories")
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
		categories.GET("/:id", categoryHandler.GetCategoryByID)
		categories.GET("/:id/subcategories", categoryHandler.GetSubcategories)
		categories.PUT("/:id", categoryHandler.UpdateCategory)
		categories.PATCH("/:id/color", categoryHandler.UpdateCategoryColor)
		categories.DELETE("/:id", categoryHandler.DeleteCategory)
		categories.DELETE("/:id/permanent", categoryHandler.HardDeleteCategory)
	}

	// Rotas de autenticação
	router.POST("/api/signup", authHandler.SignupHandler)
	router.POST("/api/login", authHandler.LoginHandler)

	// Rota de health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "OK",
			"message": "My Finance API está funcionando!",
		})
	})

	return router
}
