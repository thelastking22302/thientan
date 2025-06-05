package req_users

type FactoriesInput struct {
	NameFactory *string `json:"name_factory" validate:"required" gorm:"column:name_factory;"`
	NameLocal   *string `json:"name_local" validate:"required" gorm:"column:name_local;"`
}
