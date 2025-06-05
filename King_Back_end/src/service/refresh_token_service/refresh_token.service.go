package refresh_token_service

import (
	"context"
	"time"

	"thelastking-blogger.com/src/config/logger"
	"thelastking-blogger.com/src/module"
)

type RefreshTokenResponse interface {
	CreateRefreshToken(ctx context.Context, data *module.RefreshToken) error
	GetRefreshTokenByTokenID(ctx context.Context, tokenID string) (*module.RefreshToken, error)
	DeleteRefreshTokenByTokenID(ctx context.Context, tokenID string) error
	RevokeRefreshTokenByUserID(ctx context.Context, userID string) error
	CleanupOldRevokedTokens(ctx context.Context) error
}

type refreshTokenController struct {
	r   RefreshTokenResponse
	log logger.Logger
}

func NewRefreshTokenController(r RefreshTokenResponse) *refreshTokenController {
	return &refreshTokenController{
		r:   r,
		log: logger.GetLogger(),
	}
}

func (res *refreshTokenController) NewGetRefreshTokenByTokenID(ctx context.Context, tokenID string) (*module.RefreshToken, error) {
	data, err := res.r.GetRefreshTokenByTokenID(ctx, tokenID)
	if err != nil {
		res.log.Errorf("Refresh token non-existent: %v", err)
		return nil, err
	}
	res.log.Infof("Refresh token existent: %+v", data)
	return data, nil
}

func (res *refreshTokenController) NewDeleteRefreshTokenByTokenID(ctx context.Context, tokenID string) error {
	if err := res.r.DeleteRefreshTokenByTokenID(ctx, tokenID); err != nil {
		res.log.Errorf("Refresh token non-existent: %v", err)
		return err
	}
	res.log.Infof("Refresh token has been deleted")
	return nil
}

func (res *refreshTokenController) NewCreateRefreshToken(ctx context.Context, data *module.RefreshToken) error {
	if err := res.r.CreateRefreshToken(ctx, data); err != nil {
		res.log.Errorf("Create refresh token faild: %v", err)
		return err
	}
	res.log.Infof("Create refresh token success")
	return nil
}

func (res *refreshTokenController) NewRevokeRefreshTokenByUserID(ctx context.Context, userID string) error {
	if err := res.r.RevokeRefreshTokenByUserID(ctx, userID); err != nil {
		return err
	}
	return nil
}

func (res *refreshTokenController) NewCleanupOldRevokedTokens(ctx context.Context) error {
	if err := res.r.CleanupOldRevokedTokens(ctx); err != nil {
		return err
	}
	return nil
}
func RunCleanupTokensJob(controller *refreshTokenController) {
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				ctx := context.Background()
				if err := controller.NewCleanupOldRevokedTokens(ctx); err != nil {
					controller.log.Errorf("Failed to cleanup old revoked tokens: %v", err)
				} else {
					controller.log.Infof("Old revoked tokens cleaned up successfully")
				}
			}
		}
	}()
}
