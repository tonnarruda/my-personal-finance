package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/tonnarruda/my-personal-finance/database"
	"github.com/tonnarruda/my-personal-finance/structs"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	DB *database.Database
}

func NewUserService(db *database.Database) *UserService {
	return &UserService{DB: db}
}

// CriarUsuario cria um novo usuário no banco de dados
func (s *UserService) CriarUsuario(nome, email, senha string) (*structs.User, error) {
	if len(senha) < 8 {
		return nil, errors.New("a senha deve ter no mínimo 8 caracteres")
	}
	// Verifica se já existe usuário com o email
	existing, err := s.DB.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("email já cadastrado")
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(senha), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user := &structs.User{
		ID:        uuid.NewString(),
		Nome:      nome,
		Email:     email,
		SenhaHash: string(hash),
	}
	err = s.DB.CreateUser(user)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// AutenticarUsuario verifica email e senha no banco de dados
func (s *UserService) AutenticarUsuario(email, senha string) (*structs.User, error) {
	user, err := s.DB.GetUserByEmail(email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("usuário não encontrado")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.SenhaHash), []byte(senha)); err != nil {
		return nil, errors.New("senha incorreta")
	}
	return user, nil
}

// GetUserByID busca um usuário pelo ID
func (s *UserService) GetUserByID(id string) (*structs.User, error) {
	return s.DB.GetUserByID(id)
}

// SetupDefaultCategoriesForUser configura as categorias padrão para um usuário
// Esta função deve ser chamada quando um usuário faz login pela primeira vez
func (s *UserService) SetupDefaultCategoriesForUser(userID string) error {
	// Verifica se o usuário já tem categorias próprias
	query := `SELECT COUNT(*) FROM categories WHERE user_id = $1`
	var count int
	err := s.DB.GetDB().QueryRow(query, userID).Scan(&count)
	if err != nil {
		return err
	}

	// Se o usuário já tem categorias, não precisa configurar as padrão
	if count > 0 {
		return nil
	}

	// Cria as categorias padrão para o usuário específico
	err = s.createDefaultCategoriesForUser(userID)
	if err != nil {
		return err
	}

	return nil
}

// createDefaultCategoriesForUser cria as categorias padrão para um usuário específico
func (s *UserService) createDefaultCategoriesForUser(userID string) error {
	// Define as categorias padrão
	defaultCategories := []struct {
		name         string
		description  string
		categoryType string
		color        string
		icon         string
	}{
		{"Salário", "Rendimentos provenientes do trabalho", "income", "#10B981", "money"},
		{"Outras Receitas", "Outros tipos de receitas e rendimentos", "income", "#3B82F6", "plus-circle"},
		{"Alimentação", "Gastos com alimentação, refeições e supermercado", "expense", "#EF4444", "utensils"},
		{"Moradia", "Gastos com aluguel, condomínio, IPTU e manutenção", "expense", "#8B5CF6", "home"},
		{"Educação", "Gastos com cursos, livros, material escolar e formação", "expense", "#F59E0B", "graduation-cap"},
		{"Transporte", "Gastos com combustível, transporte público e manutenção de veículos", "expense", "#06B6D4", "car"},
		{"Saúde", "Gastos com medicamentos, consultas médicas e planos de saúde", "expense", "#EC4899", "heart"},
		{"Outros", "Outros", "expense", "#3B82F6", "heart"},
	}

	insertQuery := `
		INSERT INTO categories (id, name, description, type, color, icon, parent_id, is_active, visible, created_at, updated_at, user_id)
		VALUES (gen_random_uuid()::VARCHAR(36), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9)
	`

	for _, category := range defaultCategories {
		// Verifica se o usuário já tem esta categoria específica
		checkQuery := `SELECT COUNT(*) FROM categories WHERE user_id = $1 AND name = $2 AND type = $3`
		var count int
		err := s.DB.GetDB().QueryRow(checkQuery, userID, category.name, category.categoryType).Scan(&count)
		if err != nil {
			return err
		}

		// Se não tem, cria a categoria
		if count == 0 {
			_, err = s.DB.GetDB().Exec(insertQuery,
				category.name,
				category.description,
				category.categoryType,
				category.color,
				category.icon,
				nil,  // parent_id
				true, // is_active
				true, // visible
				userID,
			)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
