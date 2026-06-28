package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Generate bcrypt hash for test passwords
	passwords := map[string]string{
		"admin":    "Admin@123456",
		"manager":  "Manager@123456",
		"employee": "Employee@123456",
	}

	fmt.Println("-- E2E Test Password Hashes")
	fmt.Println("-- Generated with bcrypt cost 12")
	fmt.Println()

	for username, password := range passwords {
		hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
		if err != nil {
			fmt.Printf("-- Error generating hash for %s: %v\n", username, err)
			continue
		}
		fmt.Printf("-- %s: %s -> %s\n", username, password, string(hash))
	}
}
