package users_handler

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"gorm.io/gorm"
	"thelastking-blogger.com/src/config/logger"
	"thelastking-blogger.com/src/controller/common"
	"thelastking-blogger.com/src/controller/handler/socket_handler"
	"thelastking-blogger.com/src/module"
	"thelastking-blogger.com/src/module/req_users"
	"thelastking-blogger.com/src/repository/refresh_token_repo"
	"thelastking-blogger.com/src/repository/users_repo"
	"thelastking-blogger.com/src/security"
	"thelastking-blogger.com/src/service/refresh_token_service"
	"thelastking-blogger.com/src/service/users_service"
	"thelastking-blogger.com/src/utils"
	"thelastking-blogger.com/src/validators"
)

// HandlerCreateUser
func HandlerCreateUser(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		var dataUser module.Users
		if err := c.ShouldBindJSON(&dataUser); err != nil {
			log.Println("Lỗi bind:", err)
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Không thể tạo người dùng",
			})
			return
		}
		validate := validator.New()
		validators.RegisterCustomValidations(validate)
		if err := validate.Struct(dataUser); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Không thể xác thực",
			})
			return
		}

		idUser, err := utils.GenerateUUID()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Không thể tạo UUID",
			})
			return
		}
		times := time.Now().UTC()
		newpwd := security.HashAndSalt([]byte(dataUser.Password_user))
		var rolePtr *string
		if dataUser.Role != nil && *dataUser.Role != "" {
			roleValue := utils.ParseRole(*dataUser.Role)
			rolePtr = &roleValue
		} else {
			defaultRole := "USER"
			rolePtr = &defaultRole
		}
		newUsers := &module.Users{
			UserID:        idUser,
			FullName:      dataUser.FullName,
			Account:       dataUser.Account,
			Password_user: newpwd,
			Tag:           dataUser.Tag,
			Role:          rolePtr,
			CreatedAt:     &times,
			UpdatedAt:     &times,
		}
		buss := users_service.NewUserController(users_repo.NewSql(db))
		if err := buss.NewCreateUsers(c.Request.Context(), newUsers); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"comment": "Lỗi cơ sở dữ liệu người dùng",
			})
			return
		}
		accessToken, refreshToken, err := utils.GenerateTokens(newUsers)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   err.Error(),
				"comment": "Không thể tạo token",
			})
			return
		}
		claims, err := utils.ParseToken(refreshToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   err.Error(),
				"comment": "Không thể phân tích refresh token",
			})
			return
		}
		expiresAt := time.Unix(claims.ExpiresAt, 0)
		newRefreshToken := &module.RefreshToken{
			Token:     refreshToken,
			UserID:    newUsers.UserID,
			ExpiresAt: expiresAt,
			Revoked:   false,
			CreatedAt: times,
		}
		busToken := refresh_token_service.NewRefreshTokenController(refresh_token_repo.NewSql(db))
		if err := busToken.NewCreateRefreshToken(c.Request.Context(), newRefreshToken); err != nil {
			log.Printf("Lỗi khi lưu refresh token: Token=%s, UserID=%s, Lỗi=%v", refreshToken, newUsers.UserID, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"comment": "Không thể lưu refresh token",
			})
			return
		}
		utils.SetRefreshTokenCookie(c, refreshToken, 60*60*24*7)
		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "users:created",
			Data: gin.H{
				"user_id":    newUsers.UserID,
				"full_name":  newUsers.FullName,
				"account":    newUsers.Account,
				"tag":        newUsers.Tag,
				"role_user":  newUsers.Role,
				"created_at": newUsers.CreatedAt,
			},
		})
		c.JSON(http.StatusOK, common.UsersResponse(newUsers, accessToken, ""))
	}
}

// HandlerSignIn
func HandlerSignIn(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var userSignIn req_users.RequestSignIn
		if err := c.ShouldBindJSON(&userSignIn); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"errors":  err.Error(),
				"comment": "Yêu cầu đăng nhập thất bại",
			})
			return
		}

		validate := validator.New()
		validators.RegisterCustomValidations(validate)
		if err := validate.Struct(userSignIn); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Không thể xác thực",
			})
			return
		}

		buss := users_service.NewUserController(users_repo.NewSql(db))
		dataUser, err := buss.NewSignIn(c.Request.Context(), &userSignIn)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"comment": "Không tìm thấy tài khoản",
			})
			return
		}

		if !security.ComparePasswords(dataUser.Password_user, []byte(userSignIn.Password)) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"comment": "Email hoặc mật khẩu không đúng",
			})
			return
		}

		var accessToken, refreshToken string
		refreshTokenCookie, err := c.Cookie("refresh_token")
		validOldToken := false

		if err == nil && refreshTokenCookie != "" {
			claims, validateErr := security.ValidateCookieToken(c.Request.Context(), c, db)
			if validateErr == nil && claims.UserID == dataUser.UserID {
				newAccessToken, updateErr := security.UpdateToken(c.Request.Context(), db, refreshTokenCookie)
				if updateErr == nil {
					accessToken = newAccessToken
					refreshToken = refreshTokenCookie
					validOldToken = true
					log.Printf("Sử dụng refresh token cũ: Token=%s, UserID=%s", refreshToken, dataUser.UserID)
				} else {
					log.Printf("Không thể cập nhật token: %v", updateErr)
					utils.ClearRefreshTokenCookie(c)
				}
			} else {
				log.Printf("Xác thực refresh token cũ thất bại: %v", validateErr)
				utils.ClearRefreshTokenCookie(c)
			}
		}

		if !validOldToken {
			accessToken, refreshToken, err = utils.GenerateTokens(dataUser)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":   err.Error(),
					"comment": "Không thể tạo token mới",
				})
				return
			}

			claims, err := utils.ParseToken(refreshToken)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":   err.Error(),
					"comment": "Không thể phân tích claims của refresh token",
				})
				return
			}

			expiresAt := time.Unix(claims.ExpiresAt, 0)
			newRefreshToken := &module.RefreshToken{
				Token:     refreshToken,
				UserID:    dataUser.UserID,
				ExpiresAt: expiresAt,
				Revoked:   false,
				CreatedAt: time.Now().UTC(),
			}
			refreshService := refresh_token_service.NewRefreshTokenController(refresh_token_repo.NewSql(db))
			if err := refreshService.NewRevokeRefreshTokenByUserID(c.Request.Context(), dataUser.UserID); err != nil {
				log.Printf("Lỗi khi thu hồi token cũ cho UserID=%s: %v", dataUser.UserID, err)
			}
			log.Printf("Đã lưu refresh token: Token=%s, UserID=%s", refreshToken, dataUser.UserID)
			if err := refreshService.NewCreateRefreshToken(c.Request.Context(), newRefreshToken); err != nil {
				log.Printf("Lỗi khi lưu refresh token: Token=%s, UserID=%s, Lỗi=%v", refreshToken, dataUser.UserID, err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error":   err.Error(),
					"comment": "Không thể lưu refresh token mới",
				})
				return
			}
		}

		utils.SetRefreshTokenCookie(c, refreshToken, 60*60*24*7)
		c.JSON(http.StatusOK, gin.H{
			"access_token": accessToken,
			"expires_in":   60 * 60, // Thời gian hết hạn token (giây)
			"comment":      "Đăng nhập thành công",
		})
	}
}

// HandlerSignOut
func HandlerSignOut(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		refreshToken, err := c.Cookie("refresh_token")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Thiếu refresh token",
				"comment": "Đăng xuất thất bại",
			})
			return
		}

		tokenService := refresh_token_service.NewRefreshTokenController(refresh_token_repo.NewSql(db))
		if err := tokenService.NewDeleteRefreshTokenByTokenID(c.Request.Context(), refreshToken); err != nil {
			log.Printf("Không thể xóa refresh token: Token=%s, Lỗi=%v", refreshToken, err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"comment": "Không thể xóa refresh token",
			})
			return
		}

		utils.ClearRefreshTokenCookie(c)
		c.JSON(http.StatusOK, gin.H{
			"message": "Đăng xuất thành công",
		})
	}
}

// HandlerProfIle
func HandlerProfIle(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userId")
		if !exists || userID == nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"comment": "Missing user ID in token",
			})
			return
		}
		claims, ok := userID.(string)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid user ID in token",
				"comment": "Failed to convert to string",
			})
			return
		}
		buss := users_service.NewUserController(users_repo.NewSql(db))
		dataUser, err := buss.NewProfileUsers(c.Request.Context(), claims)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "error dataUser",
			})
			return
		}
		c.JSON(http.StatusOK, common.ItemsResponse(dataUser))
	}
}

// HandlerUpdUser
func HandlerUpdUser(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		var updUser req_users.UpdateUsers
		if err := c.ShouldBindJSON(&updUser); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"errors":  err.Error(),
				"comment": "request update failed",
			})
			return
		}
		userID, exists := c.Get("userId")
		if !exists || userID == nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"comment": "Missing user ID in token",
			})
			return
		}
		claims, ok := userID.(string)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid user ID in token",
				"comment": "Failed to convert to string",
			})
			return
		}
		times := time.Now().UTC()
		updUser.UpdatedAt = &times

		buss := users_service.NewUserController(users_repo.NewSql(db))
		if err := buss.NewUpdatedUsers(c.Request.Context(), &updUser, claims); err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "update dataUser failed",
			})
			return
		}
		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "users:updated",
			Data: gin.H{
				"full_name": updUser.FullName,
				"tag":       updUser.Tag,
			},
		})
		c.JSON(http.StatusOK, common.ItemsResponse("Update suscess!"))
	}
}

// HandlerDeletedUser
func HandlerDeletedUser(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userId")
		if !exists || userID == nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"comment": "Missing user ID in token",
			})
			return
		}
		claims, ok := userID.(string)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid user ID in token",
				"comment": "Failed to convert to string",
			})
			return
		}
		targetUserID := c.Param("id")
		if targetUserID == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid user ID",
				"comment": "User ID is required in the URL path",
			})
			return
		}
		if claims == targetUserID {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Forbidden",
				"comment": "Bạn không thể xóa tài khoản của chính mình",
			})
			return
		}

		buss := users_service.NewUserController(users_repo.NewSql(db))

		dataUser, err := buss.NewProfileUsers(c.Request.Context(), claims)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"comment": "Không thể lấy thông tin người dùng hiện tại",
			})
			return
		}

		dataUserDel, err := buss.NewProfileUsers(c.Request.Context(), targetUserID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "Không tìm thấy tài khoản mục tiêu",
			})
			return
		}
		if *dataUser.Role == "ROOT" {
			// ROOT có thể xóa tất cả (đã kiểm tra tự xóa ở trên)
		} else if *dataUser.Role == "ADMIN" {
			if *dataUserDel.Role != "USER" {
				c.JSON(http.StatusForbidden, gin.H{
					"error":   "Forbidden",
					"comment": "Admin chỉ có thể xóa tài khoản có vai trò USER",
				})
				return
			}
		} else {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Forbidden",
				"comment": "Bạn không có quyền xóa tài khoản",
			})
			return
		}
		if err := buss.NewDeleteUsers(c.Request.Context(), targetUserID); err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "delete dataUser failed",
			})
			return
		}
		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "users:deleted",
			Data: gin.H{
				"user_id": userID,
			},
		})
		c.JSON(http.StatusOK, common.ItemsResponse("Delete suscess!"))
	}
}

// HandlerListUsers
func HandlerListUsers(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var paging common.Paggings
		if err := c.ShouldBind(&paging); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "pagging faild",
			})
			return
		}
		paging.Process()
		userCtrl := users_service.NewUserController(users_repo.NewSql(db))
		dataListUsers, err := userCtrl.NewListUser(c.Request.Context(), &paging)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "getList users database faild",
				"details": err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, common.ItemsResponse(dataListUsers))
	}
}
func HandlerChanrgePwd(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var chargePwd req_users.RequestUpdatePassword
		if err := c.ShouldBindJSON(&chargePwd); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Missing or invalid request body",
				"message": err.Error(),
			})
			return
		}

		if chargePwd.NewPassword != chargePwd.ConfirmPassword {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Password confirmation does not match",
				"message": "New password and confirmation must be the same",
			})
			return
		}

		userID, exists := c.Get("userId")
		if !exists || userID == nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"comment": "Missing user ID in token",
			})
			return
		}

		claims, ok := userID.(string)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid user ID in token",
				"comment": "Failed to convert to string",
			})
			return
		}
		userService := users_service.NewUserController(users_repo.NewSql(db))
		if err := userService.NewChanrgePwd(c.Request.Context(), claims, &chargePwd); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to change password",
				"message": err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Password changed successfully",
		})
	}
}

func HandlerForgotPwd(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {

		var forgotPwd req_users.ForgorPwd
		if err := c.ShouldBindJSON(&forgotPwd); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Missing or invalid request body",
				"message": err.Error(),
			})
			return
		}

		if forgotPwd.NewPassword != forgotPwd.ConfirmPassword {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Password confirmation does not match",
				"message": "New password and confirmation must be the same",
			})
			return
		}
		hashedPassword := security.HashAndSalt([]byte(forgotPwd.NewPassword))
		NewForgotPwd := &req_users.ForgorPwd{
			Account:     forgotPwd.Account,
			NewPassword: hashedPassword,
		}
		buss := users_service.NewUserController(users_repo.NewSql(db))
		if err := buss.NewForgotPwd(c.Request.Context(), NewForgotPwd); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Password confirmation does not match",
				"message": "New password and confirmation must be the same",
			})
			return
		}
		c.JSON(http.StatusOK, common.ItemsResponse("Password new successfully"))
	}
}

// HandlerRefreshToken xử lý yêu cầu làm mới access token bằng refresh token từ cookie
func HandlerRefreshToken(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		log := logger.GetLogger()

		// 1. Lấy refresh token từ cookie
		refreshTokenString, err := c.Cookie("refresh_token")
		if err != nil {
			log.Errorf("Không tìm thấy cookie refresh_token: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Thiếu cookie refresh token",
				"comment": "Yêu cầu xác thực",
			})
			return
		}

		// 2. Xác thực refresh token (kiểm tra database)
		claims, err := security.ValidateToken(ctx, db, refreshTokenString)
		if err != nil {
			log.Errorf("Refresh token không hợp lệ hoặc đã hết hạn: %v", err)
			utils.ClearRefreshTokenCookie(c) // Xóa cookie nếu token không hợp lệ
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Refresh token không hợp lệ",
				"comment": "Vui lòng đăng nhập lại",
			})
			return
		}

		// 3. Tạo access token mới
		newAccessToken, err := security.UpdateToken(ctx, db, refreshTokenString)
		if err != nil {
			log.Errorf("Lỗi khi tạo access token mới: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Không thể tạo token mới",
				"comment": "Làm mới phiên thất bại",
			})
			return
		}

		log.Infof("Làm mới access token thành công cho user: %s", claims.UserID)

		// 4. Trả về access token mới cho frontend
		c.JSON(http.StatusOK, gin.H{
			"access_token": newAccessToken,
			"expires_in":   60 * 60, // Thời gian hết hạn token (giây)
			"comment":      "Access token đã được làm mới",
		})
	}
}

//hàm khởi tạo 1 user mới hoặc update tài khoản mới từ tài khoản root

// HandlerCreateUser creates a new user with role-based access control
func HandlerCreateUserByRole(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userId")
		if !exists || userID == nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"comment": "Missing user ID in token",
			})
			return
		}
		claims, ok := userID.(string)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid user ID in token",
				"comment": "Failed to convert to string",
			})
			return
		}

		var input module.Users
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Invalid input data",
			})
			return
		}

		validate := validator.New()
		validators.RegisterCustomValidations(validate)
		if err := validate.Struct(input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Không thể xác thực",
			})
			return
		}

		idUser, err := utils.GenerateUUID()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Không thể tạo UUID",
			})
			return
		}
		times := time.Now().UTC()
		newpwd := security.HashAndSalt([]byte(input.Password_user))
		var rolePtr *string
		if input.Role != nil && *input.Role != "" {
			roleValue := utils.ParseRole(*input.Role)
			rolePtr = &roleValue
		} else {
			defaultRole := "USER"
			rolePtr = &defaultRole
		}
		newUsers := &module.Users{
			UserID:        idUser,
			FullName:      input.FullName,
			Account:       input.Account,
			Password_user: newpwd,
			Tag:           input.Tag,
			Role:          rolePtr,
			CreatedAt:     &times,
			UpdatedAt:     &times,
		}
		buss := users_service.NewUserController(users_repo.NewSql(db))

		dataUser, err := buss.NewProfileUsers(c.Request.Context(), claims)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"comment": "Không thể lấy thông tin người dùng hiện tại",
			})
			return
		}

		// Role-based access control
		if *dataUser.Role != "ROOT" && *dataUser.Role != "ADMIN" {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Forbidden",
				"comment": "Bạn không có quyền tạo tài khoản",
			})
			return
		}
		if *dataUser.Role == "ADMIN" && *input.Role != "USER" {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Forbidden",
				"comment": "Admin chỉ có thể tạo tài khoản có vai trò USER",
			})
			return
		}

		if err := buss.NewCreateUsers(c.Request.Context(), newUsers); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"comment": "Tạo tài khoản thất bại",
			})
			return
		}

		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "users:createdbyrole",
			Data: gin.H{
				"full_name":  input.FullName,
				"account":    input.Account,
				"tag":        input.Tag,
				"role_user":  input.Role,
				"created_at": input.CreatedAt,
			},
		})

		c.JSON(http.StatusOK, common.ItemsResponse(gin.H{
			"message": "Create success!",
		}))
	}
}

func HandlerUpdateUser(db *gorm.DB, socketServer *socket_handler.SocketServer) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userId")
		if !exists || userID == nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"comment": "Missing user ID in token",
			})
			return
		}
		claims, ok := userID.(string)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid user ID in token",
				"comment": "Failed to convert to string",
			})
			return
		}
		targetUserID := c.Param("id")
		if targetUserID == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid user ID",
				"comment": "User ID is required in the URL path",
			})
			return
		}

		var input req_users.UpdateUsersByID
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   err.Error(),
				"comment": "Invalid input data",
			})
			return
		}

		buss := users_service.NewUserController(users_repo.NewSql(db))

		dataUser, err := buss.NewProfileUsers(c.Request.Context(), claims)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"comment": "Không thể lấy thông tin người dùng hiện tại",
			})
			return
		}

		dataUserUpdate, err := buss.NewProfileUsers(c.Request.Context(), targetUserID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   err.Error(),
				"comment": "Không tìm thấy tài khoản mục tiêu",
			})
			return
		}

		// Role-based access control
		if *dataUser.Role == "ROOT" {
			// ROOT can update all users
		} else if *dataUser.Role == "ADMIN" {
			if *dataUserUpdate.Role != "USER" {
				c.JSON(http.StatusForbidden, gin.H{
					"error":   "Forbidden",
					"comment": "Admin chỉ có thể cập nhật tài khoản có vai trò USER",
				})
				return
			}
		} else {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "Forbidden",
				"comment": "Bạn không có quyền cập nhật tài khoản",
			})
			return
		}

		if err := buss.NewUpdatedUsersByID(c.Request.Context(), &input, targetUserID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   err.Error(),
				"comment": "Cập nhật tài khoản thất bại",
			})
			return
		}

		socketServer.BroadcastMessage(socket_handler.Message{
			Event: "users:updatedbyrole",
			Data: gin.H{
				"user_id": targetUserID,
			},
		})

		c.JSON(http.StatusOK, common.ItemsResponse(gin.H{
			"message": "Update success!",
		}))
	}
}
