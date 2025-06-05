package module

import "time"

type Products struct {
	Product_ID  string     `json:"product_id" gorm:"column:product_id;"`
	Title       *string    `json:"title" validate:"required,min=2,max=100" gorm:"column:title;"`
	Image       *string    `json:"image" validate:"required" gorm:"column:image;"`
	Video       *string    `json:"video"  gorm:"column:video;"`
	Status      *string    `json:"status" validate:"required" gorm:"column:status;"`
	Describe    string     `json:"describe_product" validate:"required" gorm:"column:describe_product;"`
	Year        *time.Time `json:"year_product" validate:"required" gorm:"column:year_product;type:date;"`
	CreatedAt   *time.Time `json:"created_at" gorm:"column:created_at;"`
	UpdatedAt   *time.Time `json:"updated_at" gorm:"column:updated_at;"`
	Factory_ID  string     `json:"factory_id"  gorm:"column:factory_id;"`
	NameFactory string     `json:"name_factory" gorm:"-"`
}
