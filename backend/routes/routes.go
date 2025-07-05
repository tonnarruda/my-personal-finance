package routes

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/tonnarruda/my-personal-finance/handlers"
)

// SetupRoutes configura todas as rotas da aplicação
func SetupRoutes(categoryHandler *handlers.CategoryHandler) *gin.Engine {
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

		// Criar nova categoria
		categories.POST("", categoryHandler.CreateCategory)

		// Buscar todas as categorias
		categories.GET("", categoryHandler.GetAllCategories)

		// Buscar categorias por tipo
		categories.GET("/by-type", categoryHandler.GetCategoriesByType)

		// Buscar categorias com subcategorias
		categories.GET("/with-subcategories", categoryHandler.GetCategoriesWithSubcategories)

		// Buscar categoria por ID
		categories.GET("/:id", categoryHandler.GetCategoryByID)

		// Buscar subcategorias de uma categoria pai (ajustado para evitar conflito)
		categories.GET("/:id/subcategories", categoryHandler.GetSubcategories)

		// Atualizar categoria
		categories.PUT("/:id", categoryHandler.UpdateCategory)

		// Remover categoria (soft delete)
		categories.DELETE("/:id", categoryHandler.DeleteCategory)

		// Remover categoria permanentemente
		categories.DELETE("/:id/permanent", categoryHandler.HardDeleteCategory)
	}

	// Rota de health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "OK",
			"message": "My Finance API está funcionando!",
		})
	})

	return router
}
