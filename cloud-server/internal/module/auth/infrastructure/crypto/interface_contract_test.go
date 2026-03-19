package crypto

import "testing"

func TestPasswordPolicyContract(t *testing.T) {
	t.Parallel()
	var _ PasswordPolicy = (*BcryptHasher)(nil)
}

func TestTokenManagerContract(t *testing.T) {
	t.Parallel()
	var _ TokenManager = (*JWTManager)(nil)
}
