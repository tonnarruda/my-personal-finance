# Teste de Busca de Categoria

## Problema

O erro `"pq: insert or update on table \"transactions\" violates foreign key constraint \"fk_transaction_category\""` indica que a categoria não está sendo encontrada.

## Como Testar

### 1. Verificar Categorias no Banco

```sql
-- Verificar todas as categorias
SELECT id, name, type, user_id, deleted_at 
FROM categories 
ORDER BY user_id, type, name;

-- Verificar categorias padrão
SELECT id, name, type, user_id 
FROM categories 
WHERE user_id IS NULL 
ORDER BY type, name;

-- Verificar categorias do usuário específico
SELECT id, name, type, user_id 
FROM categories 
WHERE user_id = 'USER_ID_AQUI' 
ORDER BY type, name;
```

### 2. Testar Busca Manual

```sql
-- Testar busca de "Outras Receitas" (income)
SELECT id, name, type, user_id 
FROM categories 
WHERE name = 'Outras Receitas' 
AND type = 'income' 
AND (user_id = 'USER_ID_AQUI' OR user_id IS NULL)
AND deleted_at IS NULL;

-- Testar busca de "Outros" (expense)
SELECT id, name, type, user_id 
FROM categories 
WHERE name = 'Outros' 
AND type = 'expense' 
AND (user_id = 'USER_ID_AQUI' OR user_id IS NULL)
AND deleted_at IS NULL;
```

### 3. Verificar Logs do Servidor

Durante a criação da conta, você deve ver logs como:

```
Categoria encontrada: Outras Receitas (ID: xxx, Tipo: income)
Criando transação: UserID=xxx, CategoryID=xxx, AccountID=xxx, Type=income
Transação criada com sucesso: xxx
```

Se houver problema:

```
Categoria Outras Receitas (tipo: income) não encontrada para usuário xxx
Categorias disponíveis para o usuário: [...]
```

### 4. Testar via API

```bash
# Testar criação de conta de receita
curl -X POST http://localhost:8080/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "BRL",
    "name": "Conta Teste Receita",
    "color": "#10B981",
    "type": "income",
    "is_active": true,
    "user_id": "USER_ID_AQUI"
  }'

# Testar criação de conta de despesa
curl -X POST http://localhost:8080/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "BRL",
    "name": "Conta Teste Despesa",
    "color": "#EF4444",
    "type": "expense",
    "is_active": true,
    "user_id": "USER_ID_AQUI"
  }'
```

## Possíveis Problemas

### 1. Categorias Padrão Não Existem

Se não existirem categorias padrão, execute:

```sql
INSERT INTO categories (id, name, description, type, color, icon, parent_id, is_active, created_at, updated_at, user_id)
VALUES 
(gen_random_uuid()::VARCHAR(36), 'Salário', 'Rendimentos provenientes do trabalho', 'income', '#10B981', 'money', NULL, true, NOW(), NOW(), NULL),
(gen_random_uuid()::VARCHAR(36), 'Outras Receitas', 'Outros tipos de receitas e rendimentos', 'income', '#3B82F6', 'plus-circle', NULL, true, NOW(), NOW(), NULL),
(gen_random_uuid()::VARCHAR(36), 'Alimentação', 'Gastos com alimentação, refeições e supermercado', 'expense', '#EF4444', 'utensils', NULL, true, NOW(), NOW(), NULL),
(gen_random_uuid()::VARCHAR(36), 'Moradia', 'Gastos com aluguel, condomínio, IPTU e manutenção', 'expense', '#8B5CF6', 'home', NULL, true, NOW(), NOW(), NULL),
(gen_random_uuid()::VARCHAR(36), 'Educação', 'Gastos com cursos, livros, material escolar e formação', 'expense', '#F59E0B', 'graduation-cap', NULL, true, NOW(), NOW(), NULL),
(gen_random_uuid()::VARCHAR(36), 'Transporte', 'Gastos com combustível, transporte público e manutenção de veículos', 'expense', '#06B6D4', 'car', NULL, true, NOW(), NOW(), NULL),
(gen_random_uuid()::VARCHAR(36), 'Saúde', 'Gastos com medicamentos, consultas médicas e planos de saúde', 'expense', '#EC4899', 'heart', NULL, true, NOW(), NOW(), NULL),
(gen_random_uuid()::VARCHAR(36), 'Outros', 'Outros', 'expense', '#3B82F6', 'heart', NULL, true, NOW(), NOW(), NULL);
```

### 2. Categorias com Deleted_at

Se as categorias existem mas têm `deleted_at` preenchido:

```sql
-- Verificar categorias deletadas
SELECT id, name, type, user_id, deleted_at 
FROM categories 
WHERE name IN ('Outras Receitas', 'Outros')
AND deleted_at IS NOT NULL;

-- Restaurar categorias deletadas (se necessário)
UPDATE categories 
SET deleted_at = NULL 
WHERE name IN ('Outras Receitas', 'Outros')
AND deleted_at IS NOT NULL;
```

### 3. Problema de Case Sensitivity

Se o problema for case sensitivity:

```sql
-- Verificar se há diferenças de maiúsculas/minúsculas
SELECT id, name, type, user_id 
FROM categories 
WHERE LOWER(name) IN ('outras receitas', 'outros')
ORDER BY name;
```

## Verificação Final

Após resolver o problema, verifique se a transação foi criada:

```sql
-- Verificar transação criada
SELECT t.id, t.description, t.type, t.amount, c.name as category_name
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.user_id = 'USER_ID_AQUI' 
AND t.observation = 'Transação criada automaticamente ao criar a conta'
ORDER BY t.created_at DESC
LIMIT 1;
``` 