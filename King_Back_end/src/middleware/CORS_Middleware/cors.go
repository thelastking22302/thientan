package CORS_Middleware

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORSMiddleWare() gin.HandlerFunc {
	config := cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"PUT", "PATCH", "POST", "GET", "OPTIONS", "DELETE"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type", "Accept", "Sec-WebSocket-Protocol"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	return cors.New(config)
}
