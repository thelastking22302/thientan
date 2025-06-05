package refresh_token_repo

import (
	"context"
	"time"

	"gorm.io/gorm"
	"thelastking-blogger.com/src/config/logger"
	"thelastking-blogger.com/src/module"
)

type sql struct {
	db *gorm.DB
}

func NewSql(db *gorm.DB) *sql {
	return &sql{
		db: db,
	}
}

func (s *sql) DeleteRefreshTokenByTokenID(ctx context.Context, tokenID string) error {
	if err := s.db.Table("refresh_tokens").
		Where("token = ? AND revoked = ? AND expires_at > ?", tokenID, false, time.Now()).
		Delete(&module.RefreshToken{}).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) RevokeRefreshTokenByUserID(ctx context.Context, userID string) error {
	if err := s.db.Table("refresh_tokens").
		Where("user_id = ? AND revoked = ?", userID, false).
		Update("revoked", true).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) GetRefreshTokenByTokenID(ctx context.Context, tokenID string) (*module.RefreshToken, error) {
	var token module.RefreshToken
	if err := s.db.Table("refresh_tokens").Where("token = ?", tokenID).First(&token).Error; err != nil {
		logger.GetLogger().Errorf("Không tìm thấy refresh token: TokenID=%s, Lỗi=%v", tokenID, err)
		return nil, err
	}
	return &token, nil
}

func (s *sql) CreateRefreshToken(ctx context.Context, data *module.RefreshToken) error {
	if err := s.db.Table("refresh_tokens").Create(&data).Error; err != nil {
		logger.GetLogger().Errorf("Không thể tạo refresh token: %v", err)
		return err
	}
	return nil
}
func (s *sql) CleanupOldRevokedTokens(ctx context.Context) error {
	if err := s.db.Table("refresh_tokens").Where("revoked = ? AND expires_at < ?", true, time.Now()).Delete(&module.RefreshToken{}).Error; err != nil {
		return err
	}
	return nil
}
