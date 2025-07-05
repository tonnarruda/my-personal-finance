# Exemplos de Uso da API - My Finance

Este documento contém exemplos práticos de como usar a API de categorias do My Finance.

## 🔧 Configuração Inicial

### 1. Iniciar o servidor
```bash
cd backend
go run main.go
```

### 2. Verificar se está funcionando
```bash
curl http://localhost:8080/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "message": "My Finance API está funcionando!"
}
```

## 📋 Exemplos de Categorias

### 1. Criar Categoria de Receita

```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Salário",
    "description": "Rendimentos do trabalho principal",
    "type": "income",
    "color": "#4CAF50",
    "icon": "💰"
  }'
```

Resposta esperada:
```json
{
  "message": "Categoria criada com sucesso",
  "category": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Salário",
    "description": "Rendimentos do trabalho principal",
    "type": "income",
    "color": "#4CAF50",
    "icon": "💰",
    "parent_id": null,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Criar Categoria de Despesa

```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alimentação",
    "description": "Gastos com alimentação diária",
    "type": "expense",
    "color": "#FF6B6B",
    "icon": "🍽️"
  }'
```

### 3. Criar Subcategoria

**Nota**: Use o UUID retornado da categoria pai no campo `parent_id`.

```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Restaurantes",
    "description": "Refeições em restaurantes",
    "type": "expense",
    "color": "#FF8E8E",
    "icon": "🍕",
    "parent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'
```

### 4. Listar Todas as Categorias

```bash
curl http://localhost:8080/api/categories
```

### 5. Listar Categorias por Tipo

```bash
# Categorias de receita
curl "http://localhost:8080/api/categories/by-type?type=income"

# Categorias de despesa
curl "http://localhost:8080/api/categories/by-type?type=expense"
```

### 6. Listar Categorias com Subcategorias

```bash
# Categorias de receita com subcategorias
curl "http://localhost:8080/api/categories/with-subcategories?type=income"

# Categorias de despesa com subcategorias
curl "http://localhost:8080/api/categories/with-subcategories?type=expense"
```

### 7. Buscar Categoria por UUID

```bash
curl http://localhost:8080/api/categories/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 8. Listar Subcategorias de uma Categoria Pai

```bash
curl http://localhost:8080/api/categories/a1b2c3d4-e5f6-7890-abcd-ef1234567890/subcategories
```

### 9. Atualizar Categoria

```bash
curl -X PUT http://localhost:8080/api/categories/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Salário Mensal",
    "description": "Rendimentos mensais do trabalho principal",
    "color": "#4CAF50",
    "icon": "💰",
    "is_active": true
  }'
```

### 10. Desativar Categoria (Soft Delete)

```bash
curl -X DELETE http://localhost:8080/api/categories/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 11. Remover Categoria Permanentemente

```bash
curl -X DELETE http://localhost:8080/api/categories/a1b2c3d4-e5f6-7890-abcd-ef1234567890/permanent
```

## ❌ Exemplos de Erros

### UUID Inválido

```bash
curl http://localhost:8080/api/categories/invalid-uuid
```

Resposta:
```json
{
  "error": "ID deve ser um UUID válido"
}
```

### Categoria Não Encontrada

```bash
curl http://localhost:8080/api/categories/00000000-0000-0000-0000-000000000000
```

Resposta:
```json
{
  "error": "categoria não encontrada"
}
```

### Tipo de Categoria Inválido

```bash
curl "http://localhost:8080/api/categories/by-type?type=invalid"
```

Resposta:
```json
{
  "error": "Tipo da categoria deve ser 'income' ou 'expense'"
}
```

### Tentativa de Excluir Categoria com Subcategorias

```bash
curl -X DELETE http://localhost:8080/api/categories/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Resposta:
```json
{
  "error": "Não é possível excluir uma categoria que possui subcategorias ativas"
}
```

## 📊 Estrutura de Dados Completa

### Exemplo de Resposta com Subcategorias

```json
{
  "categories": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Alimentação",
      "description": "Gastos com alimentação diária",
      "type": "expense",
      "color": "#FF6B6B",
      "icon": "🍽️",
      "parent_id": null,
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "subcategories": [
        {
          "id": "b2c3d4e5-f6g7-8901-bcde-f23456789012",
          "name": "Restaurantes",
          "description": "Refeições em restaurantes",
          "type": "expense",
          "color": "#FF8E8E",
          "icon": "🍕",
          "parent_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          "is_active": true,
          "created_at": "2024-01-15T10:35:00Z",
          "updated_at": "2024-01-15T10:35:00Z"
        }
      ]
    }
  ]
}
```

## 🔍 Dicas de Uso

1. **Sempre use UUIDs válidos** nos parâmetros de URL
2. **Guarde os UUIDs** retornados ao criar categorias para usar como `parent_id`
3. **Valide os tipos** antes de fazer requisições (income/expense)
4. **Use soft delete** por padrão, apenas use hard delete quando necessário
5. **Verifique se a categoria pai existe** antes de criar subcategorias 