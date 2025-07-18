package services

import (
	"fmt"
	"time"

	"github.com/tonnarruda/my-personal-finance/database"
	"github.com/tonnarruda/my-personal-finance/structs"
	"github.com/tonnarruda/my-personal-finance/utils"
)

// TransactionCreator interface para criar transações
type TransactionCreator interface {
	CreateTransaction(transaction structs.Transaction) error
}

// DatabaseTransactionCreator usa o database diretamente para criar transações
type DatabaseTransactionCreator struct {
	db *database.Database
}

func NewDatabaseTransactionCreator(db *database.Database) *DatabaseTransactionCreator {
	return &DatabaseTransactionCreator{db: db}
}

func (d *DatabaseTransactionCreator) CreateTransaction(transaction structs.Transaction) error {
	return d.db.CreateTransaction(transaction)
}

type AccountService struct {
	db                 *database.Database
	transactionCreator TransactionCreator
}

// NewAccountService cria uma nova instância do serviço de contas
func NewAccountService(db *database.Database, transactionCreator TransactionCreator) *AccountService {
	return &AccountService{db: db, transactionCreator: transactionCreator}
}

// CreateAccount cria uma nova conta
func (s *AccountService) CreateAccount(req structs.CreateAccountRequest) (*structs.Account, error) {
	account := structs.Account{
		ID:        utils.GenerateUUID(),
		Currency:  req.Currency,
		Name:      req.Name,
		Color:     req.Color,
		Type:      req.Type,
		IsActive:  req.IsActive,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		UserID:    req.UserID,
	}

	if err := s.db.CreateAccount(account); err != nil {
		return nil, fmt.Errorf("erro ao criar conta: %w", err)
	}

	// Converter as strings de data para time.Time
	dueDate, err := time.Parse("2006-01-02", req.DueDate)
	if err != nil {
		return nil, fmt.Errorf("data de vencimento inválida: %w", err)
	}

	competenceDate, err := time.Parse("2006-01-02", req.CompetenceDate)
	if err != nil {
		return nil, fmt.Errorf("data de competência inválida: %w", err)
	}

	// Criar transação inicial baseada no tipo da conta usando as datas convertidas
	if err := s.createInitialTransaction(account, req.Type, dueDate, competenceDate, req.InitialValue); err != nil {
		// Log do erro mas não falha a criação da conta
		fmt.Printf("Erro ao criar transação inicial para conta %s: %v\n", account.ID, err)
	}

	return &account, nil
}

// createInitialTransaction cria uma transação inicial para a conta
func (s *AccountService) createInitialTransaction(account structs.Account, accountType string, dueDate time.Time, competenceDate time.Time, initialValue float64) error {
	// Determinar categoria baseada no tipo da conta
	var categoryName, transactionType string

	if accountType == "income" {
		categoryName = "Outras Receitas"
		transactionType = "income"
	} else {
		categoryName = "Outros"
		transactionType = "expense"
	}

	// Buscar a categoria pelo nome e tipo
	category, err := s.db.GetCategoryByName(categoryName, transactionType, account.UserID)
	if err != nil {
		return fmt.Errorf("erro ao buscar categoria %s: %w", categoryName, err)
	}
	if category == nil {
		// Log para debug
		fmt.Printf("Categoria %s (tipo: %s) não encontrada para usuário %s\n", categoryName, transactionType, account.UserID)

		// Verificar se existem categorias disponíveis
		availableCategories, err := s.db.GetAllCategories(account.UserID)
		if err != nil {
			return fmt.Errorf("erro ao buscar categorias: %w", err)
		}
		fmt.Printf("Categorias disponíveis para o usuário: %+v\n", availableCategories)

		return fmt.Errorf("categoria %s não encontrada para o usuário. Faça login novamente para criar as categorias padrão", categoryName)
	}

	// Log para debug - categoria encontrada
	fmt.Printf("Categoria encontrada: %s (ID: %s, Tipo: %s)\n", category.Name, category.ID, category.Type)

	// Converter o valor de reais para centavos
	amountInCents := int(initialValue * 100)

	// Criar a transação inicial usando as datas enviadas pelo usuário
	transaction := structs.Transaction{
		ID:                  utils.GenerateUUID(),
		UserID:              account.UserID,
		Description:         "Saldo Inicial",
		Amount:              amountInCents, // Usar o valor enviado pelo frontend
		Type:                transactionType,
		CategoryID:          category.ID,
		AccountID:           account.ID,
		DueDate:             dueDate,
		CompetenceDate:      competenceDate,
		IsPaid:              true,
		Observation:         "",
		IsRecurring:         false,
		RecurringType:       nil,
		Installments:        1,
		CurrentInstallment:  1,
		ParentTransactionID: nil,
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
		DeletedAt:           nil,
	}

	// Log para debug - dados da transação
	fmt.Printf("Criando transação: UserID=%s, CategoryID=%s, AccountID=%s, Type=%s, DueDate=%s, CompetenceDate=%s\n",
		transaction.UserID, transaction.CategoryID, transaction.AccountID, transaction.Type,
		transaction.DueDate.Format("2006-01-02"), transaction.CompetenceDate.Format("2006-01-02"))

	// Log do payload completo da transação
	fmt.Printf("Payload completo da transação: {\"user_id\":\"%s\",\"description\":\"%s\",\"amount\":%d,\"type\":\"%s\",\"category_id\":\"%s\",\"account_id\":\"%s\",\"due_date\":\"%s\",\"competence_date\":\"%s\",\"is_paid\":%t,\"observation\":\"%s\",\"is_recurring\":%t}\n",
		transaction.UserID, transaction.Description, transaction.Amount, transaction.Type,
		transaction.CategoryID, transaction.AccountID,
		transaction.DueDate.Format("2006-01-02T15:04:05Z07:00"),
		transaction.CompetenceDate.Format("2006-01-02T15:04:05Z07:00"),
		transaction.IsPaid, transaction.Observation, transaction.IsRecurring)

	if err := s.transactionCreator.CreateTransaction(transaction); err != nil {
		fmt.Printf("Erro ao criar transação: %v\n", err)
		return fmt.Errorf("erro ao criar transação inicial: %w", err)
	}

	fmt.Printf("Transação criada com sucesso: %s\n", transaction.ID)

	return nil
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

	// Se temos dados de transação inicial, atualizar ou criar
	if req.DueDate != "" && req.CompetenceDate != "" {
		// Buscar transação inicial existente
		initialTransaction, err := s.db.GetInitialTransaction(id, req.UserID)
		if err != nil {
			return nil, fmt.Errorf("erro ao buscar transação inicial: %w", err)
		}

		// Converter as strings de data para time.Time
		dueDate, err := time.Parse("2006-01-02", req.DueDate)
		if err != nil {
			return nil, fmt.Errorf("data de vencimento inválida: %w", err)
		}

		competenceDate, err := time.Parse("2006-01-02", req.CompetenceDate)
		if err != nil {
			return nil, fmt.Errorf("data de competência inválida: %w", err)
		}

		if initialTransaction != nil {
			// Atualizar transação existente
			initialTransaction.DueDate = dueDate
			initialTransaction.CompetenceDate = competenceDate
			initialTransaction.Amount = int(req.InitialValue * 100)
			initialTransaction.UpdatedAt = time.Now()

			if err := s.db.UpdateTransaction(initialTransaction.ID, req.UserID, *initialTransaction); err != nil {
				return nil, fmt.Errorf("erro ao atualizar transação inicial: %w", err)
			}
		} else {
			// Criar nova transação inicial
			if err := s.createInitialTransaction(*existingAccount, req.Type, dueDate, competenceDate, req.InitialValue); err != nil {
				return nil, fmt.Errorf("erro ao criar transação inicial: %w", err)
			}
		}
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

	// Verificar se há transações associadas
	hasTransactions, err := s.db.HasTransactionsByAccount(id, userID)
	if err != nil {
		return fmt.Errorf("erro ao verificar transações associadas: %w", err)
	}
	if hasTransactions {
		return fmt.Errorf("não é possível excluir a conta '%s' pois ela possui transações associadas. Remova ou altere as transações primeiro", existingAccount.Name)
	}

	// Excluir a conta
	if err := s.db.DeleteAccount(id, userID); err != nil {
		return fmt.Errorf("erro ao excluir conta: %w", err)
	}

	return nil
}

// GetInitialTransaction busca a transação inicial de uma conta
func (s *AccountService) GetInitialTransaction(accountID string, userID string) (*structs.Transaction, error) {
	// Validar se o ID é um UUID válido
	if !utils.IsValidUUID(accountID) {
		return nil, fmt.Errorf("ID da conta deve ser um UUID válido")
	}

	transaction, err := s.db.GetInitialTransaction(accountID, userID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar transação inicial: %w", err)
	}
	return transaction, nil
}
