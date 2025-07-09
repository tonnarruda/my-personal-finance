# Exemplo: Criar Conta com Datas Personalizadas

Este exemplo demonstra como criar uma conta especificando as datas da transação inicial.

## Payload Completo

```json
{
  "name": "Conta Salário",
  "currency": "BRL",
  "color": "#10B981",
  "type": "income",
  "is_active": true,
  "due_date": "2025-07-08T00:00:00Z",
  "competence_date": "2025-07-08T00:00:00Z"
}
```

## Comando cURL

```bash
curl -X POST http://localhost:8080/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Conta Salário",
    "currency": "BRL",
    "color": "#10B981",
    "type": "income",
    "is_active": true,
    "due_date": "2025-07-08T00:00:00Z",
    "competence_date": "2025-07-08T00:00:00Z"
  }' \
  -G -d "user_id=USER_ID_AQUI"
```

## Resposta Esperada

```json
{
  "message": "Conta criada com sucesso",
  "account": {
    "id": "6c8293ac-a489-4916-b28c-f77a74ac32a3",
    "name": "Conta Salário",
    "currency": "BRL",
    "color": "#10B981",
    "type": "income",
    "is_active": true,
    "user_id": "c88443ef-4b5c-49d5-8168-76a6317c1685",
    "created_at": "2025-01-08T10:30:00Z",
    "updated_at": "2025-01-08T10:30:00Z"
  }
}
```

## Transação Inicial Criada

A transação inicial será criada automaticamente com:

```json
{
  "user_id": "c88443ef-4b5c-49d5-8168-76a6317c1685",
  "description": "Saldo Inicial",
  "amount": 10000,
  "type": "income",
  "category_id": "c8741da7-9a72-4beb-8eb2-672320d7623d",
  "account_id": "6c8293ac-a489-4916-b28c-f77a74ac32a3",
  "due_date": "2025-07-08T00:00:00Z",
  "competence_date": "2025-07-08T00:00:00Z",
  "is_paid": true,
  "observation": "",
  "is_recurring": false
}
```

## Campos Obrigatórios

- `name`: Nome da conta
- `currency`: Moeda (ex: "BRL")
- `type`: Tipo da conta ("income" ou "expense")
- `due_date`: Data de vencimento da transação inicial
- `competence_date`: Data de competência da transação inicial

## Campos Opcionais

- `color`: Cor da conta (ex: "#10B981")
- `is_active`: Se a conta está ativa (padrão: true)

## Observações

1. **Datas:** As datas `due_date` e `competence_date` são usadas para criar a transação inicial
2. **Categoria:** A categoria é determinada automaticamente:
   - `income` → "Outras Receitas"
   - `expense` → "Outros"
3. **Valor:** O valor inicial é sempre R$ 100,00 (10000 centavos)
4. **Descrição:** A descrição é sempre "Saldo Inicial" 