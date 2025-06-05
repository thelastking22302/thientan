package utils

import (
	"strings"
)

func ParseRole(role string) string {
	switch strings.ToUpper(role) {
	case "ADMIN":
		return "ADMIN"
	case "ROOT":
		return "ROOT"
	default:
		return "USER"
	}
}

// func ParseAndValidateToken(ctx context.Context, db *gorm.DB, tokenInput string) (*module.Token, error) {
// 	if tokenInput == "" {
// 		return nil, errors.New("Token is missing")
// 	}

// 	var tokenString string
// 	const bearerPrefix = "Bearer "

// 	if strings.HasPrefix(tokenInput, bearerPrefix) {
// 		tokenString = strings.TrimPrefix(tokenInput, bearerPrefix)
// 	} else {
// 		tokenString = tokenInput // từ cookie
// 	}

// 	claims, err := security.ValidateToken(ctx, db, tokenString)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return claims, nil
// }
