package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
	"github.com/tonnarruda/my-personal-finance/database"
	"github.com/tonnarruda/my-personal-finance/handlers"
	"github.com/tonnarruda/my-personal-finance/routes"
	"github.com/tonnarruda/my-personal-finance/services"

	// Migrate
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func runMigrations(db *database.Database) error {
	migrationsPath, err := filepath.Abs("migrations")
	if err != nil {
		return err
	}
	driver, err := postgres.WithInstance(db.GetDB(), &postgres.Config{})
	if err != nil {
		return err
	}
	m, err := migrate.NewWithDatabaseInstance("file://"+migrationsPath, "postgres", driver)
	if err != nil {
		return err
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}
	log.Println("Migrations aplicadas com sucesso!")
	return nil
}

func main() {
	// Carregar variáveis de ambiente do arquivo .env
	if err := godotenv.Load(); err != nil {
		log.Printf("❌ Erro ao carregar .env: %v", err)
		log.Println("Usando variáveis de ambiente do sistema")
	} else {
		log.Println("✅ Arquivo .env carregado com sucesso")
	}

	// Configurações do banco de dados PostgreSQL
	dbConfig := database.DatabaseConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", "postgres"),
		DBName:   getEnv("DB_NAME", "my_finance"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
	}

	// Log das configurações para debug
	log.Printf("🔧 Configurações do banco:")
	log.Printf("   Host: %s", dbConfig.Host)
	log.Printf("   Port: %s", dbConfig.Port)
	log.Printf("   User: %s", dbConfig.User)
	log.Printf("   Password: %s", "***")
	log.Printf("   DBName: %s", dbConfig.DBName)
	log.Printf("   SSLMode: %s", dbConfig.SSLMode)

	// Inicializar banco de dados
	db, err := database.NewDatabase(dbConfig)
	if err != nil {
		log.Fatalf("Erro ao conectar com o banco de dados: %v", err)
	}
	defer db.Close()

	// Rodar migrations automaticamente
	if err := runMigrations(db); err != nil {
		log.Fatalf("Erro ao rodar migrations: %v", err)
	}

	// Inicializar serviços
	categoryService := services.NewCategoryService(db)
	transactionCreator := services.NewDatabaseTransactionCreator(db)
	accountService := services.NewAccountService(db, transactionCreator)
	userService := services.NewUserService(db)

	// Inicializar serviço de câmbio
	exchangeService := services.NewMockExchangeService() // Usar mock para desenvolvimento
	// Para produção, usar: services.NewExchangeService(os.Getenv("EXCHANGE_API_KEY"))

	// Inicializar handlers
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	accountHandler := handlers.NewAccountHandler(accountService)
	authHandler := handlers.NewAuthHandler(userService)
	transactionHandler := &handlers.TransactionHandler{DB: db, ExchangeService: exchangeService}
	exchangeHandler := handlers.NewExchangeHandler(exchangeService)
	keepAliveHandler := handlers.NewKeepAliveHandler()

	// Configurar rotas
	router := routes.SetupRoutes(categoryHandler, accountHandler, authHandler, transactionHandler, exchangeHandler, keepAliveHandler)

	// Configurar porta do servidor
	port := getEnv("PORT", "8080")

	log.Printf("🚀 Iniciando servidor na porta %s", port)
	log.Printf("📊 Banco de dados: %s:%s/%s", dbConfig.Host, dbConfig.Port, dbConfig.DBName)
	log.Printf("🔗 Health check: http://localhost:%s/health", port)
	log.Printf("📋 API de categorias: http://localhost:%s/api/categories", port)
	log.Printf("💰 API de contas: http://localhost:%s/api/accounts", port)

	// Iniciar servidor
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Erro ao iniciar servidor: %v", err)
	}
}

// getEnv obtém uma variável de ambiente ou retorna um valor padrão
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
