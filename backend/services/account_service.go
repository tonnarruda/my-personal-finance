package services

import (
	"fmt"
	"time"

	"github.com/tonnarruda/my-personal-finance/database"
	"github.com/tonnarruda/my-personal-finance/structs"
	"github.com/tonnarruda/my-personal-finance/utils"
)

type AccountService struct {
	db *database.Database
}

// NewAccountService cria uma nova instância do serviço de contas
func NewAccountService(db *database.Database) *AccountService {
	return &AccountService{db: db}
}

// CreateAccount cria uma nova conta
func (s *AccountService) CreateAccount(req structs.CreateAccountRequest) (*structs.Account, error) {
	account := structs.Account{
		ID:        utils.GenerateUUID(),
		Currency:  req.Currency,
		Name:      req.Name,
		Color:     req.Color,
		IsActive:  req.IsActive,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		UserID:    req.UserID,
	}

	if err := s.db.CreateAccount(account); err != nil {
		return nil, fmt.Errorf("erro ao criar conta: %w", err)
	}

	return &account, nil
}

// GetAccountByID busca uma conta pelo ID
func (s *AccountService) GetAccountByID(id string, userID string) (*structs.Account, error) {
	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		return nil, fmt.Errorf("ID deve ser um UUID válido")
	}

	account, err := s.db.GetAccountByID(id, userID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar conta: %w", err)
	}
	if account == nil {
		return nil, fmt.Errorf("conta não encontrada")
	}
	return account, nil
}

// GetAllAccounts busca todas as contas do usuário
func (s *AccountService) GetAllAccounts(userID string) ([]structs.Account, error) {
	accounts, err := s.db.GetAllAccounts(userID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar contas: %w", err)
	}
	return accounts, nil
}

// UpdateAccount atualiza uma conta existente
func (s *AccountService) UpdateAccount(id string, req structs.UpdateAccountRequest) (*structs.Account, error) {
	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		return nil, fmt.Errorf("ID deve ser um UUID válido")
	}

	// Verificar se a conta existe
	existingAccount, err := s.db.GetAccountByID(id, req.UserID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar conta: %w", err)
	}
	if existingAccount == nil {
		return nil, fmt.Errorf("conta não encontrada")
	}

	// Atualizar a conta
	if err := s.db.UpdateAccount(id, req); err != nil {
		return nil, fmt.Errorf("erro ao atualizar conta: %w", err)
	}

	// Buscar a conta atualizada
	updatedAccount, err := s.db.GetAccountByID(id, req.UserID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar conta atualizada: %w", err)
	}

	return updatedAccount, nil
}

// DeleteAccount remove uma conta (soft delete)
func (s *AccountService) DeleteAccount(id string, userID string) error {
	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(id) {
		return fmt.Errorf("ID deve ser um UUID válido")
	}

	// Verificar se a conta existe
	existingAccount, err := s.db.GetAccountByID(id, userID)
	if err != nil {
		return fmt.Errorf("erro ao buscar conta: %w", err)
	}
	if existingAccount == nil {
		return fmt.Errorf("conta não encontrada")
	}

	// Excluir a conta
	if err := s.db.DeleteAccount(id, userID); err != nil {
		return fmt.Errorf("erro ao excluir conta: %w", err)
	}

	return nil
}
