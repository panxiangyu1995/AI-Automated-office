package errors

import "testing"

func TestAuthErrorConstants(t *testing.T) {
	t.Parallel()
	cases := []*AuthError{
		ErrInvalidCredentials,
		ErrAccountLocked,
		ErrAccountDisabled,
		ErrTokenExpired,
		ErrTokenInvalid,
		ErrSessionExpired,
	}

	for _, c := range cases {
		if c.Code == "" || c.Message == "" {
			t.Fatalf("auth error should have code and message: %+v", c)
		}
		if c.Error() == "" {
			t.Fatalf("auth error string should not be empty: %+v", c)
		}
	}
}
