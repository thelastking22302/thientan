package server

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"thelastking-blogger.com/src/config/db_config"
	"thelastking-blogger.com/src/controller/handler/socket_handler" // Thêm import cho socket_handler
	"thelastking-blogger.com/src/repository/refresh_token_repo"
	"thelastking-blogger.com/src/routes"
	"thelastking-blogger.com/src/service/refresh_token_service"
)

func Server() {
	// Khởi tạo cơ sở dữ liệu
	dbConn := db_config.GetInstance().Run()

	// Khởi tạo job dọn dẹp refresh token
	refreshRepo := refresh_token_repo.NewSql(dbConn)
	refreshCtrl := refresh_token_service.NewRefreshTokenController(refreshRepo)
	refresh_token_service.RunCleanupTokensJob(refreshCtrl)

	// Khởi tạo WebSocket server
	socketServer := socket_handler.NewSocketServer(dbConn)
	go socketServer.Serve() // Chạy WebSocket server trong goroutine

	// Khởi tạo router Gin
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// Áp dụng routes với WebSocket server
	routes.ThienTanRouters(r, socketServer)

	// Tạo HTTP server với cơ chế tắt an toàn
	srv := &http.Server{
		Addr:    ":8000",
		Handler: r,
	}

	// Chạy server trong goroutine
	go func() {
		log.Printf("Khởi động server trên :8000")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Khởi động server thất bại: %v", err)
		}
	}()

	// Xử lý tắt an toàn
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Đang tắt server...")

	// Tạo ngữ cảnh tắt với thời gian chờ
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Đóng WebSocket server
	socketServer.Close()

	// Tắt HTTP server
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Tắt server thất bại: %v", err)
	}
	log.Println("Server đã tắt an toàn")
}
