package product_repo

import (
	"context"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
	"thelastking-blogger.com/src/controller/common"
	"thelastking-blogger.com/src/module"
	"thelastking-blogger.com/src/module/req_users"
	"thelastking-blogger.com/src/utils"
)

type sql struct {
	db *gorm.DB
}

func NewSql(db *gorm.DB) *sql {
	return &sql{
		db: db,
	}
}

func (s *sql) CreateProduct(ctx context.Context, data *req_users.ProductInput) error {
	var factory module.Factories
	if err := s.db.Table("factories").Where("name_factory = ?", data.NameFactory).First(&factory).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("factory with name '%s' not found", *data.NameFactory)
		}
		return err
	}
	newId, err := utils.GenerateUUID()
	if err != nil {
		return err
	}
	times := time.Now().UTC()
	product := module.Products{
		Product_ID: newId,
		Title:      data.Title,
		Image:      data.Image,
		Video:      data.Video,
		Status:     data.Status,
		Describe:   data.Describe,
		Year:       data.Year,
		CreatedAt:  &times,
		UpdatedAt:  &times,
		Factory_ID: factory.Factory_ID,
	}

	if err := s.db.Table("products").Create(&product).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) GetProduct(ctx context.Context, idProduct map[string]any) (*module.Products, error) {
	var data module.Products
	if err := s.db.Table("products").Where(idProduct).First(&data).Error; err != nil {
		return nil, err
	}
	return &data, nil
}

func (s *sql) UpdateProduct(ctx context.Context, idProduct map[string]any, upd *req_users.ProductInput) error {
	if err := s.db.Table("products").Where(idProduct).Updates(upd).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) DeleteProduct(ctx context.Context, idProduct map[string]any) error {
	if err := s.db.Table("products").Where(idProduct).Delete(&module.Products{}).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) GetProductsList(ctx context.Context, pagging *common.Paggings, morekeys ...string) ([]module.Products, error) {
	var data []module.Products
	db := s.db.Table("products AS p").
		Select("p.*, f.name_factory").
		Joins("JOIN factories AS f ON p.factory_id = f.factory_id")

	if err := db.Count(&pagging.Total).Error; err != nil {
		return nil, err
	}
	if err := db.Order("p.product_id desc").Offset((pagging.Page - 1) * pagging.Limit).Limit(pagging.Limit).Find(&data).Error; err != nil {
		return nil, err
	}
	return data, nil
}

func (s *sql) GetProductsByFactories(ctx context.Context, factoryName map[string]any) ([]module.Products, error) {
	var listProduct []module.Products

	db := s.db.WithContext(ctx).
		Table("products AS P").
		Select("p.*, f.name_factory").
		Joins("JOIN factories AS f ON p.factory_id = f.factory_id").
		Where(factoryName).Find(&listProduct)

	if err := db.Error; err != nil {
		return nil, err
	}
	return listProduct, nil
}

func (s *sql) GetProductsByLocation(ctx context.Context, locationName map[string]any) ([]module.Products, error) {
	var listProduct []module.Products
	db := s.db.Table("products AS p").
		Select("p.*, l.name_local").
		Joins("JOIN factories AS f ON p.factory_id = f.factory_id").
		Joins("JOIN locations AS l ON l.location_id = f.location_id").
		Where(locationName).Find(&listProduct)

	if err := db.Error; err != nil {
		return nil, err
	}
	return listProduct, nil
}
