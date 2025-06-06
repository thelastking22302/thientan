package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"thelastking-blogger.com/src/config/db_config"
	"thelastking-blogger.com/src/controller/handler/application_handler/factory_handler"
	"thelastking-blogger.com/src/controller/handler/application_handler/locations_handler"
	"thelastking-blogger.com/src/controller/handler/application_handler/product_handler"
	"thelastking-blogger.com/src/controller/handler/socket_handler"
	"thelastking-blogger.com/src/controller/handler/users_handler"
	"thelastking-blogger.com/src/middleware/CORS_Middleware"
	auth "thelastking-blogger.com/src/middleware/auth_Middleware"
	jwtmiddleware "thelastking-blogger.com/src/middleware/jwtMiddleware"
)

func ThienTanRouters(incomingRoutes *gin.Engine, socketServer *socket_handler.SocketServer) {
	db := db_config.GetInstance().Run()

	// Áp dụng CORS middleware toàn cục
	incomingRoutes.Use(CORS_Middleware.CORSMiddleWare())

	// Tạo ServeMux cho WebSocket
	mux := http.NewServeMux()
	socketServer.RegisterHandlers(mux)

	// Chuyển các yêu cầu WebSocket tới ServeMux
	incomingRoutes.Any("/ws/*any", func(c *gin.Context) {
		mux.ServeHTTP(c.Writer, c.Request)
	})

	router := incomingRoutes.Group("/thientancay")
	setupLocationRoutes(router.Group("/location"), db, socketServer)
	setupFactoriesRoutes(router.Group("/factory"), db, socketServer)
	setupProductRoutes(router.Group("/product"), db, socketServer)
	setupUserRoutes(router.Group("/users"), db, socketServer)

	incomingRoutes.Static("/uploads", "./uploads")
}

func setupUserRoutes(user *gin.RouterGroup, db *gorm.DB, socketServer *socket_handler.SocketServer) {
	user.POST("/id", users_handler.HandlerCreateUser(db, socketServer))
	user.POST("/sign-in", users_handler.HandlerSignIn(db))
	user.POST("/sign-out", users_handler.HandlerSignOut(db))
	user.PATCH("/forgot", users_handler.HandlerForgotPwd(db))
	user.POST("/refresh-token", users_handler.HandlerRefreshToken(db))
	user.GET("/list", users_handler.HandlerListUsers(db))
	user.Use(jwtmiddleware.JwtMiddleware(db))
	registerUserHandlers(user, db, socketServer)
}

func registerUserHandlers(rg *gin.RouterGroup, db *gorm.DB, socketServer *socket_handler.SocketServer) {
	rg.POST("/createUser", auth.RequireRole("ADMIN", "ROOT"), users_handler.HandlerCreateUserByRole(db, socketServer))
	rg.GET("/profile", auth.RequireRole("ADMIN", "USER", "ROOT"), users_handler.HandlerProfIle(db))
	rg.PATCH("/upd", auth.RequireRole("ADMIN", "USER", "ROOT"), users_handler.HandlerUpdUser(db, socketServer))
	rg.PATCH("/updUser/:id", auth.RequireRole("ADMIN", "ROOT"), users_handler.HandlerUpdateUser(db, socketServer))
	rg.PATCH("/updPwd", auth.RequireRole("USER", "ADMIN", "ROOT"), users_handler.HandlerChanrgePwd(db))
	rg.DELETE("/del/:id", auth.RequireRole("ADMIN", "ROOT"), users_handler.HandlerDeletedUser(db, socketServer))

}

// PRODUCT
func setupProductRoutes(product *gin.RouterGroup, db *gorm.DB, socketServer *socket_handler.SocketServer) {
	product.GET("/list", product_handler.HandlerListProduct(db))
	product.GET("/list/by-local", product_handler.HandlerListProductByLocation(db))
	product.GET("/list/by-factory", product_handler.HandlerListProductByFactory(db))
	product.Use(jwtmiddleware.JwtMiddleware(db))
	product.GET("/:product_id", product_handler.HandlerGetProduct(db))
	product.POST("/", product_handler.HandlerCreateProduct(db, socketServer))
	product.PATCH("/upd/:product_id", product_handler.HandlerUpdProduct(db, socketServer))
	product.DELETE("/del/:product_id", product_handler.HandlerDeletedProduct(db, socketServer))
}

// LOCATIONS
func setupLocationRoutes(local *gin.RouterGroup, db *gorm.DB, socketServer *socket_handler.SocketServer) {
	local.GET("/list", locations_handler.HandlerListLocation(db))
	local.Use(jwtmiddleware.JwtMiddleware(db))
	local.GET("/:location_id", locations_handler.HandlerGetLocation(db))
	local.POST("/", locations_handler.HandlerCreateLocation(db, socketServer))
	local.PATCH("/upd/:location_id", locations_handler.HandlerUpdLocation(db, socketServer))
	local.DELETE("/del/:location_id", locations_handler.HandlerDeletedLocation(db, socketServer))
}

// FACTORIES
func setupFactoriesRoutes(factory *gin.RouterGroup, db *gorm.DB, socketServer *socket_handler.SocketServer) {
	factory.GET("/list", factory_handler.HandlerListFactory(db))
	factory.GET("/list/by-local", factory_handler.HandlerListFactoryByLocation(db))
	factory.Use(jwtmiddleware.JwtMiddleware(db))
	factory.GET("/:factory_id", factory_handler.HandlerGetFactories(db))
	factory.POST("/", factory_handler.HandlerCreateFactories(db, socketServer))
	factory.PATCH("/upd/:factory_id", factory_handler.HandlerUpdFactories(db, socketServer))
	factory.DELETE("/del/:factory_id", factory_handler.HandlerDeletedFactory(db, socketServer))
}
