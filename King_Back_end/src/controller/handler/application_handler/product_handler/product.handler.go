package product_handler

import (
	"net/http"
	"time"

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
		// Nhận các trường text
		title := c.PostForm("title")
		status := c.PostForm("status")
		yearStr := c.PostForm("year_product")
		describe := c.PostForm("describe_product")
		nameFactory := c.PostForm("name_factory")

		// Nhận file ảnh
		var imageUrl *string
		fileImage, err := c.FormFile("image")
		if err == nil && fileImage != nil {
			savePath := "uploads/" + fileImage.Filename
			if err := c.SaveUploadedFile(fileImage, savePath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu file ảnh"})
				return
			}
			imageUrl = &savePath
		}

		// Nhận file video (nếu có)
		var videoUrl *string
		fileVideo, err := c.FormFile("video")
		if err == nil && fileVideo != nil {
			savePath := "uploads/" + fileVideo.Filename
			if err := c.SaveUploadedFile(fileVideo, savePath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu file video"})
				return
			}
			videoUrl = &savePath
		}

		// Parse year_product
		var year *time.Time
		if yearStr != "" {
			t, err := time.Parse(time.RFC3339, yearStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Sai định dạng ngày"})
				return
			}
			year = &t
		}

		// Tạo struct ProductInput
		inputProduct := req_users.ProductInput{
			Title:       &title,
			Image:       imageUrl,
			Video:       videoUrl,
			Status:      &status,
			Year:        year,
			Describe:    describe,
			NameFactory: &nameFactory,
		}

		// Validate và lưu vào DB như cũ
		validate := validator.New()
		if err := validate.Struct(inputProduct); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Can't validator",
			})
			return
		}

		productCtrl := product_service.NewProductController(product_repo.NewSql(db))
		if err := productCtrl.NewCreateProduct(c.Request.Context(), &inputProduct); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"comment": "Invalid database product",
			})
			return
		}

		// GỬI WEBSOCKET realtime như cũ
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
			},
		})

		c.JSON(http.StatusOK, gin.H{"message": "Tạo sản phẩm thành công!"})
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

		// Lấy các trường text
		title := c.PostForm("title")
		status := c.PostForm("status")
		yearStr := c.PostForm("year_product")
		describe := c.PostForm("describe_product")
		nameFactory := c.PostForm("name_factory")

		// Lấy file ảnh (nếu có)
		var imageUrl *string
		fileImage, err := c.FormFile("image")
		if err == nil && fileImage != nil {
			savePath := "uploads/" + fileImage.Filename
			if err := c.SaveUploadedFile(fileImage, savePath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu file ảnh"})
				return
			}
			imageUrl = &savePath
		}

		// Lấy file video (nếu có)
		var videoUrl *string
		fileVideo, err := c.FormFile("video")
		if err == nil && fileVideo != nil {
			savePath := "uploads/" + fileVideo.Filename
			if err := c.SaveUploadedFile(fileVideo, savePath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Không thể lưu file video"})
				return
			}
			videoUrl = &savePath
		}

		// Parse year_product
		var year *time.Time
		if yearStr != "" {
			t, err := time.Parse(time.RFC3339, yearStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Sai định dạng ngày"})
				return
			}
			year = &t
		}

		// Tạo struct ProductInput (chỉ truyền trường nào có dữ liệu)
		updProduct := req_users.ProductInput{
			Title:       &title,
			Status:      &status,
			Year:        year,
			Describe:    describe,
			NameFactory: &nameFactory,
			UpdatedAt:   func() *time.Time { t := time.Now().UTC(); return &t }(),
		}
		if imageUrl != nil {
			updProduct.Image = imageUrl
		}
		if videoUrl != nil {
			updProduct.Video = videoUrl
		}

		// Validate nếu cần
		validate := validator.New()
		if err := validate.Struct(updProduct); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Can't validator",
			})
			return
		}

		productCtrl := product_service.NewProductController(product_repo.NewSql(db))
		if err := productCtrl.NewUpdateProduct(c.Request.Context(), idProduct, &updProduct); err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "Can't database update",
			})
			return
		}

		// Gửi WebSocket như cũ
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
