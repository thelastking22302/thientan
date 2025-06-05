package security

import (
	"context"
	"errors"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	jwtconfig "thelastking-blogger.com/src/config/jwt_config"
	"thelastking-blogger.com/src/config/logger"
	"thelastking-blogger.com/src/module"
	"thelastking-blogger.com/src/repository/refresh_token_repo"
	"thelastking-blogger.com/src/service/refresh_token_service"
)

// ValidateAccessToken validates an access token (statelessly)
func ValidateAccessToken(tokenString string) (*module.Token, error) {
	log := logger.GetLogger()

	token, err := jwt.ParseWithClaims(
		tokenString,
		&module.Token{},
		func(token *jwt.Token) (any, error) {
			return []byte(jwtconfig.KeyJwt), nil
		},
	)
	if err != nil {
		log.Errorf("Access token parse failed: %v", err)
		return nil, errors.New("invalid access token")
	}

	claims, ok := token.Claims.(*module.Token)
	if !ok || !token.Valid {
		log.Errorf("Invalid access token claims or token not valid")
		return nil, errors.New("invalid access token claims")
	}

	if claims.ExpiresAt < time.Now().Unix() {
		log.Errorf("Access token has expired")
		return nil, errors.New("access token has expired")
	}

	log.Infof("Access token valid: UserID=%s", claims.UserID)
	return claims, nil
}

// UpdateToken refreshes an access token using a valid refresh token
func UpdateToken(ctx context.Context, db *gorm.DB, refreshTokenString string) (string, error) {
	claims, err := ValidateToken(ctx, db, refreshTokenString)
	if err != nil {
		return "", err
	}

	newClaims := module.Token{
		UserID: claims.UserID,
		Role:   claims.Role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Local().Add(time.Minute * time.Duration(15)).Unix(),
			IssuedAt:  time.Now().Unix(),
			NotBefore: time.Now().Unix(),
		},
	}

	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims).SignedString([]byte(jwtconfig.KeyJwt))
	if err != nil {
		logger.GetLogger().Errorf("Error generating new access token during refresh: %v", err)
		return "", errors.New("failed to generate new access token")
	}

	logger.GetLogger().Infof("Generated new access token for user %s via refresh token", claims.UserID)
	return accessToken, nil
}

// ValidateToken validates a refresh token by checking the database
func ValidateToken(ctx context.Context, db *gorm.DB, refreshTokenString string) (*module.Token, error) {
	log := logger.GetLogger()

	token, err := jwt.ParseWithClaims(
		refreshTokenString,
		&module.Token{},
		func(token *jwt.Token) (any, error) {
			return []byte(jwtconfig.KeyJwt), nil
		},
	)
	if err != nil {
		log.Errorf("Phân tích refresh token thất bại: Token=%s, Lỗi=%v", refreshTokenString, err)
		return nil, errors.New("refresh token không hợp lệ")
	}

	claims, ok := token.Claims.(*module.Token)
	if !ok || !token.Valid {
		log.Errorf("Claims refresh token không hợp lệ: Claims=%+v, Hợp lệ=%v", claims, token.Valid)
		return nil, errors.New("claims refresh token không hợp lệ")
	}

	log.Infof("Đang xác thực refresh token: UserID=%s, ExpiresAt=%d", claims.UserID, claims.ExpiresAt)

	buss := refresh_token_service.NewRefreshTokenController(refresh_token_repo.NewSql(db))
	dbToken, err := buss.NewGetRefreshTokenByTokenID(ctx, refreshTokenString) // Truy vấn cột token
	if err != nil {
		log.Errorf("Không tìm thấy refresh token trong cơ sở dữ liệu: Token=%s, Lỗi=%v", refreshTokenString, err)
		return nil, errors.New("refresh token không tìm thấy hoặc đã bị xóa")
	}

	if dbToken.Revoked {
		log.Errorf("Refresh token đã bị thu hồi: Token=%s", refreshTokenString)
		return nil, errors.New("refresh token đã bị thu hồi")
	}
	if dbToken.ExpiresAt.Before(time.Now()) {
		log.Errorf("Refresh token đã hết hạn: Token=%s, ExpiresAt=%v", refreshTokenString, dbToken.ExpiresAt)
		return nil, errors.New("refresh token đã hết hạn")
	}

	log.Infof("Refresh token đã được xác thực: UserID=%s, Token=%s", claims.UserID, refreshTokenString)
	return claims, nil
}

// ValidateCookieToken retrieves and validates the refresh token from a cookie
func ValidateCookieToken(ctx context.Context, c *gin.Context, db *gorm.DB) (*module.Token, error) {
	cookieToken, err := c.Cookie("refresh_token")
	if err != nil {
		logger.GetLogger().Errorf("Missing refresh_token cookie: %v", err)
		return nil, errors.New("refresh token cookie missing")
	}
	logger.GetLogger().Infof("Cookie refresh_token: %s", cookieToken)
	return ValidateToken(ctx, db, cookieToken)
}
