package utils

import (
	"time"

	"github.com/dgrijalva/jwt-go"
	jwtconfig "thelastking-blogger.com/src/config/jwt_config"
	"thelastking-blogger.com/src/config/logger"
	"thelastking-blogger.com/src/module"
)

func GenerateTokens(data *module.Users) (string, string, error) {
	// Claims cho Access Token
	newClaimsAccess := &module.Token{
		UserID: data.UserID,
		Role:   data.Role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Local().Add(time.Minute * time.Duration(24)).Unix(),
			IssuedAt:  time.Now().Unix(),
			NotBefore: time.Now().Unix(),
		},
	}

	// Claims cho Refresh Token
	newClaimsRefresh := &module.Token{
		UserID: data.UserID,
		Role:   data.Role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Local().Add(time.Hour * time.Duration(24*7)).Unix(),
			IssuedAt:  time.Now().Unix(),
			NotBefore: time.Now().Unix(),
		},
	}

	// Tạo và ký token
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaimsAccess).SignedString([]byte(jwtconfig.KeyJwt))
	if err != nil {
		logger.GetLogger().Errorf("Không thể ký access token: %v", err)
		return "", "", err
	}

	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaimsRefresh).SignedString([]byte(jwtconfig.KeyJwt))
	if err != nil {
		logger.GetLogger().Errorf("Không thể ký refresh token: %v", err)
		return "", "", err
	}

	// Trả về access token, refresh token và tokenID
	return accessToken, refreshToken, nil
}
