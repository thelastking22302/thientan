package location_service

import (
	"context"

	"thelastking-blogger.com/src/config/logger"
	"thelastking-blogger.com/src/controller/common"
	"thelastking-blogger.com/src/module"
)

type LocationRespone interface {
	CreateLocation(ctx context.Context, data *module.Locations) error
	GetLocation(ctx context.Context, id map[string]any) (*module.Locations, error)
	UpdateLocation(ctx context.Context, id map[string]any, upd *module.Locations) error
	DeleteLocation(ctx context.Context, id map[string]any) error
	ListLocation(ctx context.Context, pagging *common.Paggings, morekeys ...string) ([]module.Locations, error)
}

type locationController struct {
	l   LocationRespone
	log logger.Logger
}

func NewLocationController(l LocationRespone) *locationController {
	return &locationController{
		l:   l,
		log: logger.GetLogger(),
	}
}

func (res *locationController) NewCreateLocation(ctx context.Context, data *module.Locations) error {
	if err := res.l.CreateLocation(ctx, data); err != nil {
		res.log.Errorf("Create location faild: %v", err)
		return err
	}
	res.log.Infof("Create location susscess: %+v", data)
	return nil
}

func (res *locationController) NewGetLocation(ctx context.Context, id string) (*module.Locations, error) {
	data, err := res.l.GetLocation(ctx, map[string]any{"location_id": id})
	if err != nil {
		res.log.Errorf("Get location faild: %v", err)
		return nil, err
	}
	res.log.Infof("Get location susscess: %+v", data)
	return data, nil
}

func (res *locationController) NewDeleteLocation(ctx context.Context, id string) error {
	if err := res.l.DeleteLocation(ctx, map[string]any{"location_id": id}); err != nil {
		res.log.Errorf("Delete location faild: %v", err)
		return err
	}
	res.log.Infof("Delete location susscess")
	return nil
}

func (res *locationController) NewUpdateLocation(ctx context.Context, id string, upd *module.Locations) error {
	if err := res.l.UpdateLocation(ctx, map[string]any{"location_id": id}, upd); err != nil {
		res.log.Errorf("Update location faild: %v", err)
		return err
	}
	res.log.Infof("Update location susscess")
	return nil
}

func (res *locationController) NewListLocation(ctx context.Context, pagging *common.Paggings) ([]module.Locations, error) {
	listData, err := res.l.ListLocation(ctx, pagging)
	if err != nil {
		res.log.Errorf("Failed to get location list: %v", err)
		return nil, err
	}
	res.log.Infof("Retrieved location list: %d location found", len(listData))
	return listData, nil
}
