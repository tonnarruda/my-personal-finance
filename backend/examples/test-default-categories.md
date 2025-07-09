# Testando o Sistema de Categorias Padrão

## Pré-requisitos

1. Banco de dados configurado
2. Servidor rodando
3. Usuário criado no sistema

## Passos para Testar

### 1. Criar um Novo Usuário

```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Usuário Teste",
    "email": "teste@exemplo.com",
    "senha": "12345678"
  }'
```

### 2. Fazer Login (Primeira Vez)

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "senha": "12345678"
  }'
```

**Resposta esperada:**
```json
{
  "id": "user-uuid-here",
  "nome": "Usuário Teste",
  "email": "teste@exemplo.com"
}
```

### 3. Verificar Categorias do Usuário

```bash
curl -X GET "http://localhost:8080/api/categories?user_id=USER_ID_AQUI"
```

**Resposta esperada:**
```json
[
  {
    "id": "category-uuid-1",
    "name": "Salário",
    "description": "Rendimentos provenientes do trabalho",
    "type": "income",
    "color": "#10B981",
    "icon": "money",
    "parent_id": null,
    "is_active": true,
    "user_id": "user-uuid-here"
  },
  {
    "id": "category-uuid-2",
    "name": "Outras Receitas",
    "description": "Outros tipos de receitas e rendimentos",
    "type": "income",
    "color": "#3B82F6",
    "icon": "plus-circle",
    "parent_id": null,
    "is_active": true,
    "user_id": "user-uuid-here"
  },
  {
    "id": "category-uuid-3",
    "name": "Alimentação",
    "description": "Gastos com alimentação, refeições e supermercado",
    "type": "expense",
    "color": "#EF4444",
    "icon": "utensils",
    "parent_id": null,
    "is_active": true,
    "user_id": "user-uuid-here"
  },
  {
    "id": "category-uuid-4",
    "name": "Moradia",
    "description": "Gastos com aluguel, condomínio, IPTU e manutenção",
    "type": "expense",
    "color": "#8B5CF6",
    "icon": "home",
    "parent_id": null,
    "is_active": true,
    "user_id": "user-uuid-here"
  },
  {
    "id": "category-uuid-5",
    "name": "Educação",
    "description": "Gastos com cursos, livros, material escolar e formação",
    "type": "expense",
    "color": "#F59E0B",
    "icon": "graduation-cap",
    "parent_id": null,
    "is_active": true,
    "user_id": "user-uuid-here"
  },
  {
    "id": "category-uuid-6",
    "name": "Transporte",
    "description": "Gastos com combustível, transporte público e manutenção de veículos",
    "type": "expense",
    "color": "#06B6D4",
    "icon": "car",
    "parent_id": null,
    "is_active": true,
    "user_id": "user-uuid-here"
  },
  {
    "id": "category-uuid-7",
    "name": "Saúde",
    "description": "Gastos com medicamentos, consultas médicas e planos de saúde",
    "type": "expense",
    "color": "#EC4899",
    "icon": "heart",
    "parent_id": null,
    "is_active": true,
    "user_id": "user-uuid-here"
  }
]
```

### 4. Fazer Login Novamente (Segunda Vez)

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "senha": "12345678"
  }'
```

**Verificação:** As categorias não devem ser duplicadas, pois o sistema verifica se o usuário já tem categorias próprias.

## Verificações no Banco de Dados

### 1. Verificar Categorias Padrão (user_id = NULL)

```sql
SELECT id, name, type, user_id 
FROM categories 
WHERE user_id IS NULL 
ORDER BY type, name;
```

### 2. Verificar Categorias do Usuário

```sql
SELECT id, name, type, user_id 
FROM categories 
WHERE user_id = 'USER_ID_AQUI' 
ORDER BY type, name;
```

### 3. Verificar Se Não Houve Duplicação

```sql
SELECT name, type, COUNT(*) as total
FROM categories 
WHERE user_id = 'USER_ID_AQUI'
GROUP BY name, type
HAVING COUNT(*) > 1;
```

## Logs do Servidor

Durante o primeiro login, você deve ver no console do servidor:

```
2024/01/XX XX:XX:XX Erro ao configurar categorias padrão para usuário user-uuid: <nil>
```

Ou se houver erro:

```
2024/01/XX XX:XX:XX Erro ao configurar categorias padrão para usuário user-uuid: <erro>
```

## Troubleshooting

### Se as categorias não aparecerem:

1. **Verificar logs do servidor** durante o login

2. **Verificar se o usuário existe:**
   ```sql
   SELECT * FROM users WHERE id = 'USER_ID_AQUI';
   ```

3. **Verificar se as categorias padrão existem:**
   ```sql
   SELECT COUNT(*) FROM categories WHERE user_id IS NULL;
   ```

4. **Verificar se o usuário tem categorias:**
   ```sql
   SELECT COUNT(*) FROM categories WHERE user_id = 'USER_ID_AQUI';
   ``` 