package module

import "time"

type Locations struct {
	Location_ID string     `json:"location_id" gorm:"column:location_id;"`
	NameLocal   *string    `json:"name_local" validate:"required" gorm:"column:name_local;"`
	CreatedAt   *time.Time `json:"created_at" gorm:"column:created_at;"`
	UpdatedAt   *time.Time `json:"updated_at" gorm:"column:updated_at;"`
}
