package locations_handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
	"thelastking-blogger.com/src/controller/common"
	"thelastking-blogger.com/src/controller/handler/socket_handler"
	"thelastking-blogger.com/src/module"
	"thelastking-blogger.com/src/repository/location_repo"
	"thelastking-blogger.com/src/service/location_service"
	"thelastking-blogger.com/src/utils"
)

// CREATE
func HandlerCreateLocation(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		var dataLocation module.Locations
		if err := c.ShouldBind(&dataLocation); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Failed to create location",
			})
			return
		}
		validate := validator.New()
		if err := validate.Struct(dataLocation); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Can't validator",
			})
			return
		}

		idLoca, err := utils.GenerateUUID()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "uuid fails",
			})
			return
		}
		times := time.Now().UTC()
		newLocation := &module.Locations{
			Location_ID: idLoca,
			NameLocal:   dataLocation.NameLocal,
			CreatedAt:   &times,
			UpdatedAt:   &times,
		}
		buss := location_service.NewLocationController(location_repo.NewSql(db))
		if err := buss.NewCreateLocation(c.Request.Context(), newLocation); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"comment": "Invalid database location",
			})
			return
		}
		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "location:created",
			Data: gin.H{
				"location_id": newLocation.Location_ID,
				"name_local":  newLocation.NameLocal,
				"created_at":  newLocation.CreatedAt,
			}})
		c.JSON(http.StatusOK, common.ItemsResponse(newLocation))
	}
}

// PROFILE
func HandlerGetLocation(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		idLocation := c.Param("location_id")
		if idLocation == "" {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": "id location not valid",
			})
			return
		}
		buss := location_service.NewLocationController(location_repo.NewSql(db))
		dataLocation, err := buss.NewGetLocation(c.Request.Context(), idLocation)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "error data location",
			})
			return
		}
		c.JSON(http.StatusOK, common.ItemsResponse(dataLocation))
	}
}

// UPDATE
func HandlerUpdLocation(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		idLocation := c.Param("location_id")
		if idLocation == "" {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": "id location not valid",
			})
			return
		}
		var updLoca module.Locations
		if err := c.ShouldBind(&updLoca); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"errors":  err.Error(),
				"comment": "request update failed",
			})
			return
		}
		times := time.Now().UTC()
		updLoca.UpdatedAt = &times
		buss := location_service.NewLocationController(location_repo.NewSql(db))
		if err := buss.NewUpdateLocation(c.Request.Context(), idLocation, &updLoca); err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "error data location",
			})
			return
		}
		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "location:updated",
			Data: gin.H{
				"name":       updLoca.NameLocal, // Adjust fields based on module.Locations
				"updated_at": updLoca.UpdatedAt,
			},
		})
		c.JSON(http.StatusOK, common.ItemsResponse("Update suscess!"))
	}
}

// DELETE
func HandlerDeletedLocation(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		idLocation := c.Param("location_id")
		if idLocation == "" {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": "id location not valid",
			})
			return
		}
		buss := location_service.NewLocationController(location_repo.NewSql(db))
		if err := buss.NewDeleteLocation(c.Request.Context(), idLocation); err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "error data location",
			})
			return
		}
		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "location:deleted",
			Data: gin.H{
				"location_id": idLocation,
			},
		})
		c.JSON(http.StatusOK, common.ItemsResponse("Delete suscess!"))
	}
}

func HandlerListLocation(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var paging common.Paggings
		if err := c.ShouldBind(&paging); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "pagging faild",
			})
			return
		}
		paging.Process()
		locationCtrl := location_service.NewLocationController(location_repo.NewSql(db))
		dataListLocations, err := locationCtrl.NewListLocation(c.Request.Context(), &paging)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "getList location database faild",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, common.ItemsResponse(dataListLocations))
	}
}
