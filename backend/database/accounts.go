package database

import (
	"database/sql"
	"time"

	"github.com/tonnarruda/my-personal-finance/structs"
)

// CreateAccount insere uma nova conta no banco
func (d *Database) CreateAccount(account structs.Account) error {
	query := `
	INSERT INTO accounts (id, currency, name, color, type, is_active, created_at, updated_at, deleted_at, user_id)
	VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := d.db.Exec(query,
		account.ID,
		account.Currency,
		account.Name,
		account.Color,
		account.Type,
		account.IsActive,
		account.CreatedAt,
		account.UpdatedAt,
		account.DeletedAt,
		account.UserID,
	)
	return err
}

// GetAccountByID busca uma conta pelo ID
func (d *Database) GetAccountByID(id string, userID string) (*structs.Account, error) {
	query := `SELECT id, currency, name, color, type, is_active, created_at, updated_at, deleted_at, user_id FROM accounts WHERE id = $1 AND user_id = $2`
	var account structs.Account
	var color sql.NullString
	err := d.db.QueryRow(query, id, userID).Scan(
		&account.ID,
		&account.Currency,
		&account.Name,
		&color,
		&account.Type,
		&account.IsActive,
		&account.CreatedAt,
		&account.UpdatedAt,
		&account.DeletedAt,
		&account.UserID,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	
	// Tratar valor NULL para color
	if color.Valid {
		account.Color = color.String
	} else {
		account.Color = ""
	}
	
	return &account, nil
}

// GetAllAccounts busca todas as contas do usuário
func (d *Database) GetAllAccounts(userID string) ([]structs.Account, error) {
	query := `SELECT id, currency, name, color, type, is_active, created_at, updated_at, deleted_at, user_id FROM accounts WHERE deleted_at IS NULL AND user_id = $1 ORDER BY LOWER(name)`
	rows, err := d.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var accounts []structs.Account
	for rows.Next() {
		var account structs.Account
		var color sql.NullString
		err := rows.Scan(
			&account.ID,
			&account.Currency,
			&account.Name,
			&color,
			&account.Type,
			&account.IsActive,
			&account.CreatedAt,
			&account.UpdatedAt,
			&account.DeletedAt,
			&account.UserID,
		)
		if err != nil {
			return nil, err
		}
		
		// Tratar valor NULL para color
		if color.Valid {
			account.Color = color.String
		} else {
			account.Color = ""
		}
		
		accounts = append(accounts, account)
	}
	return accounts, nil
}

// UpdateAccount atualiza uma conta existente
func (d *Database) UpdateAccount(id string, req structs.UpdateAccountRequest) error {
	query := `
	UPDATE accounts 
	SET currency = $1, name = $2, color = $3, type = $4, is_active = $5, updated_at = $6
	WHERE id = $7 AND user_id = $8
	`
	_, err := d.db.Exec(query,
		req.Currency,
		req.Name,
		req.Color,
		req.Type,
		req.IsActive,
		time.Now(),
		id,
		req.UserID,
	)
	return err
}

// DeleteAccount faz soft delete de uma conta
func (d *Database) DeleteAccount(id string, userID string) error {
	query := `UPDATE accounts SET deleted_at = $1, updated_at = $1 WHERE id = $2 AND user_id = $3`
	_, err := d.db.Exec(query, time.Now(), id, userID)
	return err
}
