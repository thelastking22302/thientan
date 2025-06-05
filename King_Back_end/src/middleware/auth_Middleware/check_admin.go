package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"thelastking-blogger.com/src/module"
)

func IsAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		var dataUser module.Users
		if err := c.ShouldBind(&dataUser); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"command": "middleware error",
			})
			return
		}
		admin := "admin"
		if dataUser.Role != &admin {
			c.JSON(http.StatusBadRequest, gin.H{
				"command": "you not api",
			})
			return
		}
		c.Next()
	}
}
