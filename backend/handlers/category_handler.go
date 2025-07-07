package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/tonnarruda/my-personal-finance/services"
	"github.com/tonnarruda/my-personal-finance/structs"
	"github.com/tonnarruda/my-personal-finance/utils"
)

type CategoryHandler struct {
	categoryService *services.CategoryService
}

// NewCategoryHandler cria uma nova instância do handler de categorias
func NewCategoryHandler(categoryService *services.CategoryService) *CategoryHandler {
	return &CategoryHandler{
		categoryService: categoryService,
	}
}

// CreateCategory cria uma nova categoria
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req structs.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dados inválidos: " + err.Error(),
		})
		return
	}

	category, err := h.categoryService.CreateCategory(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Categoria criada com sucesso",
		"category": category,
	})
}

// GetCategoryByID busca uma categoria pelo ID
func (h *CategoryHandler) GetCategoryByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID da categoria é obrigatório",
		})
		return
	}

	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID deve ser um UUID válido",
		})
		return
	}

	category, err := h.categoryService.GetCategoryByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"category": category,
	})
}

// GetAllCategories busca todas as categorias
func (h *CategoryHandler) GetAllCategories(c *gin.Context) {
	categories, err := h.categoryService.GetAllCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}

// GetCategoriesByType busca categorias por tipo
func (h *CategoryHandler) GetCategoriesByType(c *gin.Context) {
	categoryType := c.Query("type")
	if categoryType == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Tipo da categoria é obrigatório (income ou expense)",
		})
		return
	}

	// Validar o tipo da categoria
	if categoryType != string(structs.CategoryTypeIncome) && categoryType != string(structs.CategoryTypeExpense) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Tipo da categoria deve ser 'income' ou 'expense'",
		})
		return
	}

	categories, err := h.categoryService.GetCategoriesByType(structs.CategoryType(categoryType))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}

// GetCategoriesWithSubcategories busca categorias principais com suas subcategorias
func (h *CategoryHandler) GetCategoriesWithSubcategories(c *gin.Context) {
	categoryType := c.Query("type")
	if categoryType == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Tipo da categoria é obrigatório (income ou expense)",
		})
		return
	}

	// Validar o tipo da categoria
	if categoryType != string(structs.CategoryTypeIncome) && categoryType != string(structs.CategoryTypeExpense) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Tipo da categoria deve ser 'income' ou 'expense'",
		})
		return
	}

	categories, err := h.categoryService.GetCategoriesWithSubcategories(structs.CategoryType(categoryType))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}

// GetSubcategories busca as subcategorias de uma categoria pai
func (h *CategoryHandler) GetSubcategories(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID da categoria pai é obrigatório",
		})
		return
	}

	// Validar se o id é um UUID válido
	if !utils.IsValidUUID(id) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID da categoria pai deve ser um UUID válido",
		})
		return
	}

	subcategories, err := h.categoryService.GetSubcategories(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"subcategories": subcategories,
	})
}

// UpdateCategory atualiza uma categoria existente
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID da categoria é obrigatório",
		})
		return
	}

	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID deve ser um UUID válido",
		})
		return
	}

	var req structs.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dados inválidos: " + err.Error(),
		})
		return
	}

	category, err := h.categoryService.UpdateCategory(id, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Categoria atualizada com sucesso",
		"category": category,
	})
}

// DeleteCategory remove uma categoria (soft delete)
func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID da categoria é obrigatório",
		})
		return
	}

	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID deve ser um UUID válido",
		})
		return
	}

	err := h.categoryService.DeleteCategory(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Categoria removida com sucesso",
	})
}

// HardDeleteCategory remove uma categoria permanentemente
func (h *CategoryHandler) HardDeleteCategory(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID da categoria é obrigatório",
		})
		return
	}

	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID deve ser um UUID válido",
		})
		return
	}

	err := h.categoryService.HardDeleteCategory(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Categoria removida permanentemente",
	})
}

// UpdateCategoryColor atualiza apenas a cor de uma categoria e suas subcategorias
func (h *CategoryHandler) UpdateCategoryColor(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID da categoria é obrigatório",
		})
		return
	}

	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID deve ser um UUID válido",
		})
		return
	}

	var req struct {
		Color string `json:"color" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cor é obrigatória: " + err.Error(),
		})
		return
	}

	category, err := h.categoryService.UpdateCategoryColor(id, req.Color)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Cor da categoria e subcategorias atualizada com sucesso",
		"category": category,
	})
}
