package structs

// User representa um usuário do sistema
type User struct {
	ID        string `json:"id"`
	Nome      string `json:"nome"`
	Email     string `json:"email"`
	SenhaHash string `json:"-"` // Não expor o hash da senha em JSON
}
