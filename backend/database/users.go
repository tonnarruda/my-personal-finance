package database

import (
	"database/sql"
	"time"

	"github.com/tonnarruda/my-personal-finance/structs"
)

// CreateUser insere um novo usuário no banco
func (d *Database) CreateUser(user *structs.User) error {
	query := `INSERT INTO users (id, nome, email, senha_hash, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6)`
	now := time.Now()
	_, err := d.db.Exec(query, user.ID, user.Nome, user.Email, user.SenhaHash, now, now)
	return err
}

// GetUserByEmail busca um usuário pelo email
func (d *Database) GetUserByEmail(email string) (*structs.User, error) {
	query := `SELECT id, nome, email, senha_hash, created_at, updated_at FROM users WHERE email = $1`
	var user structs.User
	err := d.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Nome,
		&user.Email,
		&user.SenhaHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}
