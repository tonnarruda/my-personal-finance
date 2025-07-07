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
