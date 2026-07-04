package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID       string `json:"user_id"`
	EnterpriseID string `json:"enterprise_id,omitempty"`
	Role         string `json:"role"`
	Email        string `json:"email"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	secret         []byte
	accessTTL     time.Duration
	refreshTTL    time.Duration
	issuer        string
}

func NewJWTManager(secret string, accessTTL, refreshTTL int, issuer string) *JWTManager {
	return &JWTManager{
		secret:      []byte(secret),
		accessTTL:  time.Duration(accessTTL) * time.Second,
		refreshTTL: time.Duration(refreshTTL) * time.Second,
		issuer:     issuer,
	}
}

func (m *JWTManager) GenerateAccessToken(userID uuid.UUID, enterpriseID uuid.UUID, role, email string) (string, error) {
	now := time.Now()
	claims := &Claims{
		UserID:       userID.String(),
		EnterpriseID: enterpriseID.String(),
		Role:         role,
		Email:        email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(m.accessTTL)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    m.issuer,
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	if err != nil {
		return "", fmt.Errorf("failed to sign access token: %w", err)
	}
	return signed, nil
}

func (m *JWTManager) GenerateRefreshToken(userID uuid.UUID) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(m.refreshTTL)

	claims := &Claims{
		UserID: userID.String(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    m.issuer,
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to sign refresh token: %w", err)
	}
	return signed, expiresAt, nil
}

func (m *JWTManager) ValidateToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return m.secret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}

func (m *JWTManager) AccessTTL() time.Duration {
	return m.accessTTL
}
