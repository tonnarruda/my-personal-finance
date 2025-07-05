# My Finance - Backend

Backend do sistema financeiro pessoal em Go com PostgreSQL.

## 🚀 Configuração Rápida

1. **Configure as variáveis de ambiente:**
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações do PostgreSQL
```

2. **Instale dependências:**
```bash
go mod tidy
```

3. **Execute:**
```bash
go run main.go
```

## 📡 Endpoints Principais

- `POST /api/categories` - Criar categoria
- `GET /api/categories` - Listar categorias
- `GET /api/categories/by-type?type=income` - Por tipo
- `GET /api/categories/with-subcategories` - Com subcategorias
- `PUT /api/categories/:id` - Atualizar
- `DELETE /api/categories/:id` - Remover

## 🛠️ Tecnologias

- Go 1.23.6
- Gin (Framework Web)
- PostgreSQL
- lib/pq (Driver PostgreSQL)

## 🔐 Identificadores (UUIDs)

Todos os IDs no sistema são **UUIDs v4** para garantir unicidade e segurança:

- **Formato**: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- **Validação**: Todos os endpoints validam se os IDs fornecidos são UUIDs válidos
- **Geração**: UUIDs são gerados automaticamente ao criar novas entidades

### Exemplo de UUID válido:
```
550e8400-e29b-41d4-a716-446655440000
```

## 🚀 Funcionalidades

- **Gestão de Categorias**: Criação, edição e exclusão de categorias financeiras
- **Subcategorias**: Suporte a hierarquia de categorias (categorias principais e subcategorias)
- **Tipos de Categoria**: Suporte a categorias de receita e despesa
- **API REST**: Endpoints completos para CRUD de categorias
- **Validação de UUID**: Todos os IDs são validados como UUIDs válidos

## 📋 Pré-requisitos

- Go 1.23.6 ou superior
- PostgreSQL 12 ou superior
- Git

## 📋 Pré-requisitos

- Go 1.23.6 ou superior
- PostgreSQL 12 ou superior
- Git

## ⚙️ Configuração

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd my-personal-finance/backend
```

### 2. Configure o PostgreSQL
Crie o banco de dados:
```sql
CREATE DATABASE my_finance;
```

## 📝 Exemplos de Uso

### Criar uma categoria de despesa
```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alimentação",
    "description": "Gastos com alimentação",
    "type": "expense",
    "color": "#FF6B6B",
    "icon": "🍽️"
  }'
```

### Criar uma subcategoria (usando UUID da categoria pai)
```bash
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Restaurantes",
    "description": "Refeições em restaurantes",
    "type": "expense",
    "color": "#FF8E8E",
    "icon": "🍕",
    "parent_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Buscar categoria por UUID
```bash
curl http://localhost:8080/api/categories/550e8400-e29b-41d4-a716-446655440000
```

### Listar subcategorias de uma categoria pai
```bash
curl http://localhost:8080/api/categories/550e8400-e29b-41d4-a716-446655440000/subcategories
```

## 🏗️ Estrutura do Projeto

```
backend/
├── database/          # Camada de acesso a dados
│   └── database.go    # Configuração e operações do banco
├── handlers/          # Handlers HTTP
│   └── category_handler.go
├── routes/            # Configuração de rotas
│   └── routes.go
├── services/          # Lógica de negócio
│   └── category_service.go
├── structs/           # Estruturas de dados
│   └── category.go
├── utils/             # Utilitários
│   └── uuid.go        # Funções para UUID
├── main.go           # Ponto de entrada da aplicação
├── go.mod            # Dependências do Go
├── env.example       # Exemplo de variáveis de ambiente
└── README.md         # Este arquivo
```

## 🔧 Desenvolvimento

### Executar testes
```bash
go test ./...
```

### Executar com hot reload (requer air)
```bash
# Instalar air
go install github.com/cosmtrek/air@latest

# Executar
air
```

### Build para produção
```bash
go build -o my-finance-api main.go
```

## 📊 Banco de Dados

### Tabela: categories

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | VARCHAR(36) | ID único da categoria (UUID v4) |
| name | VARCHAR(255) | Nome da categoria |
| description | TEXT | Descrição da categoria |
| type | VARCHAR(10) | Tipo: 'income' ou 'expense' |
| color | VARCHAR(7) | Cor da categoria (hex) |
| icon | VARCHAR(50) | Ícone da categoria |
| parent_id | VARCHAR(36) | ID da categoria pai (UUID, para subcategorias) |
| is_active | BOOLEAN | Status ativo/inativo |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes. 