package factory_repo

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
	return &sql{db: db}
}

func (s *sql) CreateFactory(ctx context.Context, data *req_users.FactoriesInput) error {
	var dataLocation module.Locations
	if err := s.db.Table("locations").Where("name_local = ?", data.NameLocal).First(&dataLocation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("locations with name '%s' not found", *data.NameFactory)
		}
		return err
	}
	newId, err := utils.GenerateUUID()
	if err != nil {
		return err
	}

	times := time.Now().UTC()
	newFactory := module.Factories{
		Factory_ID:  newId,
		NameFactory: data.NameFactory,
		CreatedAt:   &times,
		UpdatedAt:   &times,
		Location_ID: dataLocation.Location_ID,
	}
	if err := s.db.Table("factories").Create(&newFactory).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) GetFactory(ctx context.Context, id map[string]any) (*module.Factories, error) {
	var data module.Factories
	if err := s.db.Table("factories").Where(id).Find(&data).Error; err != nil {
		return nil, err
	}
	return &data, nil
}

func (s *sql) UpdateFactory(ctx context.Context, id map[string]any, upd *module.Factories) error {
	if err := s.db.Table("factories").Where(id).Updates(upd).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) DeleteFactory(ctx context.Context, id map[string]any) error {
	if err := s.db.Table("factories").Where(id).Delete(&module.Factories{}).Error; err != nil {
		return err
	}
	return nil
}

func (s *sql) GetFactoryList(ctx context.Context, pagging *common.Paggings, morekeys ...string) ([]module.Factories, error) {
	var data []module.Factories
	if err := s.db.Table("factories").Count(&pagging.Total).Error; err != nil {
		return nil, err
	}
	if err := s.db.Table("factories").
		Order("factory_id desc").
		Offset((pagging.Page - 1) * pagging.Limit).Limit(pagging.Limit).Find(&data).Error; err != nil {
		return nil, err
	}
	return data, nil
}

func (s *sql) GetFactoryListByLocal(ctx context.Context, locationName map[string]any) ([]module.Factories, error) {
	var listFactory []module.Factories
	if err := s.db.Table("factories AS f").
		Select("f.*").
		Joins("JOIN locations AS l ON l.location_id = f.location_id").
		Where(locationName).Find(&listFactory).Error; err != nil {
		return nil, err
	}
	return listFactory, nil
}
