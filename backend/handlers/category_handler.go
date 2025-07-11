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
	// Obter user_id do query parameter
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id é obrigatório",
		})
		return
	}

	var req structs.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Dados inválidos: " + err.Error(),
		})
		return
	}

	// Definir o user_id no request
	req.UserID = userID

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
	// Obter user_id do corpo da requisição
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id é obrigatório",
		})
		return
	}

	categories, err := h.categoryService.GetAllCategories(userID)
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

	// Obter user_id do corpo da requisição
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id é obrigatório",
		})
		return
	}

	// Validar o tipo da categoria
	if categoryType != string(structs.CategoryTypeIncome) && categoryType != string(structs.CategoryTypeExpense) && categoryType != string(structs.CategoryTypeTransfer) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Tipo da categoria deve ser 'income', 'expense' ou 'transfer'",
		})
		return
	}

	categories, err := h.categoryService.GetCategoriesByType(userID, structs.CategoryType(categoryType))
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

	// Obter user_id do corpo da requisição
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id é obrigatório",
		})
		return
	}

	// Validar o tipo da categoria
	if categoryType != string(structs.CategoryTypeIncome) && categoryType != string(structs.CategoryTypeExpense) && categoryType != string(structs.CategoryTypeTransfer) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Tipo da categoria deve ser 'income', 'expense' ou 'transfer'",
		})
		return
	}

	categories, err := h.categoryService.GetCategoriesWithSubcategories(userID, structs.CategoryType(categoryType))
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

	// Obter user_id do corpo da requisição
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id é obrigatório",
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

	subcategories, err := h.categoryService.GetSubcategories(id, userID)
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

	// Obter user_id do corpo da requisição
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id é obrigatório",
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

	err := h.categoryService.DeleteCategory(id, userID)
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

	// Obter user_id do corpo da requisição
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "user_id é obrigatório",
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

	category, err := h.categoryService.UpdateCategoryColor(id, req.Color, userID)
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
