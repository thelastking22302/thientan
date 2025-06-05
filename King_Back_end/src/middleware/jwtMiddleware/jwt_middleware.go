package jwtmiddleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"thelastking-blogger.com/src/security"
)

// JwtMiddleware validates the access token from the Authorization header
func JwtMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		const bearerPrefix = "Bearer "
		tokenString := ""

		// Check for the "Bearer " prefix and extract the token string
		if strings.HasPrefix(authHeader, bearerPrefix) {
			tokenString = strings.TrimPrefix(authHeader, bearerPrefix)
		} else {
			// If it doesn't have the Bearer prefix, it's not a valid access token format
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer <token>"})
			return
		}

		// Use the correct ValidateAccessToken function for stateless validation
		claims, err := security.ValidateAccessToken(tokenString)

		if err != nil {
			// The error message comes from ValidateAccessToken (e.g., "invalid access token", "access token has expired")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid access token: " + err.Error()})
			return
		}

		// Set user ID and role in context for subsequent handlers
		c.Set("userId", claims.UserID)
		if claims.Role != nil {
			c.Set("role", *claims.Role)
		} else {
			c.Set("role", "")
		}
		c.Next()
	}
}
