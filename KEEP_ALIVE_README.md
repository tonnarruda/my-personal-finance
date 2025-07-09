# Keep-Alive Service

Este serviço mantém o backend no Render "acordado" fazendo ping no health check a cada minuto.

## Como usar

### 1. Execução simples
```bash
node keep-alive.js
```

### 2. Com script shell
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

### Intervalo
- Padrão: 60 segundos (1 minuto)
- Para alterar, edite `INTERVAL_MS` no arquivo `keep-alive.js`

## Logs

O script mostra logs detalhados:
```
🚀 Starting keep-alive service for https://my-personal-finance.onrender.com/health
⏰ Interval: 60 seconds
📅 Started at: 2024-01-15T10:30:00.000Z
[2024-01-15T10:30:00.000Z] Health check: 200 OK
[2024-01-15T10:30:00.000Z] Response: My Finance API está funcionando!
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