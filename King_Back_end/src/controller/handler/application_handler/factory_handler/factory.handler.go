package factory_handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
	"thelastking-blogger.com/src/controller/common"
	"thelastking-blogger.com/src/controller/handler/socket_handler"
	"thelastking-blogger.com/src/module"
	"thelastking-blogger.com/src/module/req_users"
	"thelastking-blogger.com/src/repository/factory_repo"
	"thelastking-blogger.com/src/service/factory_service"
)

// CREATE FACTORY
func HandlerCreateFactories(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		var dataFactory req_users.FactoriesInput
		if err := c.ShouldBind(&dataFactory); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Failed to create factories",
			})
			return
		}

		validate := validator.New()
		if err := validate.Struct(dataFactory); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Can't validator",
			})
			return
		}

		buss := factory_service.NewFactoryController(factory_repo.NewSql(db))
		if err := buss.NewCreateFactory(c.Request.Context(), &dataFactory); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"comment": "Invalid database location",
			})
			return
		}

		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "factory:created",
			Data: gin.H{
				"name_factory": dataFactory.NameFactory,
				"name_local":   dataFactory.NameLocal,
			}})
		c.JSON(http.StatusOK, common.ItemsResponse("Create success !"))
	}
}

// GET FACTORY
func HandlerGetFactories(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idFactory := c.Param("factory_id")
		if idFactory == "" {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": "id Factory not valid",
			})
			return
		}
		buss := factory_service.NewFactoryController(factory_repo.NewSql(db))
		dataFactory, err := buss.NewGetFactory(c.Request.Context(), idFactory)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "error data factories",
			})
			return
		}
		c.JSON(http.StatusOK, common.ItemsResponse(dataFactory))
	}
}

// UPDATE
func HandlerUpdFactories(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		idFactory := c.Param("factory_id")
		if idFactory == "" {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": "id Factory not valid",
			})
			return
		}
		var updFactory module.Factories
		if err := c.ShouldBind(&updFactory); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"errors":  err.Error(),
				"comment": "request update failed",
			})
			return
		}
		times := time.Now().UTC()
		updFactory.UpdatedAt = &times
		buss := factory_service.NewFactoryController(factory_repo.NewSql(db))
		if err := buss.NewUpdateFactory(c.Request.Context(), idFactory, &updFactory); err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "error data update",
			})
			return
		}
		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "factory:updated",
			Data: gin.H{
				"name_factory": updFactory.NameFactory,
				"updated_at":   updFactory.UpdatedAt,
			},
		})
		c.JSON(http.StatusOK, common.ItemsResponse("Update suscess!"))
	}
}

// DELETE
func HandlerDeletedFactory(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		idFactory := c.Param("factory_id")
		if idFactory == "" {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": "id Factory not valid",
			})
			return
		}
		buss := factory_service.NewFactoryController(factory_repo.NewSql(db))
		if err := buss.NewDeleteFactory(c.Request.Context(), idFactory); err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "error data factory",
			})
			return
		}
		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "factory:deleted",
			Data: gin.H{
				"factory_id": idFactory,
			},
		})
		c.JSON(http.StatusOK, common.ItemsResponse("Delete suscess!"))
	}
}

// LIST
func HandlerListFactory(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var paging common.Paggings
		if err := c.ShouldBind(&paging); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "pagging faild",
			})
			return
		}
		paging.Process()
		factoryCtrl := factory_service.NewFactoryController(factory_repo.NewSql(db))
		dataListFactory, err := factoryCtrl.NewGetFactoryList(c.Request.Context(), &paging)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "getList factory database faild",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, common.ItemsResponse(dataListFactory))
	}
}

// list by local
func HandlerListFactoryByLocation(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		locationName := c.Query("name_local")
		if locationName == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing location name"})
			return
		}
		facotoryCtrl := factory_service.NewFactoryController(factory_repo.NewSql(db))
		dataListFactory, err := facotoryCtrl.NewGetFactoryListByLocal(c.Request.Context(), locationName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "getList factory database faild",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, common.ItemsResponse(dataListFactory))
	}
}
