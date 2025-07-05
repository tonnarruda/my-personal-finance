# My Finance - Frontend

Frontend do sistema financeiro pessoal desenvolvido em React com TypeScript.

## 🚀 Tecnologias

- **React 18** - Biblioteca principal
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework de estilização
- **Axios** - Cliente HTTP
- **React Router** - Roteamento

## 📋 Pré-requisitos

- Node.js 16+ 
- npm ou yarn
- Backend rodando na porta 8080

## ⚙️ Configuração

### 1. Instalar dependências
```bash
npm install
```

### 2. Executar em desenvolvimento
```bash
npm start
```

O frontend estará disponível em `http://localhost:3000`

### 3. Build para produção
```bash
npm run build
```

## 🎨 Funcionalidades

### ✅ **Gestão de Categorias**
- **Criar categorias** - Formulário completo com validação
- **Editar categorias** - Modificar dados existentes
- **Excluir categorias** - Soft delete com confirmação
- **Subcategorias** - Hierarquia de categorias
- **Filtros** - Por tipo (receita/despesa)

### ✅ **Interface Moderna**
- **Design responsivo** - Funciona em desktop e mobile
- **Tema consistente** - Cores e tipografia padronizadas
- **Feedback visual** - Loading states e mensagens de erro
- **Preview em tempo real** - Visualização da categoria sendo criada

### ✅ **Validações**
- **Campos obrigatórios** - Nome, descrição, tipo
- **UUIDs válidos** - Validação de IDs
- **Cores hexadecimais** - Seletor de cores
- **Ícones** - Biblioteca de emojis

## 🏗️ Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── CategoryForm.tsx  # Formulário de categoria
│   └── CategoryList.tsx  # Lista de categorias
├── pages/               # Páginas da aplicação
│   └── CategoriesPage.tsx
├── services/            # Serviços de API
│   └── api.ts
├── types/               # Tipos TypeScript
│   └── category.ts
├── App.tsx             # Componente principal
└── index.css           # Estilos globais
```

## 🔧 Configuração da API

O frontend está configurado para se conectar ao backend na porta 8080:

```typescript
const API_BASE_URL = 'http://localhost:8080/api';
```

Para alterar a URL da API, edite o arquivo `src/services/api.ts`.

## 🎯 Como Usar

### 1. Criar uma Categoria
1. Clique em "Nova Categoria"
2. Preencha o formulário:
   - **Nome**: Nome da categoria
   - **Descrição**: Descrição detalhada
   - **Tipo**: Receita ou Despesa
   - **Cor**: Selecione uma cor
   - **Ícone**: Escolha um emoji
   - **Categoria Pai**: Opcional (para subcategorias)
3. Clique em "Criar"

### 2. Editar uma Categoria
1. Clique no ícone de editar (lápis) na categoria
2. Modifique os campos desejados
3. Clique em "Atualizar"

### 3. Excluir uma Categoria
1. Clique no ícone de excluir (lixeira) na categoria
2. Confirme a exclusão

### 4. Criar Subcategoria
1. Clique no ícone "+" na categoria pai
2. Preencha o formulário normalmente
3. A categoria pai será automaticamente selecionada

## 🎨 Personalização

### Cores
As cores podem ser personalizadas no arquivo `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: { /* suas cores */ },
      success: { /* suas cores */ },
      danger: { /* suas cores */ }
    }
  }
}
```

### Ícones
Para adicionar mais ícones, edite o array `iconOptions` no componente `CategoryForm.tsx`.

## 🚀 Deploy

### Build de Produção
```bash
npm run build
```

### Servir Build
```bash
npx serve -s build
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. 