package factory_service

import (
	"context"

	"thelastking-blogger.com/src/config/logger"
	"thelastking-blogger.com/src/controller/common"
	"thelastking-blogger.com/src/module"
	"thelastking-blogger.com/src/module/req_users"
)

type FactoryResponse interface {
	CreateFactory(ctx context.Context, data *req_users.FactoriesInput) error
	GetFactory(ctx context.Context, id map[string]any) (*module.Factories, error)
	UpdateFactory(ctx context.Context, id map[string]any, upd *module.Factories) error
	DeleteFactory(ctx context.Context, id map[string]any) error
	GetFactoryList(ctx context.Context, pagging *common.Paggings, morekeys ...string) ([]module.Factories, error)
	GetFactoryListByLocal(ctx context.Context, locationName map[string]any) ([]module.Factories, error)
}

type factoryController struct {
	f   FactoryResponse
	log logger.Logger
}

func NewFactoryController(f FactoryResponse) *factoryController {
	return &factoryController{
		f:   f,
		log: logger.GetLogger(),
	}
}

func (res *factoryController) NewCreateFactory(ctx context.Context, data *req_users.FactoriesInput) error {
	if err := res.f.CreateFactory(ctx, data); err != nil {
		res.log.Errorf("Failed to create facotory: %v", err)
		return err
	}
	res.log.Infof("Factory created successfully: %+v", data)
	return nil
}

func (res *factoryController) NewGetFactory(ctx context.Context, id string) (*module.Factories, error) {
	data, err := res.f.GetFactory(ctx, map[string]any{"factory_id": id})
	if err != nil {
		res.log.Errorf("Failed to get facotory with ID %s: %v", id, err)
		return nil, err
	}
	res.log.Infof("Retrieved facotory: %+v", data)
	return data, nil
}

func (res *factoryController) NewUpdateFactory(ctx context.Context, id string, upd *module.Factories) error {
	if err := res.f.UpdateFactory(ctx, map[string]any{"factory_id": id}, upd); err != nil {
		res.log.Errorf("Failed to update facotory with ID %s: %v", id, err)
		return err
	}
	res.log.Infof("facotory with ID %s updated successfully: %+v", id)
	return nil
}

func (res *factoryController) NewDeleteFactory(ctx context.Context, id string) error {
	if err := res.f.DeleteFactory(ctx, map[string]any{"factory_id": id}); err != nil {
		res.log.Errorf("Failed to delete facotory with ID %s: %v", id, err)
		return err
	}
	res.log.Infof("facotory with ID %s deleted successfully", id)
	return nil
}

func (res *factoryController) NewGetFactoryList(ctx context.Context, pagging *common.Paggings) ([]module.Factories, error) {
	listData, err := res.f.GetFactoryList(ctx, pagging)
	if err != nil {
		res.log.Errorf("Failed to get facotory list: %v", err)
		return nil, err
	}
	res.log.Infof("Retrieved facotory list: %d facotory found", len(listData))
	return listData, nil
}

func (res *factoryController) NewGetFactoryListByLocal(ctx context.Context, locationName string) ([]module.Factories, error) {
	dataFactoryList, err := res.f.GetFactoryListByLocal(ctx, map[string]any{"l.name_local": locationName})
	if err != nil {
		res.log.Errorf("Failed to get factory list by location: %v", err)
		return nil, err
	}
	if len(dataFactoryList) == 0 {
		res.log.Warnf("No factories found for location: %s", locationName)
	}
	res.log.Infof("Retrieved factory by location list: %d factories found", len(dataFactoryList))
	return dataFactoryList, nil
}
