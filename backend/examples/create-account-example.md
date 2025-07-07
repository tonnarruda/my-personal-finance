# Exemplo de Criação de Conta

## Endpoint
```
POST /api/accounts?user_id=SEU_USER_ID
```

## Headers
```
Content-Type: application/json
```

## Body
```json
{
  "currency": "BRL",
  "name": "Conta Corrente",
  "color": "#3B82F6",
  "is_active": true
}
```

## Exemplo com curl
```bash
curl -X POST "http://localhost:8080/api/accounts?user_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "BRL",
    "name": "Conta Corrente",
    "color": "#3B82F6",
    "is_active": true
  }'
```

## Resposta de Sucesso
```json
{
  "message": "Conta criada com sucesso",
  "account": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "currency": "BRL",
    "name": "Conta Corrente",
    "color": "#3B82F6",
    "is_active": true,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z",
    "deleted_at": null,
    "user_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Observações
- O `user_id` deve ser passado como query parameter
- O `user_id` não precisa ser enviado no body da requisição
- O sistema automaticamente associa a conta ao usuário especificado 