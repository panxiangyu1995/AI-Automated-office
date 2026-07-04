package api_client

import (
	"testing"
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
