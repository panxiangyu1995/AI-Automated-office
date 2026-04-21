package websocket

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Upgrader WebSocket升级配置
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // 生产环境应检查origin
	},
}

// Handler WebSocket HTTP处理器
type Handler struct {
	hub *Hub
}

// NewHandler 创建WebSocket处理器
func NewHandler(hub *Hub) *Handler {
	return &Handler{hub: hub}
}

var upgraderMu sync.Mutex

// HandleWebSocket 处理WebSocket连接
func (h *Handler) HandleWebSocket(c *gin.Context) {
	// 获取用户信息（从认证中间件）
	userID := c.GetString("user_id")
	tenantID := c.GetString("tenant_id")

	if userID == "" {
		c.JSON(401, gin.H{"error": "unauthorized"})
		return
	}

	// 升级HTTP到WebSocket
	upgraderMu.Lock()
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	upgraderMu.Unlock()
	if err != nil {
		return
	}

	// 创建客户端
	client := &Client{
		UserID:   userID,
		TenantID: tenantID,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		Hub:      h.hub,
	}

	// 注册到Hub
	h.hub.Register(client)

	// 启动读写goroutine
	go client.writePump()
	go client.readPump()
}

// writePump 处理向客户端写入消息
func (c *Client) writePump() {
	defer func() {
		if conn, ok := c.Conn.(*websocket.Conn); ok {
			conn.Close()
		}
	}()

	for {
		message, ok := <-c.Send
		if !ok {
			return
		}

		conn := c.Conn.(*websocket.Conn)
		if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
			return
		}
	}
}

// readPump 处理从客户端读取消息
func (c *Client) readPump() {
	defer func() {
		c.Hub.Unregister(c)
		if conn, ok := c.Conn.(*websocket.Conn); ok {
			conn.Close()
		}
	}()

	for {
		if conn, ok := c.Conn.(*websocket.Conn); ok {
			_, message, err := conn.ReadMessage()
			if err != nil {
				break
			}
			// 处理客户端消息（如心跳ping）
			handleClientMessage(c, message)
		}
	}
}

// handleClientMessage 处理客户端消息
func handleClientMessage(client *Client, message []byte) {
	// 简单的心跳响应
	if string(message) == "ping" {
		client.Send <- []byte("pong")
	}
}
