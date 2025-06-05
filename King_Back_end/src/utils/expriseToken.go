package utils

import (
	"fmt"

	"github.com/dgrijalva/jwt-go"
	jwtconfig "thelastking-blogger.com/src/config/jwt_config"
)

func ParseToken(tokenStr string) (*jwt.StandardClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &jwt.StandardClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtconfig.KeyJwt), nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*jwt.StandardClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}
