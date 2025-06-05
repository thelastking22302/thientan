package socket_handler

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
	"gorm.io/gorm"
	"thelastking-blogger.com/src/security"
)

// Message đại diện cho một sự kiện WebSocket
type Message struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

// Client đại diện cho một kết nối WebSocket
type Client struct {
	conn      *websocket.Conn
	userID    string
	role      string
	send      chan Message
	namespace string
	rooms     map[string]bool
}

// SocketServer quản lý các kết nối WebSocket
type SocketServer struct {
	db         *gorm.DB
	clients    map[*Client]bool
	broadcast  chan Message
	register   chan *Client
	unregister chan *Client
	rooms      map[string]map[*Client]bool
	mu         sync.RWMutex
}

// NewSocketServer tạo một SocketServer mới
func NewSocketServer(db *gorm.DB) *SocketServer {
	return &SocketServer{
		db:         db,
		clients:    make(map[*Client]bool),
		broadcast:  make(chan Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		rooms:      make(map[string]map[*Client]bool),
	}
}

// upgrader để nâng cấp HTTP thành WebSocket
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:5173" // Cho phép từ frontend
	},
}

// Serve khởi động server
func (ss *SocketServer) Serve() {
	log.Println("Khởi động server WebSocket...")
	go ss.run()
}

// BroadcastMessage gửi tin nhắn tới tất cả client trong room
func (ss *SocketServer) BroadcastMessage(msg Message) {
	ss.broadcast <- msg
}

// run xử lý các sự kiện register, unregister, broadcast
func (ss *SocketServer) run() {
	for {
		select {
		case client := <-ss.register:
			ss.mu.Lock()
			ss.clients[client] = true
			if _, ok := ss.rooms[client.namespace]; !ok {
				ss.rooms[client.namespace] = make(map[*Client]bool)
			}
			ss.rooms[client.namespace][client] = true
			log.Printf("[%s] Client connected: ID=%s, UserID=%s, Role=%s", client.namespace, client.conn.RemoteAddr().String(), client.userID, client.role)
			ss.mu.Unlock()
			client.send <- Message{Event: "connected", Data: fmt.Sprintf("Đã kết nối tới %s", client.namespace)}

		case client := <-ss.unregister:
			ss.mu.Lock()
			if _, ok := ss.clients[client]; ok {
				close(client.send)
				delete(ss.clients, client)
				for room := range client.rooms {
					delete(ss.rooms[room], client)
					if len(ss.rooms[room]) == 0 {
						delete(ss.rooms, room)
					}
				}
				log.Printf("[%s] Client disconnected: ID=%s", client.namespace, client.conn.RemoteAddr().String())
			}
			ss.mu.Unlock()

		case message := <-ss.broadcast:
			ss.mu.RLock()
			for room, clients := range ss.rooms {
				if (strings.HasPrefix(message.Event, "factory:") && strings.HasPrefix(room, "/factory:")) ||
					(strings.HasPrefix(message.Event, "product:") && strings.HasPrefix(room, "/product:")) ||
					(strings.HasPrefix(message.Event, "location:") && strings.HasPrefix(room, "/location:")) ||
					(strings.HasPrefix(message.Event, "users:") && strings.HasPrefix(room, "/users:")) {
					for client := range clients {
						select {
						case client.send <- message:
						default:
							close(client.send)
							delete(ss.clients, client)
							delete(ss.rooms[room], client)
						}
					}
				}
			}
			ss.mu.RUnlock()
		}
	}
}

// Close dừng server
func (ss *SocketServer) Close() {
	log.Println("Dừng server WebSocket...")
	ss.mu.Lock()
	for client := range ss.clients {
		close(client.send)
		client.conn.Close()
		delete(ss.clients, client)
		for room := range client.rooms {
			delete(ss.rooms[room], client)
		}
	}
	ss.mu.Unlock()
}

// handleWebSocket xử lý kết nối WebSocket cho một namespace
func (ss *SocketServer) handleWebSocket(namespace string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Nâng cấp kết nối thành WebSocket
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("Upgrade error: %v", err)
			http.Error(w, "Could not upgrade to WebSocket", http.StatusBadRequest)
			return
		}

		// Xác thực token
		tokenString := r.Header.Get("Authorization")
		if tokenString == "" {
			// If not in header, check query parameter (frontend often sends this way)
			tokenString = r.URL.Query().Get("authorization")
			log.Printf("[%s] Authorization query parameter: %s", namespace, tokenString)
		}

		log.Printf("[%s] Final token string: %s", namespace, tokenString)

		if tokenString == "" {
			log.Printf("[%s] No Authorization token provided in header or query", namespace)
			conn.Close()
			return
		}
		if !strings.HasPrefix(tokenString, "Bearer ") {
			log.Printf("[%s] Invalid Authorization header format: %s", namespace, tokenString)
			conn.Close()
			return
		}
		tokenString = strings.TrimPrefix(tokenString, "Bearer ")

		claims, err := security.ValidateAccessToken(tokenString)
		if err != nil {
			log.Printf("[%s] Token validation failed: %v (Token: %s)", namespace, err, tokenString[:10]+"...")
			conn.Close()
			return
		}

		// Tạo client
		client := &Client{
			conn:      conn,
			userID:    claims.UserID,
			role:      *claims.Role,
			send:      make(chan Message),
			namespace: namespace,
			rooms:     make(map[string]bool),
		}

		// Đăng ký client
		ss.register <- client

		// Xử lý tin nhắn gửi đi
		go func() {
			defer func() {
				ss.unregister <- client
				client.conn.Close()
			}()
			for message := range client.send {
				err := client.conn.WriteJSON(message)
				if err != nil {
					log.Printf("[%s] Write error: %v", namespace, err)
					return
				}
			}
		}()

		// Xử lý tin nhắn nhận được
		for {
			var msg Message
			err := client.conn.ReadJSON(&msg)
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("[%s] Read error: %v", namespace, err)
				}
				return
			}

			log.Printf("[%s] Received event: %s, data: %v", namespace, msg.Event, msg.Data)
			ss.handleEvent(client, msg)
		}
	}
}

// handleEvent xử lý các sự kiện từ client
func (ss *SocketServer) handleEvent(client *Client, msg Message) {
	switch client.namespace {
	case "/users":
		switch msg.Event {
		case "subscribe":
			room := fmt.Sprintf("%s:users-room", client.namespace)
			ss.mu.Lock()
			if _, ok := ss.rooms[room]; !ok {
				ss.rooms[room] = make(map[*Client]bool)
			}
			ss.rooms[room][client] = true
			client.rooms[room] = true
			log.Printf("[/users] Client subscribed to room: %s", room)
			ss.mu.Unlock()
			client.send <- Message{Event: "subscribed", Data: "Đã tham gia users-room"}

		case "user:created", "user:updated", "user:deleted":
			room := fmt.Sprintf("%s:users-room", client.namespace)
			ss.mu.Lock()
			if clients, ok := ss.rooms[room]; ok {
				for c := range clients {
					c.send <- Message{Event: msg.Event, Data: msg.Data}
				}
			}
			ss.mu.Unlock()
		}

	case "/product":
		if msg.Event == "subscribe" {
			room := fmt.Sprintf("%s:product-room", client.namespace)
			ss.mu.Lock()
			if _, ok := ss.rooms[room]; !ok {
				ss.rooms[room] = make(map[*Client]bool)
			}
			ss.rooms[room][client] = true
			client.rooms[room] = true
			log.Printf("[/product] Client subscribed to room: %s", room)
			ss.mu.Unlock()
			client.send <- Message{Event: "subscribed", Data: "Đã tham gia product-room"}
		}

	case "/factory":
		if msg.Event == "subscribe" {
			room := fmt.Sprintf("%s:factory-room", client.namespace)
			ss.mu.Lock()
			if _, ok := ss.rooms[room]; !ok {
				ss.rooms[room] = make(map[*Client]bool)
			}
			ss.rooms[room][client] = true
			client.rooms[room] = true
			log.Printf("[/factory] Client subscribed to room: %s", room)
			ss.mu.Unlock()
			client.send <- Message{Event: "subscribed", Data: "Đã tham gia factory-room"}
		}

	case "/location":
		if msg.Event == "subscribe" {
			room := fmt.Sprintf("%s:location-room", client.namespace)
			ss.mu.Lock()
			if _, ok := ss.rooms[room]; !ok {
				ss.rooms[room] = make(map[*Client]bool)
			}
			ss.rooms[room][client] = true
			client.rooms[room] = true
			log.Printf("[/location] Client subscribed to room: %s", room)
			ss.mu.Unlock()
			client.send <- Message{Event: "subscribed", Data: "Đã tham gia location-room"}
		}
	}
}

// RegisterHandlers đăng ký các handler WebSocket
func (ss *SocketServer) RegisterHandlers(mux *http.ServeMux) {
	mux.HandleFunc("/ws/users", ss.handleWebSocket("/users"))
	mux.HandleFunc("/ws/product", ss.handleWebSocket("/product"))
	mux.HandleFunc("/ws/factory", ss.handleWebSocket("/factory"))
	mux.HandleFunc("/ws/location", ss.handleWebSocket("/location"))
}
