package database

import (
	"database/sql"
	"time"

	"github.com/tonnarruda/my-personal-finance/structs"
)

// CreateAccount insere uma nova conta no banco
func (d *Database) CreateAccount(account structs.Account) error {
	query := `
	INSERT INTO accounts (id, currency, name, color, is_active, created_at, updated_at, deleted_at)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := d.db.Exec(query,
		account.ID,
		account.Currency,
		account.Name,
		account.Color,
		account.IsActive,
		account.CreatedAt,
		account.UpdatedAt,
		account.DeletedAt,
	)
	return err
}

// GetAccountByID busca uma conta pelo ID
func (d *Database) GetAccountByID(id string) (*structs.Account, error) {
	query := `SELECT id, currency, name, color, is_active, created_at, updated_at, deleted_at FROM accounts WHERE id = $1`
	var account structs.Account
	err := d.db.QueryRow(query, id).Scan(
		&account.ID,
		&account.Currency,
		&account.Name,
		&account.Color,
		&account.IsActive,
		&account.CreatedAt,
		&account.UpdatedAt,
		&account.DeletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &account, nil
}

// GetAllAccounts busca todas as contas
func (d *Database) GetAllAccounts() ([]structs.Account, error) {
	query := `SELECT id, currency, name, color, is_active, created_at, updated_at, deleted_at FROM accounts WHERE deleted_at IS NULL ORDER BY LOWER(name)`
	rows, err := d.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var accounts []structs.Account
	for rows.Next() {
		var account structs.Account
		err := rows.Scan(
			&account.ID,
			&account.Currency,
			&account.Name,
			&account.Color,
			&account.IsActive,
			&account.CreatedAt,
			&account.UpdatedAt,
			&account.DeletedAt,
		)
		if err != nil {
			return nil, err
		}
		accounts = append(accounts, account)
	}
	return accounts, nil
}

// UpdateAccount atualiza uma conta existente
func (d *Database) UpdateAccount(id string, req structs.UpdateAccountRequest) error {
	query := `
	UPDATE accounts 
	SET currency = $1, name = $2, color = $3, is_active = $4, updated_at = $5
	WHERE id = $6
	`
	_, err := d.db.Exec(query,
		req.Currency,
		req.Name,
		req.Color,
		req.IsActive,
		time.Now(),
		id,
	)
	return err
}

// DeleteAccount faz soft delete de uma conta
func (d *Database) DeleteAccount(id string) error {
	query := `UPDATE accounts SET deleted_at = $1, updated_at = $1 WHERE id = $2`
	_, err := d.db.Exec(query, time.Now(), id)
	return err
}
