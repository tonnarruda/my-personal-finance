# Debug: Erro de Foreign Key Constraint na Transação

## Problema

```
"pq: insert or update on table \"transactions\" violates foreign key constraint \"fk_transaction_category\""
```

Este erro indica que está tentando criar uma transação com uma categoria que não existe.

## Causas Possíveis

1. **Categorias padrão não existem** no banco
2. **Categoria não encontrada** para o usuário específico
3. **Problema na busca** de categorias padrão

## Soluções Implementadas

### 1. Método GetCategoryByName Melhorado

O método agora busca:
1. Primeiro: Categorias do usuário específico
2. Depois: Categorias padrão (user_id IS NULL)

### 2. Garantia de Categorias Padrão

O `AccountService` agora:
1. Verifica se categorias padrão existem
2. Se não existirem, cria elas automaticamente
3. Depois busca a categoria para a transação

## Como Debuggar

### 1. Verificar se Categorias Padrão Existem

```sql
-- Verificar categorias padrão
SELECT id, name, type, user_id 
FROM categories 
WHERE user_id IS NULL 
ORDER BY type, name;
```

### 2. Verificar Categorias do Usuário

```sql
-- Verificar categorias do usuário específico
SELECT id, name, type, user_id 
FROM categories 
WHERE user_id = 'USER_ID_AQUI' 
ORDER BY type, name;
```

### 3. Verificar Logs do Servidor

Durante a criação da conta, você deve ver logs como:

```
Categoria Outras Receitas (tipo: income) não encontrada para usuário user-id
Categorias disponíveis para o usuário: [...]
```

### 4. Testar Busca de Categoria

```sql
-- Testar busca manual da categoria
SELECT id, name, type, user_id 
FROM categories 
WHERE name = 'Outras Receitas' 
AND type = 'income' 
AND (user_id = 'USER_ID_AQUI' OR user_id IS NULL)
AND deleted_at IS NULL;
```

## Passos para Resolver

### 1. Verificar se Migration 7 foi Executada

```sql
-- Verificar se campo type existe na tabela accounts
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND column_name = 'type';
```

### 2. Criar Categorias Padrão Manualmente (se necessário)

```sql
-- Inserir categorias padrão manualmente
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

### 3. Testar Criação de Conta

```bash
curl -X POST http://localhost:8080/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "BRL",
    "name": "Conta Teste",
    "color": "#10B981",
    "type": "income",
    "is_active": true,
    "user_id": "USER_ID_AQUI"
  }'
```

## Verificações Finais

### 1. Verificar Transação Criada

```sql
-- Verificar se a transação foi criada
SELECT t.id, t.description, t.type, t.amount, c.name as category_name
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.user_id = 'USER_ID_AQUI' 
AND t.observation = 'Transação criada automaticamente ao criar a conta'
ORDER BY t.created_at DESC
LIMIT 1;
```

### 2. Verificar Constraints

```sql
-- Verificar se a constraint está correta
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='transactions';
```

## Logs Esperados

Se tudo estiver funcionando, você deve ver no console do servidor:

```
Categoria Outras Receitas encontrada: category-id
Transação inicial criada para conta: account-id
```

Se houver problema:

```
Categoria Outras Receitas (tipo: income) não encontrada para usuário user-id
Categorias disponíveis para o usuário: [...]
``` 