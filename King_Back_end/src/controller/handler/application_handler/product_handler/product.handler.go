package product_handler

import (
	"net/http"
	"time"

	"log"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
	"thelastking-blogger.com/src/controller/common"
	"thelastking-blogger.com/src/controller/handler/socket_handler"
	"thelastking-blogger.com/src/module/req_users"
	"thelastking-blogger.com/src/repository/product_repo"
	"thelastking-blogger.com/src/service/product_service"
)

func HandlerCreateProduct(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		var inputProduct req_users.ProductInput
		if err := c.ShouldBind(&inputProduct); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Validation failed for product input",
			})
			return
		}
		validate := validator.New()
		if err := validate.Struct(inputProduct); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Can't validator",
			})
			return
		}

		// Log the input data for debugging
		log.Printf("Received product input: %+v", inputProduct)

		productCtrl := product_service.NewProductController(product_repo.NewSql(db))
		if err := productCtrl.NewCreateProduct(c.Request.Context(), &inputProduct); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"comment": "Invalid database product",
			})
			return
		}
		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "product:created",
			Data: gin.H{
				"title":            inputProduct.Title,
				"image":            inputProduct.Image,
				"video":            inputProduct.Video,
				"status":           inputProduct.Status,
				"describe_product": inputProduct.Describe,
				"year":             inputProduct.Year,
				"name_factory":     inputProduct.NameFactory,
				"created_at":       time.Now().UTC(),
			}})
		c.JSON(http.StatusOK, common.ItemsResponse("Create suscess!"))
	}
}

// GET FACTORY
func HandlerGetProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idProduct := c.Param("product_id")
		if idProduct == "" {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": "id Factory not valid",
			})
			return
		}
		productCtrl := product_service.NewProductController(product_repo.NewSql(db))
		dataProduct, err := productCtrl.NewGetProduct(c.Request.Context(), idProduct)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "Can't valid database product",
			})
			return
		}
		c.JSON(http.StatusOK, common.ItemsResponse(dataProduct))
	}
}

// UPDATE
func HandlerUpdProduct(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		idProduct := c.Param("product_id")
		if idProduct == "" {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": "id Product not valid",
			})
			return
		}
		var updProduct req_users.ProductInput
		if err := c.ShouldBind(&updProduct); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"errors":  err.Error(),
				"comment": "request update failed",
			})
			return
		}
		times := time.Now().UTC()
		updProduct.UpdatedAt = &times
		productCtrl := product_service.NewProductController(product_repo.NewSql(db))
		if err := productCtrl.NewUpdateProduct(c.Request.Context(), idProduct, &updProduct); err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "Can't database update",
			})
			return
		}
		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "product:updated",
			Data: gin.H{
				"title":            updProduct.Title,
				"image":            updProduct.Image,
				"video":            updProduct.Video,
				"status":           updProduct.Status,
				"year_product":     updProduct.Year,
				"describe_product": updProduct.Describe,
				"name_factory":     updProduct.NameFactory,
				"updated_at":       updProduct.UpdatedAt,
			},
		})
		c.JSON(http.StatusOK, common.ItemsResponse("Update suscess!"))
	}
}

// DELETE
func HandlerDeletedProduct(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		idProduct := c.Param("product_id")
		if idProduct == "" {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": "id Product not valid",
			})
			return
		}
		productCtrl := product_service.NewProductController(product_repo.NewSql(db))
		if err := productCtrl.NewDeleteProduct(c.Request.Context(), idProduct); err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "Can't delete database product",
			})
			return
		}
		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "product:deleted",
			Data: gin.H{
				"product_id": idProduct,
			},
		})
		c.JSON(http.StatusOK, common.ItemsResponse("Delete suscess!"))
	}
}

// LIST
func HandlerListProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var paging common.Paggings
		if err := c.ShouldBind(&paging); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "pagging faild",
			})
			return
		}
		paging.Process()
		productCtrl := product_service.NewProductController(product_repo.NewSql(db))
		dataListProduct, err := productCtrl.NewGetProductsList(c.Request.Context(), &paging)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "getList product database faild",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, common.ItemsResponse(dataListProduct))
	}
}

// LIST BY FACTORY
func HandlerListProductByFactory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		factoryName := c.Query("name_factory")
		if factoryName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing factory name"})
			return
		}
		productCtrl := product_service.NewProductController(product_repo.NewSql(db))
		dataListProduct, err := productCtrl.NewGetProductsByFactories(c.Request.Context(), factoryName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "getList product database faild",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, common.ItemsResponse(dataListProduct))

	}
}

// LIST BY Locations
func HandlerListProductByLocation(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		locationName := c.Query("name_local")
		if locationName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing location name"})
			return
		}
		productCtrl := product_service.NewProductController(product_repo.NewSql(db))
		dataListProduct, err := productCtrl.NewGetProductsByLocation(c.Request.Context(), locationName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "getList product database faild",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, common.ItemsResponse(dataListProduct))

	}
}
