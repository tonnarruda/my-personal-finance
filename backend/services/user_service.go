package services

import (
	"errors"
	"sync"

	"github.com/tonnarruda/my-personal-finance/structs"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	users      = make(map[string]*structs.User) // email -> User
	usersMutex sync.RWMutex
)

// CriarUsuario cria um novo usuário se o email não existir e senha for válida
func CriarUsuario(nome, email, senha string) (*structs.User, error) {
	if len(senha) < 8 {
		return nil, errors.New("a senha deve ter no mínimo 8 caracteres")
	}
	usersMutex.Lock()
	defer usersMutex.Unlock()
	if _, exists := users[email]; exists {
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
	users[email] = user
	return user, nil
}

// AutenticarUsuario verifica email e senha
func AutenticarUsuario(email, senha string) (*structs.User, error) {
	usersMutex.RLock()
	user, exists := users[email]
	usersMutex.RUnlock()
	if !exists {
		return nil, errors.New("usuário não encontrado")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.SenhaHash), []byte(senha)); err != nil {
		return nil, errors.New("senha incorreta")
	}
	return user, nil
}
