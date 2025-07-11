package services

import (
	"fmt"

	"github.com/tonnarruda/my-personal-finance/database"
	"github.com/tonnarruda/my-personal-finance/structs"
	"github.com/tonnarruda/my-personal-finance/utils"
)

type CategoryService struct {
	db *database.Database
}

// NewCategoryService cria uma nova instância do serviço de categorias
func NewCategoryService(db *database.Database) *CategoryService {
	return &CategoryService{db: db}
}

// CreateCategory cria uma nova categoria
func (s *CategoryService) CreateCategory(req structs.CreateCategoryRequest) (*structs.Category, error) {
	// Validar UUID do parent_id se fornecido
	if err := req.ValidateParentID(); err != nil {
		return nil, err
	}

	// Validação: se é uma subcategoria, verificar se a categoria pai existe
	if req.ParentID != nil {
		parentCategory, err := s.db.GetCategoryByID(*req.ParentID)
		if err != nil {
			return nil, fmt.Errorf("erro ao buscar categoria pai: %w", err)
		}
		if parentCategory == nil {
			return nil, fmt.Errorf("categoria pai não encontrada")
		}
		if !parentCategory.IsActive {
			return nil, fmt.Errorf("categoria pai está inativa")
		}
		// Subcategorias devem ter o mesmo tipo da categoria pai
		if parentCategory.Type != req.Type {
			return nil, fmt.Errorf("subcategoria deve ter o mesmo tipo da categoria pai")
		}
	}

	category := structs.NewCategory(req)

	if err := s.db.CreateCategory(category); err != nil {
		return nil, fmt.Errorf("erro ao criar categoria: %w", err)
	}

	return &category, nil
}

// GetCategoryByID busca uma categoria pelo ID
func (s *CategoryService) GetCategoryByID(id string) (*structs.Category, error) {
	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		return nil, fmt.Errorf("ID deve ser um UUID válido")
	}

	category, err := s.db.GetCategoryByID(id)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar categoria: %w", err)
	}
	if category == nil {
		return nil, fmt.Errorf("categoria não encontrada")
	}
	return category, nil
}

// GetAllCategories busca todas as categorias do usuário
func (s *CategoryService) GetAllCategories(userID string) ([]structs.Category, error) {
	categories, err := s.db.GetAllCategories(userID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar categorias: %w", err)
	}
	return categories, nil
}

// GetCategoriesByType busca categorias por tipo (receita ou despesa) do usuário
func (s *CategoryService) GetCategoriesByType(userID string, categoryType structs.CategoryType) ([]structs.Category, error) {
	categories, err := s.db.GetCategoriesByType(userID, categoryType)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar categorias por tipo: %w", err)
	}
	return categories, nil
}

// GetCategoriesWithSubcategories busca categorias principais com suas subcategorias
func (s *CategoryService) GetCategoriesWithSubcategories(userID string, categoryType structs.CategoryType) ([]structs.CategoryWithSubcategories, error) {
	// Buscar categorias principais (sem parent_id)
	mainCategories, err := s.db.GetCategoriesByType(userID, categoryType)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar categorias principais: %w", err)
	}

	var result []structs.CategoryWithSubcategories
	for _, mainCategory := range mainCategories {
		if mainCategory.ParentID == nil { // Apenas categorias principais
			subcategories, err := s.db.GetSubcategories(mainCategory.ID, userID)
			if err != nil {
				return nil, fmt.Errorf("erro ao buscar subcategorias: %w", err)
			}

			categoryWithSubs := structs.CategoryWithSubcategories{
				Category:      mainCategory,
				Subcategories: subcategories,
			}
			result = append(result, categoryWithSubs)
		}
	}

	return result, nil
}

// GetSubcategories busca as subcategorias de uma categoria pai
func (s *CategoryService) GetSubcategories(parentID string, userID string) ([]structs.Category, error) {
	// Validar se o parentID é um UUID válido
	if !utils.IsValidUUID(parentID) {
		return nil, fmt.Errorf("parentID deve ser um UUID válido")
	}

	// Verificar se a categoria pai existe
	parentCategory, err := s.db.GetCategoryByID(parentID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar categoria pai: %w", err)
	}
	if parentCategory == nil {
		return nil, fmt.Errorf("categoria pai não encontrada")
	}

	subcategories, err := s.db.GetSubcategories(parentID, userID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar subcategorias: %w", err)
	}

	return subcategories, nil
}

// UpdateCategory atualiza uma categoria existente
func (s *CategoryService) UpdateCategory(id string, req structs.UpdateCategoryRequest) (*structs.Category, error) {
	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		return nil, fmt.Errorf("ID deve ser um UUID válido")
	}

	// Verificar se a categoria existe
	existingCategory, err := s.db.GetCategoryByID(id)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar categoria: %w", err)
	}
	if existingCategory == nil {
		return nil, fmt.Errorf("categoria não encontrada")
	}

	// Atualizar a categoria
	if err := s.db.UpdateCategory(id, req); err != nil {
		return nil, fmt.Errorf("erro ao atualizar categoria: %w", err)
	}

	// Se a categoria não tem parent_id (é uma categoria pai) e a cor foi alterada,
	// atualizar a cor de todas as subcategorias
	if existingCategory.ParentID == nil && req.Color != "" && req.Color != existingCategory.Color {
		subcategories, err := s.db.GetSubcategories(id, req.UserID)
		if err != nil {
			return nil, fmt.Errorf("erro ao buscar subcategorias: %w", err)
		}

		// Atualizar a cor de todas as subcategorias
		for _, subcategory := range subcategories {
			updateReq := structs.UpdateCategoryRequest{
				Name:        subcategory.Name,
				Description: subcategory.Description,
				Color:       req.Color, // Usar a nova cor da categoria pai
				Icon:        subcategory.Icon,
				IsActive:    &subcategory.IsActive,
				Visible:     &subcategory.Visible,
			}

			if err := s.db.UpdateCategory(subcategory.ID, updateReq); err != nil {
				return nil, fmt.Errorf("erro ao atualizar cor da subcategoria %s: %w", subcategory.Name, err)
			}
		}
	}

	// Buscar a categoria atualizada
	updatedCategory, err := s.db.GetCategoryByID(id)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar categoria atualizada: %w", err)
	}

	return updatedCategory, nil
}

// DeleteCategory remove uma categoria (soft delete)
func (s *CategoryService) DeleteCategory(id string, userID string) error {
	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		return fmt.Errorf("ID deve ser um UUID válido")
	}

	// Verificar se a categoria existe
	existingCategory, err := s.db.GetCategoryByID(id)
	if err != nil {
		return fmt.Errorf("erro ao buscar categoria: %w", err)
	}
	if existingCategory == nil {
		return fmt.Errorf("categoria não encontrada")
	}

	// Verificar se há transações associadas à categoria pai
	hasTransactions, err := s.db.HasTransactionsByCategory(id, userID)
	if err != nil {
		return fmt.Errorf("erro ao verificar transações associadas: %w", err)
	}
	if hasTransactions {
		return fmt.Errorf("não é possível excluir a categoria '%s' pois ela possui transações associadas. Remova ou altere as transações primeiro", existingCategory.Name)
	}

	// Buscar subcategorias ativas
	subcategories, err := s.db.GetSubcategories(id, userID)
	if err != nil {
		return fmt.Errorf("erro ao verificar subcategorias: %w", err)
	}

	// Verificar se há transações associadas às subcategorias
	for _, subcategory := range subcategories {
		hasSubTransactions, err := s.db.HasTransactionsByCategory(subcategory.ID, userID)
		if err != nil {
			return fmt.Errorf("erro ao verificar transações da subcategoria %s: %w", subcategory.Name, err)
		}
		if hasSubTransactions {
			return fmt.Errorf("não é possível excluir a categoria '%s' pois a subcategoria '%s' possui transações associadas. Remova ou altere as transações primeiro", existingCategory.Name, subcategory.Name)
		}
	}

	// Excluir todas as subcategorias primeiro (soft delete)
	for _, subcategory := range subcategories {
		if err := s.db.DeleteCategory(subcategory.ID, userID); err != nil {
			return fmt.Errorf("erro ao excluir subcategoria %s: %w", subcategory.Name, err)
		}
	}

	// Excluir a categoria pai
	if err := s.db.DeleteCategory(id, userID); err != nil {
		return fmt.Errorf("erro ao excluir categoria: %w", err)
	}

	return nil
}

// HardDeleteCategory remove uma categoria permanentemente
func (s *CategoryService) HardDeleteCategory(id string) error {
	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		return fmt.Errorf("ID deve ser um UUID válido")
	}

	// Verificar se a categoria existe
	existingCategory, err := s.db.GetCategoryByID(id)
	if err != nil {
		return fmt.Errorf("erro ao buscar categoria: %w", err)
	}
	if existingCategory == nil {
		return fmt.Errorf("categoria não encontrada")
	}

	// Buscar subcategorias (incluindo as deletadas para hard delete)
	subcategories, err := s.db.GetSubcategoriesIncludingDeleted(id)
	if err != nil {
		return fmt.Errorf("erro ao verificar subcategorias: %w", err)
	}

	// Excluir permanentemente todas as subcategorias primeiro
	for _, subcategory := range subcategories {
		if err := s.db.HardDeleteCategory(subcategory.ID); err != nil {
			return fmt.Errorf("erro ao excluir permanentemente subcategoria %s: %w", subcategory.Name, err)
		}
	}

	// Excluir permanentemente a categoria pai
	if err := s.db.HardDeleteCategory(id); err != nil {
		return fmt.Errorf("erro ao excluir categoria permanentemente: %w", err)
	}

	return nil
}

// UpdateCategoryColor atualiza apenas a cor de uma categoria e suas subcategorias
func (s *CategoryService) UpdateCategoryColor(id string, color string, userID string) (*structs.Category, error) {
	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		return nil, fmt.Errorf("ID deve ser um UUID válido")
	}

	// Verificar se a categoria existe
	existingCategory, err := s.db.GetCategoryByID(id)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar categoria: %w", err)
	}
	if existingCategory == nil {
		return nil, fmt.Errorf("categoria não encontrada")
	}

	// Criar request apenas com a cor atualizada
	updateReq := structs.UpdateCategoryRequest{
		Name:        existingCategory.Name,
		Description: existingCategory.Description,
		Color:       color,
		Icon:        existingCategory.Icon,
		IsActive:    &existingCategory.IsActive,
		Visible:     &existingCategory.Visible,
	}

	// Atualizar a categoria
	if err := s.db.UpdateCategory(id, updateReq); err != nil {
		return nil, fmt.Errorf("erro ao atualizar categoria: %w", err)
	}

	// Se a categoria não tem parent_id (é uma categoria pai), atualizar a cor de todas as subcategorias
	if existingCategory.ParentID == nil {
		subcategories, err := s.db.GetSubcategories(id, userID)
		if err != nil {
			return nil, fmt.Errorf("erro ao buscar subcategorias: %w", err)
		}

		// Atualizar a cor de todas as subcategorias
		for _, subcategory := range subcategories {
			subUpdateReq := structs.UpdateCategoryRequest{
				Name:        subcategory.Name,
				Description: subcategory.Description,
				Color:       color, // Usar a nova cor
				Icon:        subcategory.Icon,
				IsActive:    &subcategory.IsActive,
				Visible:     &subcategory.Visible,
			}

			if err := s.db.UpdateCategory(subcategory.ID, subUpdateReq); err != nil {
				return nil, fmt.Errorf("erro ao atualizar cor da subcategoria %s: %w", subcategory.Name, err)
			}
		}
	}

	// Buscar a categoria atualizada
	updatedCategory, err := s.db.GetCategoryByID(id)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar categoria atualizada: %w", err)
	}

	return updatedCategory, nil
}
