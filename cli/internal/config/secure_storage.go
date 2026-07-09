package config

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type tokenData struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

func keyPath() (string, error) {
	dir, err := configDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, ".key"), nil
}

func tokensPath() (string, error) {
	dir, err := configDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "tokens.enc"), nil
}

func loadOrGenerateKey() ([]byte, error) {
	kp, err := keyPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(kp)
	if err == nil && len(data) == 32 {
		return data, nil
	}

	key := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		return nil, fmt.Errorf("failed to generate encryption key: %w", err)
	}

	if err := os.WriteFile(kp, key, 0600); err != nil {
		return nil, fmt.Errorf("failed to write encryption key: %w", err)
	}

	return key, nil
}

func encrypt(plaintext []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("failed to generate nonce: %w", err)
	}

	return gcm.Seal(nonce, nonce, plaintext, nil), nil
}

func decrypt(ciphertext []byte, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	return gcm.Open(nil, nonce, ciphertext, nil)
}

func saveTokensSecure(accessToken, refreshToken string) error {
	key, err := loadOrGenerateKey()
	if err != nil {
		return err
	}

	td := tokenData{AccessToken: accessToken, RefreshToken: refreshToken}
	plaintext, err := json.Marshal(td)
	if err != nil {
		return fmt.Errorf("failed to marshal token data: %w", err)
	}

	encrypted, err := encrypt(plaintext, key)
	if err != nil {
		return fmt.Errorf("failed to encrypt tokens: %w", err)
	}

	tp, err := tokensPath()
	if err != nil {
		return err
	}

	if err := os.WriteFile(tp, encrypted, 0600); err != nil {
		return fmt.Errorf("failed to write encrypted tokens: %w", err)
	}

	return nil
}

func loadTokensSecure() (string, string, error) {
	tp, err := tokensPath()
	if err != nil {
		return "", "", err
	}

	ciphertext, err := os.ReadFile(tp)
	if err != nil {
		if os.IsNotExist(err) {
			return "", "", nil
		}
		return "", "", fmt.Errorf("failed to read encrypted tokens: %w", err)
	}

	key, err := loadOrGenerateKey()
	if err != nil {
		return "", "", err
	}

	plaintext, err := decrypt(ciphertext, key)
	if err != nil {
		return "", "", fmt.Errorf("failed to decrypt tokens: %w", err)
	}

	var td tokenData
	if err := json.Unmarshal(plaintext, &td); err != nil {
		return "", "", fmt.Errorf("failed to unmarshal token data: %w", err)
	}

	return td.AccessToken, td.RefreshToken, nil
}

func clearTokensSecure() error {
	tp, err := tokensPath()
	if err != nil {
		return err
	}
	if err := os.Remove(tp); err != nil && !os.IsNotExist(err) {
		return err
	}

	kp, err := keyPath()
	if err != nil {
		return err
	}
	if err := os.Remove(kp); err != nil && !os.IsNotExist(err) {
		return err
	}

	return nil
}
