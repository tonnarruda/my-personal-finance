# Makefile para gerenciar o projeto My Personal Finance

.PHONY: help kill-ports start-backend start-frontend start-all stop-all clean

# Cores para output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

help: ## Mostra esta ajuda
	@echo "$(BLUE)Comandos disponíveis:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

kill-ports: ## Mata todos os processos nas portas 8080 e 3000
	@echo "$(YELLOW)Matando processos nas portas 8080 e 3000...$(NC)"
	@lsof -ti:8080 | xargs -r kill -9 2>/dev/null || echo "$(GREEN)✓ Nenhum processo na porta 8080$(NC)"
	@lsof -ti:3000 | xargs -r kill -9 2>/dev/null || echo "$(GREEN)✓ Nenhum processo na porta 3000$(NC)"
	@echo "$(GREEN)✅ Processos finalizados!$(NC)"

start-backend: ## Inicia o backend na porta 8080
	@echo "$(BLUE)Iniciando backend...$(NC)"
	@cd backend && go run main.go &
	@echo "$(GREEN)✅ Backend iniciado na porta 8080$(NC)"

start-frontend: ## Inicia o frontend na porta 3000
	@echo "$(BLUE)Iniciando frontend...$(NC)"
	@cd frontend && npm start &
	@echo "$(GREEN)✅ Frontend iniciado na porta 3000$(NC)"

run-all: kill-ports start-backend start-frontend ## Mata processos e inicia backend e frontend
	@echo "$(GREEN)🚀 Aplicação iniciada!$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:8080$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"

stop-all: ## Para todos os processos
	@echo "$(YELLOW)Parando todos os processos...$(NC)"
	@lsof -ti:8080 | xargs -r kill -9 2>/dev/null || echo "$(GREEN)✓ Backend parado$(NC)"
	@lsof -ti:3000 | xargs -r kill -9 2>/dev/null || echo "$(GREEN)✓ Frontend parado$(NC)"
	@echo "$(GREEN)✅ Todos os processos foram finalizados!$(NC)"

install-deps: ## Instala dependências do backend e frontend
	@echo "$(BLUE)Instalando dependências do backend...$(NC)"
	@cd backend && go mod tidy
	@echo "$(BLUE)Instalando dependências do frontend...$(NC)"
	@cd frontend && npm install
	@echo "$(GREEN)✅ Dependências instaladas!$(NC)"

build-backend: ## Compila o backend
	@echo "$(BLUE)Compilando backend...$(NC)"
	@cd backend && go build -o ../bin/backend main.go
	@echo "$(GREEN)✅ Backend compilado em bin/backend$(NC)"

build-frontend: ## Compila o frontend para produção
	@echo "$(BLUE)Compilando frontend...$(NC)"
	@cd frontend && npm run build
	@echo "$(GREEN)✅ Frontend compilado em frontend/build$(NC)"

build-all: build-backend build-frontend ## Compila backend e frontend

clean: ## Limpa arquivos temporários e builds
	@echo "$(YELLOW)Limpando arquivos temporários...$(NC)"
	@rm -rf bin/
	@rm -rf frontend/build/
	@rm -rf frontend/node_modules/.cache/
	@echo "$(GREEN)✅ Limpeza concluída!$(NC)"

dev: ## Modo desenvolvimento (inicia backend e frontend com logs)
	@echo "$(BLUE)Iniciando modo desenvolvimento...$(NC)"
	@make kill-ports
	@echo "$(BLUE)Iniciando backend em background...$(NC)"
	@cd backend && go run main.go > ../logs/backend.log 2>&1 &
	@echo "$(BLUE)Iniciando frontend em background...$(NC)"
	@cd frontend && npm start > ../logs/frontend.log 2>&1 &
	@echo "$(GREEN)🚀 Modo desenvolvimento iniciado!$(NC)"
	@echo "$(YELLOW)Logs do backend: tail -f logs/backend.log$(NC)"
	@echo "$(YELLOW)Logs do frontend: tail -f logs/frontend.log$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:8080$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"

logs: ## Mostra logs do backend e frontend
	@echo "$(BLUE)Logs do Backend:$(NC)"
	@tail -f logs/backend.log 2>/dev/null || echo "$(RED)Nenhum log encontrado$(NC)"

logs-frontend: ## Mostra logs do frontend
	@echo "$(BLUE)Logs do Frontend:$(NC)"
	@tail -f logs/frontend.log 2>/dev/null || echo "$(RED)Nenhum log encontrado$(NC)"

status: ## Mostra status dos processos
	@echo "$(BLUE)Status dos processos:$(NC)"
	@echo "$(YELLOW)Porta 8080 (Backend):$(NC)"
	@lsof -i:8080 2>/dev/null || echo "$(RED)Nenhum processo na porta 8080$(NC)"
	@echo "$(YELLOW)Porta 3000 (Frontend):$(NC)"
	@lsof -i:3000 2>/dev/null || echo "$(RED)Nenhum processo na porta 3000$(NC)"

# Cria diretório de logs se não existir
logs/:
	@mkdir -p logs

# Comandos que dependem do diretório logs
dev: logs/
