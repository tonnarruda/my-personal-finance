# Keep-Alive Service (Go)

Este serviço mantém o backend no Render "acordado" fazendo ping no health check a cada minuto e enviando logs para o backend.

## Como usar

### 1. Execução simples (Go)
```bash
go run keep-alive.go
```

### 2. Com script shell (Go)
```bash
./start-keep-alive-go.sh
```

### 3. Execução simples (Node.js - legado)
```bash
node keep-alive.js
```

### 4. Com script shell (Node.js - legado)
```bash
./start-keep-alive.sh
```

### 3. Com variáveis de ambiente
Crie um arquivo `.env.keep-alive`:
```
REACT_APP_API_BASE_URL=https://my-personal-finance.onrender.com/api
```

## Configuração

### Variáveis de ambiente
- `REACT_APP_API_BASE_URL`: URL base da API (opcional)
  - Se não definida, usa: `https://my-personal-finance.onrender.com/api`
  - O script automaticamente substitui `/api` por `/health`
- `ENVIRONMENT`: Ambiente de execução (opcional)
  - Padrão: "production"

### Intervalo
- Padrão: 20 segundos
- Para alterar, edite `INTERVAL` no arquivo `keep-alive.go`

## Logs

O script mostra logs detalhados e envia para o backend:
```
🚀 Starting keep-alive service for https://my-personal-finance.onrender.com/health
⏰ Interval: 20 seconds
📅 Started at: 2024-01-15 10:30:00
🌍 Environment: production
[2024-01-15 10:30:00] ✅ Health check: 200 OK (0.15s)
[2024-01-15 10:30:00] 📝 Log sent to backend successfully
```

## Parar o serviço

Use `Ctrl+C` para parar o serviço graciosamente.

## Deploy contínuo

Para manter o serviço rodando 24/7, você pode:

1. **Usar PM2:**
```bash
npm install -g pm2
pm2 start keep-alive.js --name "keep-alive"
pm2 startup
pm2 save
```

2. **Usar systemd (Linux):**
```bash
sudo systemctl enable keep-alive
sudo systemctl start keep-alive
```

3. **Usar cron (Linux/Mac):**
```bash
# Adicionar ao crontab
* * * * * /usr/bin/node /path/to/keep-alive.js
``` 