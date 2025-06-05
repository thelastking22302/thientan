package location_repo

import (
	"context"

	"gorm.io/gorm"
	"thelastking-blogger.com/src/controller/common"
	"thelastking-blogger.com/src/module"
)

type sql struct {
	db *gorm.DB
}

func NewSql(db *gorm.DB) *sql {
	return &sql{db: db}
}

func (s *sql) CreateLocation(ctx context.Context, data *module.Locations) error {
	if err := s.db.Table("locations").Create(&data).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) GetLocation(ctx context.Context, id map[string]any) (*module.Locations, error) {
	var data module.Locations
	if err := s.db.Table("locations").Where(id).First(&data).Error; err != nil {
		return nil, err
	}
	return &data, nil
}

func (s *sql) UpdateLocation(ctx context.Context, id map[string]any, upd *module.Locations) error {
	if err := s.db.Table("locations").Where(id).Updates(upd).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) DeleteLocation(ctx context.Context, id map[string]any) error {
	var dataLocation module.Locations
	if err := s.db.Table("locations").Where(id).Delete(&dataLocation).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) ListLocation(ctx context.Context, pagging *common.Paggings, morekeys ...string) ([]module.Locations, error) {
	var data []module.Locations
	if err := s.db.Table("locations").Count(&pagging.Total).Error; err != nil {
		return nil, err
	}
	if err := s.db.Table("locations").
		Order("location_id desc").
		Offset((pagging.Page - 1) * pagging.Limit).Limit(pagging.Limit).Find(&data).Error; err != nil {
		return nil, err
	}
	return data, nil
}
