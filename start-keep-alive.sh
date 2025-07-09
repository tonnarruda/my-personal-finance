#!/bin/bash

echo "🚀 Starting keep-alive service for backend..."
echo "📅 Started at: $(date)"
echo "🔗 Backend URL: Will use REACT_APP_API_BASE_URL or fallback to https://my-personal-finance.onrender.com/health"
echo "⏰ Interval: 60 seconds"
echo ""

# Carregar variáveis de ambiente se existir
if [ -f .env.keep-alive ]; then
  echo "📄 Loading environment variables from .env.keep-alive"
  export $(cat .env.keep-alive | grep -v '^#' | xargs)
fi

# Executar o script Node.js
node keep-alive.js 