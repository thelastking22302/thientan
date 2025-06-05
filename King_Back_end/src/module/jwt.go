package module

import "github.com/dgrijalva/jwt-go"

type Token struct {
	UserID string  `json:"user_id"`
	Role   *string `json:"role_user"`
	jwt.StandardClaims
}
