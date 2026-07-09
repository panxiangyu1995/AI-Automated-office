package api_client

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"
)

func TestNewAPIClient(t *testing.T) {
	client := NewAPIClient("http://localhost:8080")
	if client == nil {
		t.Fatal("client should not be nil")
	}
	if client.baseURL != "http://localhost:8080" {
		t.Errorf("expected baseURL http://localhost:8080, got %s", client.baseURL)
	}
}

func TestAPIClient_SetToken(t *testing.T) {
	client := NewAPIClient("http://localhost:8080")
	client.SetToken("my-token")
	if client.token != "my-token" {
		t.Errorf("expected token my-token, got %s", client.token)
	}
}

func TestAPIClient_SetHMACSecret(t *testing.T) {
	client := NewAPIClient("http://localhost:8080")
	client.SetHMACSecret("my-secret")
	if client.hmacSecret != "my-secret" {
		t.Errorf("expected hmacSecret my-secret, got %s", client.hmacSecret)
	}
}

func TestAPIClient_HMACSignatureHeaders(t *testing.T) {
	secret := "test-hmac-secret"
	var capturedReq *http.Request

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedReq = r
		w.WriteHeader(200)
		w.Write([]byte(`{"data":{}}`))
	}))
	defer server.Close()

	client := NewAPIClient(server.URL)
	client.SetToken("test-token")
	client.SetHMACSecret(secret)

	_, err := client.Get("/api/v1/test")
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if capturedReq == nil {
		t.Fatal("no request captured")
	}

	sig := capturedReq.Header.Get("X-Signature")
	tsStr := capturedReq.Header.Get("X-Timestamp")

	if sig == "" {
		t.Error("X-Signature header should be set")
	}
	if tsStr == "" {
		t.Error("X-Timestamp header should be set")
	}

	ts, err := strconv.ParseInt(tsStr, 10, 64)
	if err != nil {
		t.Fatalf("invalid timestamp: %v", err)
	}
	diff := time.Now().Unix() - ts
	if diff < 0 {
		diff = -diff
	}
	if diff > 5 {
		t.Errorf("timestamp should be close to now, diff=%d", diff)
	}

	bodyHash := sha256.Sum256(nil)
	bodyHashHex := hex.EncodeToString(bodyHash[:])
	message := "GET\n/api/v1/test\n" + bodyHashHex + "\n" + tsStr

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(message))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	if sig != expectedSig {
		t.Errorf("signature mismatch\nexpected: %s\ngot:      %s", expectedSig, sig)
	}
}

func TestAPIClient_NoSignatureWithoutSecret(t *testing.T) {
	var capturedReq *http.Request

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedReq = r
		w.WriteHeader(200)
		w.Write([]byte(`{"data":{}}`))
	}))
	defer server.Close()

	client := NewAPIClient(server.URL)
	client.SetToken("test-token")

	_, err := client.Get("/api/v1/test")
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if capturedReq.Header.Get("X-Signature") != "" {
		t.Error("X-Signature should not be set without HMAC secret")
	}
	if capturedReq.Header.Get("X-Timestamp") != "" {
		t.Error("X-Timestamp should not be set without HMAC secret")
	}
}

func TestAPIClient_HMACWithBody(t *testing.T) {
	secret := "body-hmac-secret"
	var capturedReq *http.Request

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedReq = r
		w.WriteHeader(200)
		w.Write([]byte(`{"data":{}}`))
	}))
	defer server.Close()

	client := NewAPIClient(server.URL)
	client.SetToken("test-token")
	client.SetHMACSecret(secret)

	body := map[string]string{"name": "test"}
	_, err := client.Post("/api/v1/test", body)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	sig := capturedReq.Header.Get("X-Signature")
	tsStr := capturedReq.Header.Get("X-Timestamp")

	if sig == "" || tsStr == "" {
		t.Fatal("signature headers should be set")
	}

	if !strings.HasPrefix(capturedReq.Header.Get("Content-Type"), "application/json") {
		t.Error("Content-Type should be application/json")
	}
}
