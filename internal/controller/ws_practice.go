package controller

import (
	"encoding/json"
	"math"
	"sync"
	"time"

	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gorilla/websocket"
)

// WSPracticeController handles the WebSocket /ws/practice endpoint.
type WSPracticeController struct{}

func NewWSPracticeController() *WSPracticeController {
	return &WSPracticeController{}
}

// Client -> Server messages
type wsKeystrokeMsg struct {
	Type      string `json:"type"`
	Char      string `json:"char"`
	Timestamp int64  `json:"timestamp"` // unix ms
	IsCorrect bool   `json:"is_correct"`
}

// Server -> Client messages
type wsStatsMsg struct {
	Type      string  `json:"type"`
	WPM       float64 `json:"wpm"`
	RawWPM    float64 `json:"raw_wpm"`
	Accuracy  float64 `json:"accuracy"`
	ElapsedMs int64   `json:"elapsed_ms"`
	CharIndex int     `json:"char_index"`
}

type practiceState struct {
	mu            sync.Mutex
	startTime     int64 // unix ms
	totalChars    int
	correctChars  int
	charIndex     int
}

// Handle upgrades the connection and processes real-time keystroke events.
func (c *WSPracticeController) Handle(r *ghttp.Request) {
	ws, err := r.WebSocket()
	if err != nil {
		r.Response.WriteStatus(400)
		return
	}
	conn := ws.Conn

	state := &practiceState{}

	defer conn.Close()

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var msg wsKeystrokeMsg
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			continue
		}

		if msg.Type != "keystroke" {
			continue
		}

		state.mu.Lock()

		if state.startTime == 0 {
			state.startTime = msg.Timestamp
		}

		state.totalChars++
		state.charIndex++
		if msg.IsCorrect {
			state.correctChars++
		}

		elapsedMs := msg.Timestamp - state.startTime
		if elapsedMs < 1 {
			elapsedMs = 1
		}

		elapsedMin := float64(elapsedMs) / 60000.0
		rawWPM := float64(state.totalChars) / 5.0 / elapsedMin
		netWPM := float64(state.correctChars) / 5.0 / elapsedMin

		accuracy := 100.0
		if state.totalChars > 0 {
			accuracy = math.Round(float64(state.correctChars)/float64(state.totalChars)*10000) / 100
		}

		resp := wsStatsMsg{
			Type:      "stats",
			WPM:       math.Round(netWPM*100) / 100,
			RawWPM:    math.Round(rawWPM*100) / 100,
			Accuracy:  accuracy,
			ElapsedMs: elapsedMs,
			CharIndex: state.charIndex,
		}

		state.mu.Unlock()

		respBytes, _ := json.Marshal(resp)
		if err := conn.WriteMessage(websocket.TextMessage, respBytes); err != nil {
			break
		}
	}
}

// Ping sends periodic pings to keep the connection alive.
func keepAlive(conn *websocket.Conn, done <-chan struct{}) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		case <-done:
			return
		}
	}
}
