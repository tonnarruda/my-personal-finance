package structs

import "time"

type Account struct {
	ID        string     `json:"id" db:"id"`
	Currency  string     `json:"currency" db:"currency"`
	Name      string     `json:"name" db:"name"`
	Color     string     `json:"color" db:"color"`
	Type      string     `json:"type" db:"type"` // income ou expense
	IsActive  bool       `json:"is_active" db:"is_active"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	UserID    string     `json:"user_id" db:"user_id"`
}

type CreateAccountRequest struct {
	Currency       string    `json:"currency" binding:"required"`
	Name           string    `json:"name" binding:"required"`
	Color          string    `json:"color"`
	IsActive       bool      `json:"is_active"`
	UserID         string    `json:"user_id"`
	Type           string    `json:"type" binding:"required,oneof=income expense"` // income ou expense
	DueDate        time.Time `json:"due_date"`                                     // Data de vencimento da transação inicial
	CompetenceDate time.Time `json:"competence_date"`                              // Data de competência da transação inicial
	InitialValue   float64   `json:"initial_value"`                                // Valor inicial da conta em reais
}

type UpdateAccountRequest struct {
	Currency string `json:"currency"`
	Name     string `json:"name"`
	Color    string `json:"color"`
	Type     string `json:"type" binding:"oneof=income expense"` // income ou expense
	IsActive bool   `json:"is_active"`
	UserID   string `json:"user_id" binding:"required"`
}
