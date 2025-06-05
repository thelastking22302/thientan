package module

import "time"

type Users struct {
	UserID        string     `json:"user_id" gorm:"column:user_id;"`
	FullName      string     `json:"full_name" gorm:"column:full_name;" validate:"required"`
	Account       string     `json:"account" gorm:"column:account;" validate:"required,thientan_email"`
	Password_user string     `json:"password_user" gorm:"column:password_user;" validate:"required,secure_password"`
	Tag           string     `json:"tag" gorm:"column:tag;" validate:"required"`
	Role          *string    `json:"role_user" gorm:"column:role_user;"`
	CreatedAt     *time.Time `json:"created_at" gorm:"column:created_at;"`
	UpdatedAt     *time.Time `json:"updated_at" gorm:"column:updated_at;"`
}
