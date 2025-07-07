# Exemplo de Criação de Categoria

## Endpoint
```
POST /api/categories?user_id=SEU_USER_ID
```

## Headers
```
Content-Type: application/json
```

## Body
```json
{
  "name": "Alimentação",
  "description": "Gastos com comida e refeições",
  "type": "expense",
  "color": "#EF4444",
  "icon": "utensils"
}
```

## Exemplo com curl
```bash
curl -X POST "http://localhost:8080/api/categories?user_id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alimentação",
    "description": "Gastos com comida e refeições",
    "type": "expense",
    "color": "#EF4444",
    "icon": "utensils"
  }'
```

## Resposta de Sucesso
```json
{
  "message": "Categoria criada com sucesso",
  "category": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Alimentação",
    "description": "Gastos com comida e refeições",
    "type": "expense",
    "color": "#EF4444",
    "icon": "utensils",
    "parent_id": null,
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
- O sistema automaticamente associa a categoria ao usuário especificado 