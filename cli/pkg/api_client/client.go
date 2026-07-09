package api_client

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"
)

type APIClient struct {
	baseURL      string
	httpClient   *http.Client
	token        string
	enterpriseID string
	hmacSecret   string
}

func NewAPIClient(baseURL string) *APIClient {
	return &APIClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *APIClient) SetToken(token string) {
	c.token = token
}

func (c *APIClient) SetEnterpriseID(eid string) {
	c.enterpriseID = eid
}

func (c *APIClient) SetHMACSecret(secret string) {
	c.hmacSecret = secret
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Data *LoginData `json:"data,omitempty"`
	Error *struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

type LoginData struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
}

func (c *APIClient) Login(email, password string) (accessToken, refreshToken string, expiresIn int, err error) {
	body := LoginRequest{Email: email, Password: password}
	payload, err := json.Marshal(body)
	if err != nil {
		return "", "", 0, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", c.baseURL+"/api/v1/auth/login", bytes.NewReader(payload))
	if err != nil {
		return "", "", 0, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", "", 0, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", 0, fmt.Errorf("failed to read response: %w", err)
	}

	var loginResp LoginResponse
	if err := json.Unmarshal(respBody, &loginResp); err != nil {
		return "", "", 0, fmt.Errorf("failed to parse response: %w", err)
	}

	if loginResp.Error != nil {
		return "", "", 0, fmt.Errorf("login failed: %s - %s", loginResp.Error.Code, loginResp.Error.Message)
	}

	if loginResp.Data == nil || loginResp.Data.AccessToken == "" {
		return "", "", 0, fmt.Errorf("login response missing access token")
	}

	return loginResp.Data.AccessToken, loginResp.Data.RefreshToken, loginResp.Data.ExpiresIn, nil
}

func (c *APIClient) RefreshToken(refreshToken string) (string, string, int, error) {
	body := map[string]string{"refresh_token": refreshToken}
	payload, err := json.Marshal(body)
	if err != nil {
		return "", "", 0, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", c.baseURL+"/api/v1/auth/refresh", bytes.NewReader(payload))
	if err != nil {
		return "", "", 0, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", "", 0, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", 0, fmt.Errorf("failed to read response: %w", err)
	}

	var loginResp LoginResponse
	if err := json.Unmarshal(respBody, &loginResp); err != nil {
		return "", "", 0, fmt.Errorf("failed to parse response: %w", err)
	}

	if loginResp.Error != nil {
		return "", "", 0, fmt.Errorf("refresh failed: %s - %s", loginResp.Error.Code, loginResp.Error.Message)
	}

	if loginResp.Data == nil || loginResp.Data.AccessToken == "" {
		return "", "", 0, fmt.Errorf("refresh response missing access token")
	}

	return loginResp.Data.AccessToken, loginResp.Data.RefreshToken, loginResp.Data.ExpiresIn, nil
}

func (c *APIClient) Get(path string) ([]byte, error) {
	req, err := http.NewRequest("GET", c.baseURL+path, nil)
	if err != nil {
		return nil, err
	}

	c.setHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

func (c *APIClient) Post(path string, body interface{}) ([]byte, error) {
	payload, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", c.baseURL+path, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}

	c.setHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

func (c *APIClient) request(method, path string, body interface{}) ([]byte, error) {
	var payload []byte
	if body != nil {
		var err error
		payload, err = json.Marshal(body)
		if err != nil {
			return nil, err
		}
	}

	var bodyReader io.Reader
	if payload != nil {
		bodyReader = bytes.NewReader(payload)
	}

	req, err := http.NewRequest(method, c.baseURL+path, bodyReader)
	if err != nil {
		return nil, err
	}

	c.setHeaders(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

func (c *APIClient) Put(path string, body interface{}) ([]byte, error) {
	return c.request("PUT", path, body)
}

func (c *APIClient) Delete(path string) ([]byte, error) {
	return c.request("DELETE", path, nil)
}

func (c *APIClient) Patch(path string, body interface{}) ([]byte, error) {
	return c.request("PATCH", path, body)
}

func (c *APIClient) setHeaders(req *http.Request) {
	if req.Method != "GET" {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-Request-Source", "ao-cli")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	if c.enterpriseID != "" {
		req.Header.Set("X-Enterprise-ID", c.enterpriseID)
	}
	if c.hmacSecret != "" {
		c.signRequest(req)
	}
}

func (c *APIClient) signRequest(req *http.Request) {
	var bodyBytes []byte
	if req.Body != nil {
		bodyBytes, _ = io.ReadAll(req.Body)
		req.Body = io.NopCloser(bytes.NewReader(bodyBytes))
	}

	bodyHash := sha256.Sum256(bodyBytes)
	bodyHashHex := hex.EncodeToString(bodyHash[:])

	ts := time.Now().Unix()
	tsStr := strconv.FormatInt(ts, 10)

	method := req.Method
	path := req.URL.Path
	message := method + "\n" + path + "\n" + bodyHashHex + "\n" + tsStr

	mac := hmac.New(sha256.New, []byte(c.hmacSecret))
	mac.Write([]byte(message))
	sig := hex.EncodeToString(mac.Sum(nil))

	req.Header.Set("X-Signature", sig)
	req.Header.Set("X-Timestamp", tsStr)
}
