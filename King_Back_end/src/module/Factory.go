package module

import "time"

type Factories struct {
	Factory_ID  string     `json:"factory_id" gorm:"column:factory_id;"`
	NameFactory *string    `json:"name_factory" validate:"required" gorm:"column:name_factory;"`
	CreatedAt   *time.Time `json:"created_at" gorm:"column:created_at;"`
	UpdatedAt   *time.Time `json:"updated_at" gorm:"column:updated_at;"`
	Location_ID string     `json:"location_id"  gorm:"column:location_id;"`
}
