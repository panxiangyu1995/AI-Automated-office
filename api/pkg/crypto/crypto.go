package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
	"os"
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

const chunkSize = 64 * 1024

func EncryptFile(srcPath, dstPath string) error {
	if masterKey == nil {
		return errors.New("crypto not initialized")
	}
	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return err
	}
	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return err
	}

	src, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer src.Close()

	dst, err := os.Create(dstPath)
	if err != nil {
		return err
	}
	defer dst.Close()

	buf := make([]byte, chunkSize)
	for {
		n, readErr := src.Read(buf)
		if n > 0 {
			nonce := make([]byte, aesGCM.NonceSize())
			if _, randErr := io.ReadFull(rand.Reader, nonce); randErr != nil {
				return randErr
			}
			encrypted := aesGCM.Seal(nonce, nonce, buf[:n], nil)
			lenBuf := make([]byte, 4)
			lenBuf[0] = byte(len(encrypted) >> 24)
			lenBuf[1] = byte(len(encrypted) >> 16)
			lenBuf[2] = byte(len(encrypted) >> 8)
			lenBuf[3] = byte(len(encrypted))
			if _, writeErr := dst.Write(append(lenBuf, encrypted...)); writeErr != nil {
				return writeErr
			}
		}
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			return readErr
		}
	}
	return nil
}

func DecryptFile(srcPath, dstPath string) error {
	if masterKey == nil {
		return errors.New("crypto not initialized")
	}
	block, err := aes.NewCipher(masterKey)
	if err != nil {
		return err
	}
	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return err
	}
	nonceSize := aesGCM.NonceSize()

	src, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer src.Close()

	dst, err := os.Create(dstPath)
	if err != nil {
		return err
	}
	defer dst.Close()

	lenBuf := make([]byte, 4)
	for {
		if _, err := io.ReadFull(src, lenBuf); err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		chunkLen := int(lenBuf[0])<<24 | int(lenBuf[1])<<16 | int(lenBuf[2])<<8 | int(lenBuf[3])
		chunk := make([]byte, chunkLen)
		if _, err := io.ReadFull(src, chunk); err != nil {
			return err
		}
		if len(chunk) < nonceSize {
			return errors.New("encrypted chunk too short")
		}
		nonce, ciphertext := chunk[:nonceSize], chunk[nonceSize:]
		plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
		if err != nil {
			return err
		}
		if _, err := dst.Write(plaintext); err != nil {
			return err
		}
	}
	return nil
}

func Initialized() bool {
	return masterKey != nil
}
