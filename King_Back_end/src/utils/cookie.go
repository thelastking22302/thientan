package utils

import (
	"time"

	"github.com/gin-gonic/gin"
)

func SetRefreshTokenCookie(c *gin.Context, token string, duration time.Duration) {
	c.SetCookie(
		"refresh_token",         // Tên cookie
		token,                   // Giá trị cookie (refresh token)
		int(duration.Seconds()), // Thời gian sống (giây)
		"/",                     // Path
		"",                      // Domain (mặc định theo host hiện tại)
		false,                   // Secure: chỉ truyền qua HTTPS //deloy lên dự án thì đổi lại về true
		true,                    // HttpOnly: không cho JS truy cập
	)
}

func ClearRefreshTokenCookie(c *gin.Context) {
	c.SetCookie(
		"refresh_token", // Tên cookie
		"",              // Xóa giá trị
		-1,              // Thời gian âm => bị xóa
		"/",
		"",
		true,
		true,
	)
}
