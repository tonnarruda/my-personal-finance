package database

import (
	"database/sql"
	"fmt"
	"time"

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

// NewDatabase cria uma nova instância do banco de dados PostgreSQL
func NewDatabase(config DatabaseConfig) (*Database, error) {
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
	if err := database.createTables(); err != nil {
		return nil, fmt.Errorf("failed to create tables: %w", err)
	}

	return database, nil
}

// Close fecha a conexão com o banco de dados
func (d *Database) Close() error {
	return d.db.Close()
}

// createTables cria as tabelas necessárias
func (d *Database) createTables() error {
	query := `
	CREATE TABLE IF NOT EXISTS categories (
		id VARCHAR(36) PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
		color VARCHAR(7),
		icon VARCHAR(50),
		parent_id VARCHAR(36),
		is_active BOOLEAN DEFAULT TRUE,
		created_at TIMESTAMP NOT NULL,
		updated_at TIMESTAMP NOT NULL,
		deleted_at TIMESTAMP NULL,
		CONSTRAINT fk_parent_category FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE CASCADE
	);
	
	CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
	CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
	CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
	CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories(created_at);
	CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at);
	`

	_, err := d.db.Exec(query)
	return err
}

// CreateCategory insere uma nova categoria no banco
func (d *Database) CreateCategory(category structs.Category) error {
	query := `
	INSERT INTO categories (id, name, description, type, color, icon, parent_id, is_active, created_at, updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	_, err := d.db.Exec(query,
		category.ID,
		category.Name,
		category.Description,
		category.Type,
		category.Color,
		category.Icon,
		category.ParentID,
		category.IsActive,
		category.CreatedAt,
		category.UpdatedAt,
	)

	return err
}

// GetCategoryByID busca uma categoria pelo ID
func (d *Database) GetCategoryByID(id string) (*structs.Category, error) {
	query := `SELECT id, name, description, type, color, icon, parent_id, is_active, created_at, updated_at 
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

// GetAllCategories busca todas as categorias
func (d *Database) GetAllCategories() ([]structs.Category, error) {
	query := `SELECT id, name, description, type, color, icon, parent_id, is_active, created_at, updated_at, deleted_at 
			  FROM categories WHERE deleted_at IS NULL ORDER BY LOWER(name)`

	rows, err := d.db.Query(query)
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

// GetCategoriesByType busca categorias por tipo (receita ou despesa)
func (d *Database) GetCategoriesByType(categoryType structs.CategoryType) ([]structs.Category, error) {
	query := `SELECT id, name, description, type, color, icon, parent_id, is_active, created_at, updated_at, deleted_at 
			  FROM categories WHERE type = $1 AND deleted_at IS NULL ORDER BY LOWER(name)`

	rows, err := d.db.Query(query, categoryType)
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

// GetSubcategories busca as subcategorias de uma categoria pai
func (d *Database) GetSubcategories(parentID string) ([]structs.Category, error) {
	query := `SELECT id, name, description, type, color, icon, parent_id, is_active, created_at, updated_at, deleted_at 
			  FROM categories WHERE parent_id = $1 AND deleted_at IS NULL ORDER BY LOWER(name)`

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

// GetSubcategoriesIncludingDeleted busca as subcategorias de uma categoria pai incluindo as deletadas
func (d *Database) GetSubcategoriesIncludingDeleted(parentID string) ([]structs.Category, error) {
	query := `SELECT id, name, description, type, color, icon, parent_id, is_active, created_at, updated_at, deleted_at 
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
	SET name = $1, description = $2, color = $3, icon = $4, is_active = $5, updated_at = $6
	WHERE id = $7
	`

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	_, err := d.db.Exec(query,
		req.Name,
		req.Description,
		req.Color,
		req.Icon,
		isActive,
		time.Now(),
		id,
	)

	return err
}

// DeleteCategory remove uma categoria (soft delete)
func (d *Database) DeleteCategory(id string) error {
	query := `UPDATE categories SET deleted_at = $1, updated_at = $1 WHERE id = $2`
	_, err := d.db.Exec(query, time.Now(), id)
	return err
}

// HardDeleteCategory remove uma categoria permanentemente
func (d *Database) HardDeleteCategory(id string) error {
	query := `DELETE FROM categories WHERE id = $1`
	_, err := d.db.Exec(query, id)
	return err
}
