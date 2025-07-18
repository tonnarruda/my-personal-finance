package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/tonnarruda/my-personal-finance/structs"
)

type Database struct {
	db *sql.DB
}

// DatabaseConfig configurações do banco de dados
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// ensureDatabaseExists verifica se o banco de dados existe e o cria se necessário
func ensureDatabaseExists(config DatabaseConfig) error {
	// Conectar ao banco postgres (banco padrão)
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=postgres sslmode=%s",
		config.Host, config.Port, config.User, config.Password, config.SSLMode)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to connect to postgres database: %w", err)
	}
	defer db.Close()

	// Verificar se o banco de dados existe
	var exists int
	query := `SELECT 1 FROM pg_database WHERE datname = $1`
	err = db.QueryRow(query, config.DBName).Scan(&exists)

	if err != nil {
		if err == sql.ErrNoRows {
			// Banco não existe, vamos criá-lo
			createQuery := fmt.Sprintf("CREATE DATABASE %s", config.DBName)
			_, err = db.Exec(createQuery)
			if err != nil {
				return fmt.Errorf("failed to create database %s: %w", config.DBName, err)
			}
			fmt.Printf("✅ Banco de dados '%s' criado com sucesso!\n", config.DBName)
		} else {
			return fmt.Errorf("failed to check if database exists: %w", err)
		}
	} else {
		fmt.Printf("✅ Banco de dados '%s' já existe\n", config.DBName)
	}

	return nil
}

// NewDatabase cria uma nova instância do banco de dados PostgreSQL
func NewDatabase(config DatabaseConfig) (*Database, error) {
	// Verificar e criar o banco de dados se necessário
	if err := ensureDatabaseExists(config); err != nil {
		return nil, err
	}

	// Construir string de conexão PostgreSQL
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.User, config.Password, config.DBName, config.SSLMode)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	database := &Database{db: db}
	return database, nil
}

// Close fecha a conexão com o banco de dados
func (d *Database) Close() error {
	return d.db.Close()
}

// CreateCategory insere uma nova categoria no banco
func (d *Database) CreateCategory(category structs.Category) error {
	query := `
	INSERT INTO categories (id, name, description, type, color, icon, parent_id, is_active, visible, created_at, updated_at, user_id)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	var userID interface{}
	if category.UserID == "" {
		userID = nil
	} else {
		userID = category.UserID
	}

	_, err := d.db.Exec(query,
		category.ID,
		category.Name,
		category.Description,
		category.Type,
		category.Color,
		category.Icon,
		category.ParentID,
		category.IsActive,
		category.Visible,
		category.CreatedAt,
		category.UpdatedAt,
		userID,
	)

	return err
}

// GetCategoryByID busca uma categoria pelo ID
func (d *Database) GetCategoryByID(id string) (*structs.Category, error) {
	query := `SELECT id, name, description, type, color, icon, parent_id, is_active, visible, created_at, updated_at 
			  FROM categories WHERE id = $1`

	var category structs.Category
	err := d.db.QueryRow(query, id).Scan(
		&category.ID,
		&category.Name,
		&category.Description,
		&category.Type,
		&category.Color,
		&category.Icon,
		&category.ParentID,
		&category.IsActive,
		&category.Visible,
		&category.CreatedAt,
		&category.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &category, nil
}

// GetCategoryByName busca uma categoria pelo nome e tipo para um usuário específico
func (d *Database) GetCategoryByName(name string, categoryType string, userID string) (*structs.Category, error) {
	// Primeiro tenta buscar categoria do usuário específico
	query := `SELECT id, name, description, type, color, icon, parent_id, is_active, visible, created_at, updated_at, user_id 
			  FROM categories WHERE name = $1 AND type = $2 AND user_id = $3 AND deleted_at IS NULL`

	var category structs.Category
	err := d.db.QueryRow(query, name, categoryType, userID).Scan(
		&category.ID,
		&category.Name,
		&category.Description,
		&category.Type,
		&category.Color,
		&category.Icon,
		&category.ParentID,
		&category.IsActive,
		&category.Visible,
		&category.CreatedAt,
		&category.UpdatedAt,
		&category.UserID,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &category, nil
}

// GetAllCategories busca todas as categorias do usuário
func (d *Database) GetAllCategories(userID string) ([]structs.Category, error) {
	query := `SELECT id, name, description, type, color, icon, parent_id, is_active, visible, created_at, updated_at, deleted_at, user_id 
			  FROM categories WHERE deleted_at IS NULL AND user_id = $1 ORDER BY LOWER(name)`

	rows, err := d.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []structs.Category
	for rows.Next() {
		var category structs.Category
		err := rows.Scan(
			&category.ID,
			&category.Name,
			&category.Description,
			&category.Type,
			&category.Color,
			&category.Icon,
			&category.ParentID,
			&category.IsActive,
			&category.Visible,
			&category.CreatedAt,
			&category.UpdatedAt,
			&category.DeletedAt,
			&category.UserID,
		)
		if err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// GetCategoriesByType busca categorias por tipo (receita ou despesa) do usuário
func (d *Database) GetCategoriesByType(userID string, categoryType structs.CategoryType) ([]structs.Category, error) {
	query := `SELECT id, name, description, type, color, icon, parent_id, is_active, visible, created_at, updated_at, deleted_at, user_id 
			  FROM categories WHERE type = $1 AND deleted_at IS NULL AND user_id = $2 ORDER BY LOWER(name)`

	rows, err := d.db.Query(query, categoryType, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []structs.Category
	for rows.Next() {
		var category structs.Category
		err := rows.Scan(
			&category.ID,
			&category.Name,
			&category.Description,
			&category.Type,
			&category.Color,
			&category.Icon,
			&category.ParentID,
			&category.IsActive,
			&category.Visible,
			&category.CreatedAt,
			&category.UpdatedAt,
			&category.DeletedAt,
			&category.UserID,
		)
		if err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// GetSubcategories busca as subcategorias de uma categoria pai do usuário
func (d *Database) GetSubcategories(parentID string, userID string) ([]structs.Category, error) {
	query := `SELECT id, name, description, type, color, icon, parent_id, is_active, visible, created_at, updated_at, deleted_at, user_id 
			  FROM categories WHERE parent_id = $1 AND deleted_at IS NULL AND user_id = $2 ORDER BY LOWER(name)`

	rows, err := d.db.Query(query, parentID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []structs.Category
	for rows.Next() {
		var category structs.Category
		err := rows.Scan(
			&category.ID,
			&category.Name,
			&category.Description,
			&category.Type,
			&category.Color,
			&category.Icon,
			&category.ParentID,
			&category.IsActive,
			&category.Visible,
			&category.CreatedAt,
			&category.UpdatedAt,
			&category.DeletedAt,
			&category.UserID,
		)
		if err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// GetSubcategoriesIncludingDeleted busca as subcategorias de uma categoria pai incluindo as deletadas
func (d *Database) GetSubcategoriesIncludingDeleted(parentID string) ([]structs.Category, error) {
	query := `SELECT id, name, description, type, color, icon, parent_id, is_active, visible, created_at, updated_at, deleted_at 
			  FROM categories WHERE parent_id = $1 ORDER BY LOWER(name)`

	rows, err := d.db.Query(query, parentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []structs.Category
	for rows.Next() {
		var category structs.Category
		err := rows.Scan(
			&category.ID,
			&category.Name,
			&category.Description,
			&category.Type,
			&category.Color,
			&category.Icon,
			&category.ParentID,
			&category.IsActive,
			&category.Visible,
			&category.CreatedAt,
			&category.UpdatedAt,
			&category.DeletedAt,
		)
		if err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// UpdateCategory atualiza uma categoria existente
func (d *Database) UpdateCategory(id string, req structs.UpdateCategoryRequest) error {
	query := `
	UPDATE categories 
	SET name = $1, description = $2, color = $3, icon = $4, is_active = $5, visible = $6, updated_at = $7
	WHERE id = $8 AND user_id = $9
	`

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	visible := true
	if req.Visible != nil {
		visible = *req.Visible
	}

	_, err := d.db.Exec(query,
		req.Name,
		req.Description,
		req.Color,
		req.Icon,
		isActive,
		visible,
		time.Now(),
		id,
		req.UserID,
	)

	return err
}

// DeleteCategory remove uma categoria (soft delete)
func (d *Database) DeleteCategory(id string, userID string) error {
	query := `UPDATE categories SET deleted_at = $1, updated_at = $1 WHERE id = $2 AND user_id = $3`
	_, err := d.db.Exec(query, time.Now(), id, userID)
	return err
}

// HardDeleteCategory remove uma categoria permanentemente
func (d *Database) HardDeleteCategory(id string) error {
	query := `DELETE FROM categories WHERE id = $1`
	_, err := d.db.Exec(query, id)
	return err
}

// GetTransferCategory busca a categoria de transferência (categoria de sistema)
func (d *Database) GetTransferCategory() (*structs.Category, error) {
	// Primeiro tenta buscar pelo nome exato
	query := `SELECT id, name, description, type, color, icon, parent_id, is_active, visible, created_at, updated_at, COALESCE(user_id, '') as user_id 
			  FROM categories WHERE type = 'transfer' AND name = 'Transferência' AND deleted_at IS NULL LIMIT 1`

	var category structs.Category
	err := d.db.QueryRow(query).Scan(
		&category.ID,
		&category.Name,
		&category.Description,
		&category.Type,
		&category.Color,
		&category.Icon,
		&category.ParentID,
		&category.IsActive,
		&category.Visible,
		&category.CreatedAt,
		&category.UpdatedAt,
		&category.UserID,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// Se não encontrar, tenta buscar apenas por tipo
			query = `SELECT id, name, description, type, color, icon, parent_id, is_active, visible, created_at, updated_at, COALESCE(user_id, '') as user_id 
					 FROM categories WHERE type = 'transfer' AND deleted_at IS NULL LIMIT 1`

			err = d.db.QueryRow(query).Scan(
				&category.ID,
				&category.Name,
				&category.Description,
				&category.Type,
				&category.Color,
				&category.Icon,
				&category.ParentID,
				&category.IsActive,
				&category.Visible,
				&category.CreatedAt,
				&category.UpdatedAt,
				&category.UserID,
			)

			if err != nil {
				if err == sql.ErrNoRows {
					return nil, nil
				}
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	return &category, nil
}

// EnsureTransferCategory garante que a categoria de transferência existe
func (d *Database) EnsureTransferCategory() (*structs.Category, error) {
	// Primeiro tenta buscar
	category, err := d.GetTransferCategory()
	if err != nil {
		return nil, err
	}

	// Se não encontrou, cria a categoria
	if category == nil {
		newCategory := structs.Category{
			ID:          uuid.New().String(),
			Name:        "Transferência",
			Description: "Categoria para transferências entre contas",
			Type:        "transfer",
			Color:       "#6B7280",
			Icon:        "transfer",
			ParentID:    nil,
			IsActive:    true,
			Visible:     false,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			UserID:      "", // NULL para categoria de sistema
		}

		// Criar a categoria
		err = d.CreateCategory(newCategory)
		if err != nil {
			return nil, err
		}

		return &newCategory, nil
	}

	return category, nil
}

func (d *Database) GetDB() *sql.DB {
	return d.db
}
