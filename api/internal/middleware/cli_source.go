package middleware

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"strconv"
	"time"

	"github.com/ai-office/api/pkg/config"
	"github.com/ai-office/api/pkg/errors"
	"github.com/ai-office/api/pkg/response"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

const (
	HeaderRequestSource = "X-Request-Source"
	HeaderSignature     = "X-Signature"
	HeaderTimestamp     = "X-Timestamp"
	CLISourceValue      = "ao-cli"
	hmacTolerance       = 5 * time.Minute
)

func CLISourceOnly(cfg *config.Config, logger *zap.Logger) gin.HandlerFunc {
	secret := cfg.JWT.GetCLIHMACSecret()

	return func(c *gin.Context) {
		source := c.GetHeader(HeaderRequestSource)
		if source != CLISourceValue {
			err := errors.ErrForbidden.WithMessage("仅允许通过 ao-cli 访问此 API").WithRecoverable(false, "login_via_cli")
			response.Error(c, err)
			c.Abort()
			return
		}

		sig := c.GetHeader(HeaderSignature)
		tsStr := c.GetHeader(HeaderTimestamp)

		if sig == "" || tsStr == "" {
			logger.Warn("CLI request without HMAC signature (legacy mode)",
				zap.String("path", c.Request.URL.Path),
				zap.String("method", c.Request.Method),
				zap.String("ip", c.ClientIP()),
			)
			c.Next()
			return
		}

		ts, err := strconv.ParseInt(tsStr, 10, 64)
		if err != nil {
			errResp := errors.ErrCliSourceRequired.WithMessage("无效的请求时间戳").WithRecoverable(true, "retry_with_valid_timestamp")
			response.Error(c, errResp)
			c.Abort()
			return
		}

		requestTime := time.Unix(ts, 0)
		now := time.Now()
		diff := now.Sub(requestTime)
		if diff < 0 {
			diff = -diff
		}
		if diff > hmacTolerance {
			errResp := errors.ErrCliSourceRequired.WithMessage("请求时间戳已过期").WithRecoverable(true, "retry_with_current_timestamp")
			response.Error(c, errResp)
			c.Abort()
			return
		}

		bodyBytes, _ := io.ReadAll(c.Request.Body)
		c.Request.Body = io.NopCloser(io.Reader(bytes.NewReader(bodyBytes)))

		bodyHash := sha256.Sum256(bodyBytes)
		bodyHashHex := hex.EncodeToString(bodyHash[:])

		method := c.Request.Method
		path := c.Request.URL.Path
		message := method + "\n" + path + "\n" + bodyHashHex + "\n" + tsStr

		mac := hmac.New(sha256.New, []byte(secret))
		mac.Write([]byte(message))
		expectedSig := hex.EncodeToString(mac.Sum(nil))

		if !hmac.Equal([]byte(sig), []byte(expectedSig)) {
			errResp := errors.ErrCliSourceRequired.WithMessage("请求签名验证失败").WithRecoverable(false, "login_via_cli")
			response.Error(c, errResp)
			c.Abort()
			return
		}

		c.Next()
	}
}
