package valueobject

import (
	"errors"
	"unicode"
)

var (
	ErrPasswordMinLength = errors.New("password must be at least 8 characters")
	ErrPasswordNoUpper   = errors.New("password must contain uppercase letter")
	ErrPasswordNoLower   = errors.New("password must contain lowercase letter")
	ErrPasswordNoDigit   = errors.New("password must contain digit")
)

type Password struct {
	Raw string
}

func NewPassword(raw string) (*Password, error) {
	p := &Password{Raw: raw}
	if err := p.ValidateStrength(); err != nil {
		return nil, err
	}
	return p, nil
}

func (p *Password) ValidateStrength() error {
	if len(p.Raw) < 8 {
		return ErrPasswordMinLength
	}

	var hasUpper, hasLower, hasDigit bool
	for _, r := range p.Raw {
		switch {
		case unicode.IsUpper(r):
			hasUpper = true
		case unicode.IsLower(r):
			hasLower = true
		case unicode.IsDigit(r):
			hasDigit = true
		}
	}

	if !hasUpper {
		return ErrPasswordNoUpper
	}
	if !hasLower {
		return ErrPasswordNoLower
	}
	if !hasDigit {
		return ErrPasswordNoDigit
	}

	return nil
}
