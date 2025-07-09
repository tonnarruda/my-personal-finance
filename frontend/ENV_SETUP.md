# Configuração de Variáveis de Ambiente

## Variáveis Necessárias

### Para Produção (Vercel)
Configure as seguintes variáveis no painel do Vercel:

```
REACT_APP_API_BASE_URL=https://my-personal-finance.onrender.com/api
```

### Para Desenvolvimento Local
Crie um arquivo `.env` na pasta `frontend/` com:

```
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

## Como Configurar no Vercel

1. Acesse o [painel do Vercel](https://vercel.com)
2. Vá para seu projeto `my-finance-dusky`
3. Clique em "Settings" → "Environment Variables"
4. Adicione a variável:
   - **Name**: `REACT_APP_API_BASE_URL`
   - **Value**: `https://my-personal-finance.onrender.com/api`
   - **Environment**: Production, Preview, Development
5. Clique em "Save"
6. Faça um novo deploy

## Verificação

Após configurar, você pode verificar se está funcionando:
- Abra o console do navegador
- Digite: `console.log(process.env.REACT_APP_API_BASE_URL)`
- Deve mostrar a URL do backend 