package jwtconfig

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

var KeyJwt string

func init() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	KeyJwt = os.Getenv("KEY_JWT")
	if KeyJwt == "" {
		log.Fatal("KEY_JWT is not set")
	}
}
