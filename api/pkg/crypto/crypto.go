package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
)

var masterKey []byte

func Init(keyHex string) error {
	key, err := hex.DecodeString(keyHex)
	if err != nil {
		return err
	}
	if len(key) != 32 {
		return errors.New("key must be 32 bytes (64 hex chars)")
	}
	masterKey = key
	return nil
}

func Encrypt(plaintext []byte) (string, error) {
	if masterKey == nil {
		return "", errors.New("crypto not initialized")
	}
	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return "", err
	}
	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	ciphertext := aesGCM.Seal(nonce, nonce, plaintext, nil)
	return hex.EncodeToString(ciphertext), nil
}

func Decrypt(cipherHex string) ([]byte, error) {
	if masterKey == nil {
		return nil, errors.New("crypto not initialized")
	}
	ciphertext, err := hex.DecodeString(cipherHex)
	if err != nil {
		return nil, err
	}
	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return nil, err
	}
	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonceSize := aesGCM.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, errors.New("ciphertext too short")
	}
	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	return aesGCM.Open(nil, nonce, ciphertext, nil)
}
