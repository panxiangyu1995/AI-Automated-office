package auth

import (
	"os"
	"strconv"

	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 12

func hashCost() int {
	if v := os.Getenv("AO_BCRYPT_COST"); v != "" {
		if cost, err := strconv.Atoi(v); err == nil && cost >= bcrypt.MinCost && cost <= bcrypt.MaxCost {
			return cost
		}
	}
	return bcryptCost
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), hashCost())
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
