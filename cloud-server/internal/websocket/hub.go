package websocket

import (
	"encoding/json"
	"sync"
)

// Hub WebSocket连接中心
type Hub struct {
	// 客户端连接映射: userID -> []*Client
	clients map[string]map[*Client]bool
	// 注册/注销通道
	register   chan *Client
	unregister chan *Client
	// 广播消息通道
	broadcast chan *Message
	// 锁定
	mu sync.RWMutex
}

// Message 消息结构
type Message struct {
	Type      string      `json:"type"`
	Payload   interface{} `json:"payload"`
	TargetIDs []string    `json:"target_ids,omitempty"` // 指定目标用户，为空则广播全部
}

// Client WebSocket客户端
type Client struct {
	UserID   string
	TenantID string
	Conn     interface{} // *websocket.Conn，使用interface避免循环导入
	Send     chan []byte
	Hub      *Hub
}

// NewHub 创建WebSocket中心
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message, 256),
	}
}

// Run 启动Hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; !ok {
				h.clients[client.UserID] = make(map[*Client]bool)
			}
			h.clients[client.UserID][client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.UserID]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.Send)
					if len(clients) == 0 {
						delete(h.clients, client.UserID)
					}
				}
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			data, err := json.Marshal(message)
			if err != nil {
				continue
			}
			h.mu.RLock()
			if len(message.TargetIDs) == 0 {
				// 广播给所有用户
				for _, clients := range h.clients {
					for client := range clients {
						select {
						case client.Send <- data:
						default:
							close(client.Send)
							delete(clients, client)
						}
					}
				}
			} else {
				// 发送给指定用户
				for _, targetID := range message.TargetIDs {
					if clients, ok := h.clients[targetID]; ok {
						for client := range clients {
							select {
							case client.Send <- data:
							default:
								close(client.Send)
								delete(clients, client)
							}
						}
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Register 注册客户端
func (h *Hub) Register(client *Client) {
	h.register <- client
}

// Unregister 注销客户端
func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

// SendToUser 发送消息给指定用户
func (h *Hub) SendToUser(userID string, msgType string, payload interface{}) {
	h.broadcast <- &Message{
		Type:      msgType,
		Payload:   payload,
		TargetIDs: []string{userID},
	}
}

// SendToUsers 发送消息给多个用户
func (h *Hub) SendToUsers(userIDs []string, msgType string, payload interface{}) {
	h.broadcast <- &Message{
		Type:      msgType,
		Payload:   payload,
		TargetIDs: userIDs,
	}
}

// Broadcast 广播消息给所有用户
func (h *Hub) Broadcast(msgType string, payload interface{}) {
	h.broadcast <- &Message{
		Type:      msgType,
		Payload:   payload,
		TargetIDs: nil,
	}
}

// GetOnlineUsers 获取在线用户列表
func (h *Hub) GetOnlineUsers() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()
	users := make([]string, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users
}

// IsUserOnline 检查用户是否在线
func (h *Hub) IsUserOnline(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if clients, ok := h.clients[userID]; ok {
		return len(clients) > 0
	}
	return false
}

// GlobalHub 全局WebSocket中心
var GlobalHub = NewHub()

func init() {
	go GlobalHub.Run()
}
