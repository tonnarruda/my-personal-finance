#!/bin/bash

echo "🚀 Starting keep-alive service (Go) for backend..."
echo "📅 Started at: $(date)"
echo "🔗 Backend URL: Will use REACT_APP_API_BASE_URL or fallback to https://my-personal-finance.onrender.com/health"
echo "⏰ Interval: 30 seconds"
echo "📝 Simple GET requests to /health"
echo ""

# Carregar variáveis de ambiente se existir
if [ -f .env.keep-alive ]; then
  echo "📄 Loading environment variables from .env.keep-alive"
  export $(cat .env.keep-alive | grep -v '^#' | xargs)
fi

# Definir ambiente se não estiver definido
if [ -z "$ENVIRONMENT" ]; then
  export ENVIRONMENT="production"
fi

# Executar o script Go
go run keep-alive.go 