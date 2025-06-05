package req_users

import "time"

type UpdateUsersByID struct {
	FullName  string     `json:"full_name" gorm:"column:full_name;" `
	Tag       string     `json:"tag" gorm:"column:tag;"`
	Role      *string    `json:"role_user" gorm:"column:role_user;"`
	UpdatedAt *time.Time `json:"updated_at" gorm:"column:updated_at;"`
}
