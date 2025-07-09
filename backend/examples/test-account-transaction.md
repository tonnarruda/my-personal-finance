# Testando Criação de Conta com Transação Automática

## Pré-requisitos

1. Banco de dados configurado
2. Servidor rodando
3. Usuário criado no sistema
4. Migration 7 executada (campo type na tabela accounts)

## Passos para Testar

### 1. Criar uma Conta de Receita (Income)

```bash
curl -X POST http://localhost:8080/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "BRL",
    "name": "Conta Salário",
    "color": "#10B981",
    "type": "income",
    "is_active": true,
    "user_id": "USER_ID_AQUI"
  }'
```

**Resposta esperada:**
```json
{
  "id": "account-uuid-here",
  "currency": "BRL",
  "name": "Conta Salário",
  "color": "#10B981",
  "type": "income",
  "is_active": true,
  "created_at": "2024-01-XX...",
  "updated_at": "2024-01-XX...",
  "user_id": "USER_ID_AQUI"
}
```

### 2. Criar uma Conta de Despesa (Expense)

```bash
curl -X POST http://localhost:8080/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "BRL",
    "name": "Conta Despesas",
    "color": "#EF4444",
    "type": "expense",
    "is_active": true,
    "user_id": "USER_ID_AQUI"
  }'
```

### 3. Verificar Transações Criadas Automaticamente

```bash
curl -X GET "http://localhost:8080/api/transactions?user_id=USER_ID_AQUI"
```

**Resposta esperada:**
```json
[
  {
    "id": "transaction-uuid-1",
    "user_id": "USER_ID_AQUI",
    "description": "Saldo inicial - Conta Salário",
    "amount": 0.0,
    "type": "income",
    "category_id": "category-uuid-1",
    "account_id": "account-uuid-1",
    "due_date": "2024-01-XX...",
    "competence_date": "2024-01-XX...",
    "is_paid": true,
    "observation": "Transação criada automaticamente ao criar a conta",
    "is_recurring": false,
    "recurring_type": null,
    "installments": 1,
    "current_installment": 1,
    "parent_transaction_id": null,
    "created_at": "2024-01-XX...",
    "updated_at": "2024-01-XX..."
  },
  {
    "id": "transaction-uuid-2",
    "user_id": "USER_ID_AQUI",
    "description": "Saldo inicial - Conta Despesas",
    "amount": 0.0,
    "type": "expense",
    "category_id": "category-uuid-2",
    "account_id": "account-uuid-2",
    "due_date": "2024-01-XX...",
    "competence_date": "2024-01-XX...",
    "is_paid": true,
    "observation": "Transação criada automaticamente ao criar a conta",
    "is_recurring": false,
    "recurring_type": null,
    "installments": 1,
    "current_installment": 1,
    "parent_transaction_id": null,
    "created_at": "2024-01-XX...",
    "updated_at": "2024-01-XX..."
  }
]
```

## Verificações no Banco de Dados

### 1. Verificar Contas Criadas

```sql
SELECT id, name, type, currency, user_id 
FROM accounts 
WHERE user_id = 'USER_ID_AQUI' 
ORDER BY created_at;
```

### 2. Verificar Transações Automáticas

```sql
SELECT t.id, t.description, t.type, t.amount, t.account_id, c.name as category_name
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.user_id = 'USER_ID_AQUI' 
AND t.observation = 'Transação criada automaticamente ao criar a conta'
ORDER BY t.created_at;
```

### 3. Verificar Categorias Usadas

```sql
SELECT DISTINCT c.name, c.type
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.user_id = 'USER_ID_AQUI' 
AND t.observation = 'Transação criada automaticamente ao criar a conta';
```

## Regras de Negócio

### Para Contas do Tipo "income":
- **Categoria**: "Outras Receitas"
- **Tipo de Transação**: "income"
- **Valor**: 0.0 (saldo inicial)

### Para Contas do Tipo "expense":
- **Categoria**: "Outros"
- **Tipo de Transação**: "expense"
- **Valor**: 0.0 (saldo inicial)

## Características das Transações Automáticas

- **Descrição**: "Saldo inicial - {nome da conta}"
- **Valor**: 0.0
- **Status**: Paga (is_paid = true)
- **Observação**: "Transação criada automaticamente ao criar a conta"
- **Parcelas**: 1
- **Recorrente**: false

## Troubleshooting

### Se a transação não for criada:

1. **Verificar logs do servidor** durante a criação da conta
2. **Verificar se as categorias existem**:
   ```sql
   SELECT * FROM categories WHERE user_id = 'USER_ID_AQUI' AND name IN ('Outras Receitas', 'Outros');
   ```
3. **Verificar se a migration 7 foi executada**:
   ```sql
   SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'type';
   ```

### Se houver erro de categoria não encontrada:

1. **Verificar se o usuário tem as categorias padrão**:
   ```sql
   SELECT name, type FROM categories WHERE user_id = 'USER_ID_AQUI';
   ```
2. **Se não tiver, fazer login novamente** para criar as categorias padrão 