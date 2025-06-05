package product_service

import (
	"context"

	"thelastking-blogger.com/src/config/logger"
	"thelastking-blogger.com/src/controller/common"
	"thelastking-blogger.com/src/module"
	"thelastking-blogger.com/src/module/req_users"
)

type ProductResponse interface {
	CreateProduct(ctx context.Context, data *req_users.ProductInput) error //sai
	GetProduct(ctx context.Context, idProduct map[string]any) (*module.Products, error)
	UpdateProduct(ctx context.Context, idProduct map[string]any, upd *req_users.ProductInput) error
	DeleteProduct(ctx context.Context, idProduct map[string]any) error
	GetProductsList(ctx context.Context, pagging *common.Paggings, morekeys ...string) ([]module.Products, error)
	GetProductsByFactories(ctx context.Context, factoryName map[string]any) ([]module.Products, error)
	GetProductsByLocation(ctx context.Context, locationName map[string]any) ([]module.Products, error)
}

type productController struct {
	p   ProductResponse
	log logger.Logger
}

func NewProductController(p ProductResponse) *productController {
	return &productController{
		p:   p,
		log: logger.GetLogger(),
	}
}

func (res *productController) NewCreateProduct(ctx context.Context, data *req_users.ProductInput) error {
	if err := res.p.CreateProduct(ctx, data); err != nil {
		res.log.Errorf("Failed to create product: %v", err)
		return err
	}
	res.log.Infof("Product created successfully: %+v", data)
	return nil
}
func (res *productController) NewGetProduct(ctx context.Context, idProduct string) (*module.Products, error) {
	data, err := res.p.GetProduct(ctx, map[string]any{"product_id": idProduct})
	if err != nil {
		res.log.Errorf("Failed to get product with ID %s: %v", idProduct, err)
		return nil, err
	}
	res.log.Infof("Retrieved product: %+v", data)
	return data, nil
}

func (res *productController) NewUpdateProduct(ctx context.Context, idProduct string, upd *req_users.ProductInput) error {
	if err := res.p.UpdateProduct(ctx, map[string]any{"product_id": idProduct}, upd); err != nil {
		res.log.Errorf("Failed to update product with ID %s: %v", idProduct, err)
		return err
	}
	res.log.Infof("Product with ID %s updated successfully: %+v", idProduct)
	return nil
}

func (res *productController) NewDeleteProduct(ctx context.Context, idProduct string) error {
	if err := res.p.DeleteProduct(ctx, map[string]any{"product_id": idProduct}); err != nil {
		res.log.Errorf("Failed to delete product with ID %s: %v", idProduct, err)
		return err
	}
	res.log.Infof("Product with ID %s deleted successfully", idProduct)
	return nil
}

func (res *productController) NewGetProductsList(ctx context.Context, pagging *common.Paggings) ([]module.Products, error) {
	listData, err := res.p.GetProductsList(ctx, pagging)
	if err != nil {
		res.log.Errorf("Failed to get product list: %v", err)
		return nil, err
	}
	res.log.Infof("Retrieved product list: %d products found", len(listData))
	return listData, nil
}
func (res *productController) NewGetProductsByFactories(ctx context.Context, factoryName string) ([]module.Products, error) {
	dataProductList, err := res.p.GetProductsByFactories(ctx, map[string]any{"f.name_factory": factoryName})
	if err != nil {
		res.log.Errorf("Failed to get product list by factory: %v", err)
		return nil, err
	}
	if len(dataProductList) == 0 {
		res.log.Warnf("No products found for location: %s", factoryName)
	}
	res.log.Infof("Retrieved product by factory list: %d products found", len(dataProductList))
	return dataProductList, nil
}

func (res *productController) NewGetProductsByLocation(ctx context.Context, locationName string) ([]module.Products, error) {
	dataProductList, err := res.p.GetProductsByLocation(ctx, map[string]any{"l.name_local": locationName})
	if err != nil {
		res.log.Errorf("Failed to get product list by location: %v", err)
		return nil, err
	}
	if len(dataProductList) == 0 {
		res.log.Warnf("No products found for location: %s", locationName)
	}
	res.log.Infof("Retrieved product by location list: %d products found", len(dataProductList))
	return dataProductList, nil
}
