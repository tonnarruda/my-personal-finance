package utils

import (
	"github.com/google/uuid"
)

// GenerateUUID gera um novo UUID v4
func GenerateUUID() string {
	return uuid.New().String()
}

// IsValidUUID verifica se uma string é um UUID válido
func IsValidUUID(u string) bool {
	_, err := uuid.Parse(u)
	return err == nil
}

// ParseUUID converte uma string para UUID, retornando erro se inválido
func ParseUUID(u string) (uuid.UUID, error) {
	return uuid.Parse(u)
}
