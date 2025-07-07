package structs

import "time"

type Account struct {
	ID        string     `json:"id" db:"id"`
	Currency  string     `json:"currency" db:"currency"`
	Name      string     `json:"name" db:"name"`
	Color     string     `json:"color" db:"color"`
	IsActive  bool       `json:"is_active" db:"is_active"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	UserID    string     `json:"user_id" db:"user_id"`
}

type CreateAccountRequest struct {
	Currency string `json:"currency" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Color    string `json:"color"`
	IsActive bool   `json:"is_active"`
	UserID   string `json:"user_id"`
}

type UpdateAccountRequest struct {
	Currency string `json:"currency"`
	Name     string `json:"name"`
	Color    string `json:"color"`
	IsActive bool   `json:"is_active"`
	UserID   string `json:"user_id" binding:"required"`
}
