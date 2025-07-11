package structs

import (
	"fmt"
	"time"

	"github.com/tonnarruda/my-personal-finance/utils"
)

// CategoryType representa o tipo da categoria (receita, despesa, transferência)
type CategoryType string

const (
	CategoryTypeIncome   CategoryType = "income"   // Receita
	CategoryTypeExpense  CategoryType = "expense"  // Despesa
	CategoryTypeTransfer CategoryType = "transfer" // Transferência
)

// Category representa uma categoria financeira
type Category struct {
	ID          string       `json:"id" db:"id"`
	Name        string       `json:"name" db:"name"`
	Description string       `json:"description" db:"description"`
	Type        CategoryType `json:"type" db:"type"`
	Color       string       `json:"color" db:"color"`
	Icon        string       `json:"icon" db:"icon"`
	ParentID    *string      `json:"parent_id,omitempty" db:"parent_id"`
	IsActive    bool         `json:"is_active" db:"is_active"`
	Visible     bool         `json:"visible" db:"visible"`
	CreatedAt   time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at" db:"updated_at"`
	DeletedAt   *time.Time   `json:"deleted_at,omitempty" db:"deleted_at"`
	UserID      string       `json:"user_id" db:"user_id"`
}

// CategoryWithSubcategories representa uma categoria com suas subcategorias
type CategoryWithSubcategories struct {
	Category
	Subcategories []Category `json:"subcategories"`
}

// CreateCategoryRequest representa a requisição para criar uma categoria
type CreateCategoryRequest struct {
	Name        string       `json:"name" binding:"required"`
	Description string       `json:"description"`
	Type        CategoryType `json:"type" binding:"required"`
	Color       string       `json:"color"`
	Icon        string       `json:"icon"`
	ParentID    *string      `json:"parent_id"`
	Visible     *bool        `json:"visible"`
	UserID      string       `json:"user_id"`
}

// UpdateCategoryRequest representa a requisição para atualizar uma categoria
type UpdateCategoryRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Color       string `json:"color"`
	Icon        string `json:"icon"`
	IsActive    *bool  `json:"is_active"`
	Visible     *bool  `json:"visible"`
	UserID      string `json:"user_id" binding:"required"`
}

// NewCategory cria uma nova instância de Category
func NewCategory(req CreateCategoryRequest) Category {
	now := time.Now()
	visible := true
	if req.Visible != nil {
		visible = *req.Visible
	}
	return Category{
		ID:          utils.GenerateUUID(),
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		Color:       req.Color,
		Icon:        req.Icon,
		ParentID:    req.ParentID,
		IsActive:    true,
		Visible:     visible,
		CreatedAt:   now,
		UpdatedAt:   now,
		UserID:      req.UserID,
	}
}

// IsValidUUID verifica se uma string é um UUID válido
func IsValidUUID(u string) bool {
	return utils.IsValidUUID(u)
}

// ValidateParentID valida se o ParentID é um UUID válido (se fornecido)
func (req *CreateCategoryRequest) ValidateParentID() error {
	if req.ParentID != nil && !utils.IsValidUUID(*req.ParentID) {
		return fmt.Errorf("parent_id deve ser um UUID válido")
	}
	return nil
}
