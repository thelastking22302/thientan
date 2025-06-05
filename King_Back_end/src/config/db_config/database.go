package db_config

import (
	"os"
	"sync"

	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"thelastking-blogger.com/src/config/logger"
	"thelastking-blogger.com/src/database"
)

type Singleton struct{}

var (
	once     sync.Once
	instance *Singleton
)

func GetInstance() *Singleton {
	once.Do(func() {
		instance = &Singleton{}
	})
	return instance
}

func (s *Singleton) Run() *gorm.DB {
	myLogger := logger.GetLogger()
	err := godotenv.Load(".env")
	if err != nil {
		myLogger.Warnf("Error loading .env file: %v", err)
	}
	userName := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	host := os.Getenv("POSTGRES_HOST")
	port := os.Getenv("POSTGRES_PORT")
	dbName := os.Getenv("POSTGRES_DB")
	config := &database.Config{
		Host:     host,
		Port:     port,
		Password: password,
		User:     userName,
		DbName:   dbName,
	}
	db, err := config.NewConnection()
	if err != nil {
		myLogger.Errorf("Fails to connect to database: %v", err)
	}
	myLogger.Infof("Connect suscess to database: %v", db)
	return db
}
