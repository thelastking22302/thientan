package req_users

import "time"

type ProductInput struct {
	Title       *string    `json:"title" validate:"required,min=2,max=100" gorm:"column:title;"`
	Image       *string    `json:"image" validate:"required" gorm:"column:image;"`
	Video       *string    `json:"video"  gorm:"column:video;"`
	Status      *string    `json:"status" validate:"required" gorm:"column:status;"`
	Year        *time.Time `json:"year_product" validate:"required" gorm:"column:year_product;type:date;"`
	Describe    string     `json:"describe_product" validate:"required" gorm:"column:describe_product;"`
	NameFactory *string    `json:"name_factory" validate:"required" gorm:"column:name_factory;"`
	UpdatedAt   *time.Time `json:"updated_at" gorm:"column:updated_at;"`
}
