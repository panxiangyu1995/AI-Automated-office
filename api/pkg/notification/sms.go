package notification

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

type AliyunSMSConfig struct {
	AccessKeyID     string `yaml:"access_key_id"`
	AccessKeySecret string `yaml:"access_key_secret"`
	SignName        string `yaml:"sign_name"`
	TemplateCode    string `yaml:"template_code"`
	RegionID        string `yaml:"region_id"`
}

type AliyunSMSClient struct {
	config AliyunSMSConfig
}

func NewAliyunSMSClient(cfg AliyunSMSConfig) *AliyunSMSClient {
	return &AliyunSMSClient{config: cfg}
}

func (c *AliyunSMSClient) Send(phone, templateCode string, templateParams map[string]string) error {
	params := map[string]string{
		"AccessKeyId":      c.config.AccessKeyID,
		"Action":           "SendSms",
		"Format":           "JSON",
		"PhoneNumbers":     phone,
		"RegionId":         c.config.RegionID,
		"SignName":         c.config.SignName,
		"SignatureMethod":  "HMAC-SHA1",
		"SignatureNonce":   fmt.Sprintf("%d", time.Now().UnixNano()),
		"SignatureVersion": "1.0",
		"TemplateCode":     templateCode,
		"Timestamp":        time.Now().UTC().Format("2006-01-02T15:04:05Z"),
		"Version":          "2017-05-25",
	}

	if len(templateParams) > 0 {
		jsonBytes, _ := json.Marshal(templateParams)
		params["TemplateParam"] = string(jsonBytes)
	}

	sorted := sortParams(params)
	stringToSign := "GET&" + url.QueryEscape("/") + "&" + url.QueryEscape(sorted)
	signature := hmacSHA1(c.config.AccessKeySecret+"&", stringToSign)
	params["Signature"] = signature

	apiURL := "https://dysmsapi.aliyuncs.com/?" + buildQueryString(params)
	resp, err := http.Get(apiURL)
	if err != nil {
		return fmt.Errorf("SMS API request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return fmt.Errorf("SMS API response parse failed: %w", err)
	}

	if code, ok := result["Code"].(string); ok && code != "OK" {
		return fmt.Errorf("SMS API error: %s - %s", code, result["Message"])
	}

	return nil
}

func sortParams(params map[string]string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	pairs := make([]string, 0, len(keys))
	for _, k := range keys {
		pairs = append(pairs, url.QueryEscape(k)+"="+url.QueryEscape(params[k]))
	}
	return strings.Join(pairs, "&")
}

func buildQueryString(params map[string]string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	pairs := make([]string, 0, len(keys))
	for _, k := range keys {
		pairs = append(pairs, url.QueryEscape(k)+"="+url.QueryEscape(params[k]))
	}
	return strings.Join(pairs, "&")
}

func hmacSHA1(key, data string) string {
	mac := hmac.New(sha1.New, []byte(key))
	mac.Write([]byte(data))
	return base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

var _ = strconv.Itoa
