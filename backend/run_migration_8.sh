#!/bin/bash

# Script para executar a migration 8 - Ajuste de Foreign Keys

echo "Executando migration 8 - Ajuste de Foreign Keys..."

# Verificar se o psql está disponível
if ! command -v psql &> /dev/null; then
    echo "Erro: psql não está instalado ou não está no PATH"
    exit 1
fi

# Carregar variáveis de ambiente
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Verificar se as variáveis de ambiente estão definidas
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
    echo "Erro: Variáveis de ambiente do banco não estão definidas"
    echo "Certifique-se de que o arquivo .env existe e contém:"
    echo "DB_HOST=..."
    echo "DB_PORT=..."
    echo "DB_USER=..."
    echo "DB_NAME=..."
    exit 1
fi

# Executar a migration
echo "Executando migration 8..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/8_adjust_foreign_keys_for_soft_delete.up.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration 8 executada com sucesso!"
    echo ""
    echo "As foreign keys das transações foram ajustadas para usar RESTRICT:"
    echo "- fk_transaction_category: Impede exclusão de categorias com transações"
    echo "- fk_transaction_account: Impede exclusão de contas com transações"
    echo ""
    echo "Agora o sistema irá:"
    echo "1. Verificar se há transações antes de deletar contas/categorias"
    echo "2. Retornar erro específico se houver transações associadas"
    echo "3. Permitir soft delete apenas quando não há transações"
else
    echo "❌ Erro ao executar migration 8"
    exit 1
fi 