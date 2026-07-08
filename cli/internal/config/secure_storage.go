package config

import (
	"encoding/base64"
	"os"
	"path/filepath"
)

type SecureStorage struct {
	configDir string
}

func NewSecureStorage() *SecureStorage {
	home, _ := os.UserHomeDir()
	return &SecureStorage{configDir: filepath.Join(home, ".ao-cli")}
}

func (s *SecureStorage) SaveToken(key, token string) error {
	os.MkdirAll(s.configDir, 0700)
	encoded := base64.StdEncoding.EncodeToString([]byte(token))
	path := filepath.Join(s.configDir, key+".token")
	return os.WriteFile(path, []byte(encoded), 0600)
}

func (s *SecureStorage) LoadToken(key string) (string, error) {
	path := filepath.Join(s.configDir, key+".token")
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	decoded, err := base64.StdEncoding.DecodeString(string(data))
	if err != nil {
		return "", err
	}
	return string(decoded), nil
}

func (s *SecureStorage) DeleteToken(key string) error {
	path := filepath.Join(s.configDir, key+".token")
	return os.Remove(path)
}
