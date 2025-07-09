# Teste do Fluxo de Categorias Padrão

Este documento demonstra como testar o fluxo de criação de categorias padrão e criação de contas.

## Pré-requisitos

1. Banco de dados limpo (sem categorias)
2. Servidor rodando

## Teste 1: Primeiro Login - Criação de Categorias Padrão

### 1. Criar um novo usuário

```bash
curl -X POST http://localhost:8080/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Usuário Teste",
    "email": "teste@exemplo.com",
    "senha": "12345678"
  }'
```

### 2. Fazer login (primeira vez)

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "senha": "12345678"
  }'
```

**Resultado esperado:**
- Login bem-sucedido
- Categorias padrão criadas automaticamente para o usuário
- Logs no servidor mostrando a criação das categorias

### 3. Verificar categorias criadas

```bash
curl -X GET "http://localhost:8080/categories?user_id=USER_ID_AQUI"
```

**Categorias esperadas:**
- Salário (income)
- Outras Receitas (income)
- Alimentação (expense)
- Moradia (expense)
- Educação (expense)
- Transporte (expense)
- Saúde (expense)
- Outros (expense)

## Teste 2: Criar Conta de Receita

### 1. Criar conta do tipo "income"

```bash
curl -X POST http://localhost:8080/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conta Salário",
    "description": "Conta para receber salário",
    "type": "income",
    "currency": "BRL",
    "color": "#10B981",
    "is_active": true,
    "due_date": "2025-07-08T00:00:00Z",
    "competence_date": "2025-07-08T00:00:00Z"
  }' \
  -G -d "user_id=USER_ID_AQUI"
```

**Resultado esperado:**
- Conta criada com sucesso
- Transação inicial criada automaticamente
- Categoria da transação: "Outras Receitas" (income)

### 2. Verificar transação criada

```bash
curl -X GET "http://localhost:8080/transactions?user_id=USER_ID_AQUI"
```

**Transação esperada:**
- Description: "Saldo Inicial"
- Type: "income"
- Category: "Outras Receitas"
- Amount: 10000 (R$ 100,00)
- IsPaid: true
- Observation: ""

## Teste 3: Criar Conta de Despesa

### 1. Criar conta do tipo "expense"

```bash
curl -X POST http://localhost:8080/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conta Despesas",
    "description": "Conta para despesas gerais",
    "type": "expense",
    "currency": "BRL",
    "color": "#EF4444",
    "is_active": true,
    "due_date": "2025-07-08T00:00:00Z",
    "competence_date": "2025-07-08T00:00:00Z"
  }' \
  -G -d "user_id=USER_ID_AQUI"
```

**Resultado esperado:**
- Conta criada com sucesso
- Transação inicial criada automaticamente
- Categoria da transação: "Outros" (expense)

### 2. Verificar transação criada

```bash
curl -X GET "http://localhost:8080/transactions?user_id=USER_ID_AQUI"
```

**Transação esperada:**
- Description: "Saldo Inicial"
- Type: "expense"
- Category: "Outros"
- Amount: 10000 (R$ 100,00)
- IsPaid: true
- Observation: ""

## Teste 4: Login Subsequente

### 1. Fazer logout e login novamente

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "senha": "12345678"
  }'
```

**Resultado esperado:**
- Login bem-sucedido
- Nenhuma categoria nova criada (já existem)
- Logs mostrando que categorias já existem

## Verificação dos Logs

Durante os testes, observe os logs do servidor para confirmar:

1. **Primeiro login:**
   ```
   Configurando categorias padrão para usuário: USER_ID
   Criando categoria: Salário
   Criando categoria: Outras Receitas
   ...
   ```

2. **Criação de conta:**
   ```
   Categoria encontrada: Outras Receitas (ID: xxx, Tipo: income)
   Criando transação: UserID=xxx, CategoryID=xxx, AccountID=xxx, Type=income, DueDate=2025-07-08, CompetenceDate=2025-07-08
   Transação criada com sucesso: xxx
   Payload da transação: {"description":"Saldo Inicial","amount":10000,"type":"income","due_date":"2025-07-08T00:00:00Z","competence_date":"2025-07-08T00:00:00Z",...}
   ```

3. **Login subsequente:**
   ```
   Usuário já possui categorias, pulando criação de padrões
   ```

## Resumo do Comportamento

- ✅ Categorias padrão são criadas **apenas no primeiro login**
- ✅ Categorias não são criadas durante a criação de contas
- ✅ Contas de receita usam categoria "Outras Receitas"
- ✅ Contas de despesa usam categoria "Outros"
- ✅ Transações iniciais são criadas automaticamente
- ✅ Login subsequente não cria categorias duplicadas 