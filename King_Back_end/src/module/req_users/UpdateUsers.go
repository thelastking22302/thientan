package req_users

import "time"

type UpdateUsers struct {
	FullName  string     `json:"full_name" gorm:"column:full_name;"`
	Tag       string     `json:"tag" gorm:"column:tag;"`
	UpdatedAt *time.Time `json:"updated_at" gorm:"column:updated_at;"`
}
