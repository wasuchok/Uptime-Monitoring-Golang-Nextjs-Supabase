package services

import (
	"context"
	"encoding/json"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

type statusHub struct {
	clients    map[*websocket.Conn]bool
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
	broadcast  chan []byte
}

type StatusMessage struct {
	ServiceID    int    `json:"service_id"`
	IsUp         bool   `json:"is_up"`
	StatusCode   int    `json:"status_code"`
	ResponseTime int    `json:"response_time"`
	CheckedAt    string `json:"checked_at"`
}

var hub = statusHub{
	clients:    make(map[*websocket.Conn]bool),
	register:   make(chan *websocket.Conn),
	unregister: make(chan *websocket.Conn),
	broadcast:  make(chan []byte, 64),
}

// StartStatusHub listens for websocket clients and broadcast messages.
func StartStatusHub(ctx context.Context) {
	for {
		select {
		case conn := <-hub.register:
			hub.clients[conn] = true
		case conn := <-hub.unregister:
			if _, ok := hub.clients[conn]; ok {
				delete(hub.clients, conn)
				_ = conn.Close()
			}
		case msg := <-hub.broadcast:
			for c := range hub.clients {
				if err := c.WriteMessage(websocket.TextMessage, msg); err != nil {
					delete(hub.clients, c)
					_ = c.Close()
				}
			}
		case <-ctx.Done():
			for c := range hub.clients {
				_ = c.Close()
			}
			return
		}
	}
}

// BroadcastStatus pushes status to all clients.
func BroadcastStatus(payload StatusMessage) {
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}
	select {
	case hub.broadcast <- data:
	default:
		// drop if channel full to avoid blocking uptime checks
	}
}

// SetupStatusWebsocket registers websocket route.
func SetupStatusWebsocket(app *fiber.App) {
	app.Get("/ws/status", websocket.New(func(c *websocket.Conn) {
		hub.register <- c
		defer func() {
			hub.unregister <- c
		}()
		for {
			if _, _, err := c.ReadMessage(); err != nil {
				break
			}
		}
	}))
}
