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
}

type UpdateAccountRequest struct {
	Currency string `json:"currency"`
	Name     string `json:"name"`
	Color    string `json:"color"`
	IsActive bool   `json:"is_active"`
}
