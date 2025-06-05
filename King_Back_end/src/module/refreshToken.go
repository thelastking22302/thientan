package module

import (
	"time"
)

type RefreshToken struct {
	Token     string    `gorm:"column:token;"`
	UserID    string    `gorm:"column:user_id;"`
	ExpiresAt time.Time `gorm:"column:expires_at;"`
	Revoked   bool      `gorm:"column:revoked;"`
	CreatedAt time.Time `gorm:"column:created_at;"`
}
