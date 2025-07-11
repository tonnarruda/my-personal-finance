package structs

import "time"

type Transaction struct {
	ID                  string     `json:"id"`
	UserID              string     `json:"user_id"`
	Description         string     `json:"description"`
	Amount              int        `json:"amount"` // INTEGER no banco
	Type                string     `json:"type"`
	CategoryID          string     `json:"category_id"`
	AccountID           string     `json:"account_id"`
	DueDate             time.Time  `json:"due_date"`
	CompetenceDate      time.Time  `json:"competence_date"`
	IsPaid              bool       `json:"is_paid"`
	Observation         string     `json:"observation"`
	IsRecurring         bool       `json:"is_recurring"`
	RecurringType       *string    `json:"recurring_type"`
	Installments        int        `json:"installments"`
	CurrentInstallment  int        `json:"current_installment"`
	ParentTransactionID *string    `json:"parent_transaction_id"`
	TransferID          *string    `json:"transfer_id"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
	DeletedAt           *time.Time `json:"deleted_at,omitempty"`
}
