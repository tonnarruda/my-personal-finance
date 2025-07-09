# Testando Criação de Conta com Campo Type

## Problema Resolvido

O erro `"Key: 'CreateAccountRequest.Type' Error:Field validation for 'Type' failed on the 'required' tag"` foi resolvido adicionando o campo `type` obrigatório no frontend.

## Mudanças Realizadas

### 1. Frontend - Tipos Atualizados
- **`frontend/src/types/account.ts`**: Adicionado campo `type` em `Account`, `CreateAccountRequest` e `UpdateAccountRequest`

### 2. Frontend - Formulário Atualizado
- **`frontend/src/components/AccountForm.tsx`**: 
  - Adicionado campo `accountType` na interface `AccountFormData`
  - Adicionado seletor de "Tipo de Operação" (Receita/Despesa)
  - Opções: "Receita" (income) e "Despesa" (expense)

### 3. Frontend - Página Atualizada
- **`frontend/src/pages/AccountsPage.tsx`**: 
  - Enviando campo `type` nas requisições de criação e atualização

## Como Testar

### 1. Criar Conta de Receita

1. Acesse a página de Contas
2. Clique em "Adicionar Conta"
3. Preencha os dados:
   - **Tipo de Conta**: Conta Corrente
   - **Tipo de Operação**: Receita
   - **Moeda**: BRL
   - **Nome**: Conta Salário
   - **Cor**: Verde
   - **Data do Saldo Inicial**: Hoje
   - **Valor do Saldo Inicial**: 1000,00

4. Clique em "Salvar"

**Resultado esperado:**
- Conta criada com `type: "income"`
- Transação automática criada com categoria "Outras Receitas"

### 2. Criar Conta de Despesa

1. Clique em "Adicionar Conta"
2. Preencha os dados:
   - **Tipo de Conta**: Conta Corrente
   - **Tipo de Operação**: Despesa
   - **Moeda**: BRL
   - **Nome**: Conta Despesas
   - **Cor**: Vermelho
   - **Data do Saldo Inicial**: Hoje
   - **Valor do Saldo Inicial**: 0,00

3. Clique em "Salvar"

**Resultado esperado:**
- Conta criada com `type: "expense"`
- Transação automática criada com categoria "Outros"

## Verificações

### 1. Verificar no Banco de Dados

```sql
-- Verificar contas criadas
SELECT id, name, type, currency, user_id 
FROM accounts 
WHERE user_id = 'USER_ID_AQUI' 
ORDER BY created_at;

-- Verificar transações automáticas
SELECT t.id, t.description, t.type, t.amount, c.name as category_name
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.user_id = 'USER_ID_AQUI' 
AND t.observation = 'Transação criada automaticamente ao criar a conta'
ORDER BY t.created_at;
```

### 2. Verificar via API

```bash
# Buscar contas
curl -X GET "http://localhost:8080/api/accounts?user_id=USER_ID_AQUI"

# Buscar transações
curl -X GET "http://localhost:8080/api/transactions?user_id=USER_ID_AQUI"
```

## Regras de Negócio

### Para Contas do Tipo "income" (Receita):
- **Categoria da Transação**: "Outras Receitas"
- **Tipo da Transação**: "income"

### Para Contas do Tipo "expense" (Despesa):
- **Categoria da Transação**: "Outros"
- **Tipo da Transação**: "expense"

## Troubleshooting

### Se ainda aparecer erro de campo obrigatório:

1. **Verificar se o frontend está enviando o campo `type`**:
   ```javascript
   // No console do navegador, verificar a requisição
   console.log('Request data:', requestData);
   ```

2. **Verificar se o backend está recebendo o campo**:
   ```bash
   # Verificar logs do servidor
   tail -f backend/logs/server.log
   ```

3. **Testar diretamente via curl**:
   ```bash
   curl -X POST http://localhost:8080/api/accounts \
     -H "Content-Type: application/json" \
     -d '{
       "currency": "BRL",
       "name": "Teste",
       "color": "#10B981",
       "type": "income",
       "is_active": true,
       "user_id": "USER_ID_AQUI"
     }'
   ```

### Se a transação não for criada:

1. **Verificar se as categorias existem**:
   ```sql
   SELECT name, type FROM categories WHERE user_id = 'USER_ID_AQUI';
   ```

2. **Verificar logs do servidor** durante a criação da conta

3. **Verificar se a migration 7 foi executada**:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'accounts' AND column_name = 'type';
   ``` 