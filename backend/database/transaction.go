package database

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/tonnarruda/my-personal-finance/structs"
)

// CreateTransaction insere uma nova transação no banco
func (d *Database) CreateTransaction(tx structs.Transaction) error {
	query := `
	INSERT INTO transactions (
		id, user_id, description, amount, type, category_id, account_id, due_date, competence_date, is_paid, observation, is_recurring, recurring_type, installments, current_installment, parent_transaction_id, transfer_id, created_at, updated_at, deleted_at
	) VALUES (
		$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
	)`
	_, err := d.db.Exec(query,
		tx.ID,
		tx.UserID,
		tx.Description,
		tx.Amount,
		tx.Type,
		tx.CategoryID,
		tx.AccountID,
		tx.DueDate,
		tx.CompetenceDate,
		tx.IsPaid,
		tx.Observation,
		tx.IsRecurring,
		tx.RecurringType,
		tx.Installments,
		tx.CurrentInstallment,
		tx.ParentTransactionID,
		tx.TransferID,
		tx.CreatedAt,
		tx.UpdatedAt,
		tx.DeletedAt,
	)
	return err
}

// GetTransactionByID busca uma transação pelo ID e userID
func (d *Database) GetTransactionByID(id string, userID string) (*structs.Transaction, error) {
	query := `SELECT id, user_id, description, amount, type, category_id, account_id, due_date, competence_date, is_paid, observation, is_recurring, recurring_type, installments, current_installment, parent_transaction_id, transfer_id, created_at, updated_at, deleted_at FROM transactions WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`

	var tx structs.Transaction
	var observation, recurringType, parentTransactionID, transferID sql.NullString
	var deletedAt sql.NullTime

	err := d.db.QueryRow(query, id, userID).Scan(
		&tx.ID,
		&tx.UserID,
		&tx.Description,
		&tx.Amount,
		&tx.Type,
		&tx.CategoryID,
		&tx.AccountID,
		&tx.DueDate,
		&tx.CompetenceDate,
		&tx.IsPaid,
		&observation,
		&tx.IsRecurring,
		&recurringType,
		&tx.Installments,
		&tx.CurrentInstallment,
		&parentTransactionID,
		&transferID,
		&tx.CreatedAt,
		&tx.UpdatedAt,
		&deletedAt,
	)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return nil, nil
		}
		return nil, err
	}

	// Atribuir valores NULL corretamente
	if observation.Valid {
		tx.Observation = observation.String
	} else {
		tx.Observation = ""
	}

	if recurringType.Valid {
		tx.RecurringType = &recurringType.String
	} else {
		tx.RecurringType = nil
	}

	if parentTransactionID.Valid {
		tx.ParentTransactionID = &parentTransactionID.String
	} else {
		tx.ParentTransactionID = nil
	}

	if transferID.Valid {
		tx.TransferID = &transferID.String
	} else {
		tx.TransferID = nil
	}

	if deletedAt.Valid {
		tx.DeletedAt = &deletedAt.Time
	} else {
		tx.DeletedAt = nil
	}

	return &tx, nil
}

// GetAllTransactionsByUser lista todas as transações de um usuário
func (d *Database) GetAllTransactionsByUser(userID string) ([]structs.Transaction, error) {
	query := `SELECT id, user_id, description, amount, type, category_id, account_id, due_date, competence_date, is_paid, observation, is_recurring, recurring_type, installments, current_installment, parent_transaction_id, transfer_id, created_at, updated_at, deleted_at FROM transactions WHERE user_id = $1 AND deleted_at IS NULL ORDER BY due_date ASC, created_at ASC`
	rows, err := d.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Inicializar com slice vazio para garantir que nunca seja nil
	txs := make([]structs.Transaction, 0)
	for rows.Next() {
		var tx structs.Transaction
		var observation, recurringType, parentTransactionID, transferID sql.NullString
		var deletedAt sql.NullTime

		err := rows.Scan(
			&tx.ID,
			&tx.UserID,
			&tx.Description,
			&tx.Amount,
			&tx.Type,
			&tx.CategoryID,
			&tx.AccountID,
			&tx.DueDate,
			&tx.CompetenceDate,
			&tx.IsPaid,
			&observation,
			&tx.IsRecurring,
			&recurringType,
			&tx.Installments,
			&tx.CurrentInstallment,
			&parentTransactionID,
			&transferID,
			&tx.CreatedAt,
			&tx.UpdatedAt,
			&deletedAt,
		)
		if err != nil {
			return nil, err
		}

		// Tratar valores NULL
		if observation.Valid {
			tx.Observation = observation.String
		} else {
			tx.Observation = ""
		}
		if recurringType.Valid {
			tx.RecurringType = &recurringType.String
		} else {
			tx.RecurringType = nil
		}
		if parentTransactionID.Valid {
			tx.ParentTransactionID = &parentTransactionID.String
		} else {
			tx.ParentTransactionID = nil
		}
		if transferID.Valid {
			tx.TransferID = &transferID.String
		} else {
			tx.TransferID = nil
		}
		if deletedAt.Valid {
			tx.DeletedAt = &deletedAt.Time
		} else {
			tx.DeletedAt = nil
		}

		txs = append(txs, tx)
	}
	return txs, nil
}

// UpdateTransaction atualiza uma transação existente
func (d *Database) UpdateTransaction(id string, userID string, tx structs.Transaction) error {
	query := `UPDATE transactions SET description=$1, amount=$2, type=$3, category_id=$4, account_id=$5, due_date=$6, competence_date=$7, is_paid=$8, observation=$9, is_recurring=$10, recurring_type=$11, installments=$12, current_installment=$13, parent_transaction_id=$14, transfer_id=$15, updated_at=$16, deleted_at=$17 WHERE id=$18 AND user_id=$19`
	_, err := d.db.Exec(query,
		tx.Description,
		tx.Amount,
		tx.Type,
		tx.CategoryID,
		tx.AccountID,
		tx.DueDate,
		tx.CompetenceDate,
		tx.IsPaid,
		tx.Observation,
		tx.IsRecurring,
		tx.RecurringType,
		tx.Installments,
		tx.CurrentInstallment,
		tx.ParentTransactionID,
		tx.TransferID,
		tx.UpdatedAt,
		tx.DeletedAt,
		id,
		userID,
	)
	return err
}

// UpdateTransactionPartial atualiza apenas campos específicos de uma transação
func (d *Database) UpdateTransactionPartial(id string, userID string, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return fmt.Errorf("no fields to update")
	}

	// Adicionar updated_at automaticamente
	updates["updated_at"] = time.Now()

	// Construir a query dinamicamente
	setParts := []string{}
	args := []interface{}{}
	argIndex := 1

	for field, value := range updates {
		setParts = append(setParts, fmt.Sprintf("%s=$%d", field, argIndex))
		args = append(args, value)
		argIndex++
	}

	query := fmt.Sprintf("UPDATE transactions SET %s WHERE id=$%d AND user_id=$%d",
		strings.Join(setParts, ", "), argIndex, argIndex+1)
	args = append(args, id, userID)

	_, err := d.db.Exec(query, args...)
	return err
}

// DeleteTransaction remove uma transação do banco (soft delete)
func (d *Database) DeleteTransaction(id string, userID string) error {
	query := `UPDATE transactions SET deleted_at = NOW() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`
	_, err := d.db.Exec(query, id, userID)
	return err
}

// GetInitialTransaction busca a transação inicial de uma conta
func (d *Database) GetInitialTransaction(accountID string, userID string) (*structs.Transaction, error) {
	query := `SELECT id, user_id, description, amount, type, category_id, account_id, due_date, competence_date, is_paid, observation, is_recurring, recurring_type, installments, current_installment, parent_transaction_id, transfer_id, created_at, updated_at, deleted_at FROM transactions WHERE account_id = $1 AND user_id = $2 AND description = 'Saldo Inicial' AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`
	var tx structs.Transaction
	err := d.db.QueryRow(query, accountID, userID).Scan(
		&tx.ID,
		&tx.UserID,
		&tx.Description,
		&tx.Amount,
		&tx.Type,
		&tx.CategoryID,
		&tx.AccountID,
		&tx.DueDate,
		&tx.CompetenceDate,
		&tx.IsPaid,
		&tx.Observation,
		&tx.IsRecurring,
		&tx.RecurringType,
		&tx.Installments,
		&tx.CurrentInstallment,
		&tx.ParentTransactionID,
		&tx.TransferID,
		&tx.CreatedAt,
		&tx.UpdatedAt,
		&tx.DeletedAt,
	)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			return nil, nil
		}
		return nil, err
	}
	return &tx, nil
}

// HasTransactionsByAccount verifica se há transações associadas a uma conta
func (d *Database) HasTransactionsByAccount(accountID string, userID string) (bool, error) {
	query := `SELECT COUNT(*) FROM transactions WHERE account_id = $1 AND user_id = $2 AND deleted_at IS NULL`
	var count int
	err := d.db.QueryRow(query, accountID, userID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// HasTransactionsByCategory verifica se há transações associadas a uma categoria
func (d *Database) HasTransactionsByCategory(categoryID string, userID string) (bool, error) {
	query := `SELECT COUNT(*) FROM transactions WHERE category_id = $1 AND user_id = $2 AND deleted_at IS NULL`
	var count int
	err := d.db.QueryRow(query, categoryID, userID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetTransactionsByTransferID busca transações pelo transfer_id
func (d *Database) GetTransactionsByTransferID(transferID string, userID string) ([]structs.Transaction, error) {
	query := `SELECT id, user_id, description, amount, type, category_id, account_id, due_date, competence_date, is_paid, observation, is_recurring, recurring_type, installments, current_installment, parent_transaction_id, transfer_id, created_at, updated_at, deleted_at FROM transactions WHERE transfer_id = $1 AND user_id = $2 AND deleted_at IS NULL`
	rows, err := d.db.Query(query, transferID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var txs []structs.Transaction
	for rows.Next() {
		var tx structs.Transaction
		err := rows.Scan(
			&tx.ID,
			&tx.UserID,
			&tx.Description,
			&tx.Amount,
			&tx.Type,
			&tx.CategoryID,
			&tx.AccountID,
			&tx.DueDate,
			&tx.CompetenceDate,
			&tx.IsPaid,
			&tx.Observation,
			&tx.IsRecurring,
			&tx.RecurringType,
			&tx.Installments,
			&tx.CurrentInstallment,
			&tx.ParentTransactionID,
			&tx.TransferID,
			&tx.CreatedAt,
			&tx.UpdatedAt,
			&tx.DeletedAt,
		)
		if err != nil {
			return nil, err
		}
		txs = append(txs, tx)
	}
	return txs, nil
}

// DeleteTransactionsByTransferID remove todas as transações com o mesmo transfer_id
func (d *Database) DeleteTransactionsByTransferID(transferID string, userID string) error {
	query := `UPDATE transactions SET deleted_at = NOW() WHERE transfer_id = $1 AND user_id = $2 AND deleted_at IS NULL`
	_, err := d.db.Exec(query, transferID, userID)
	return err
}
