package mock

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// NewTestGinContext creates a fresh Gin context backed by an httptest.ResponseRecorder.
func NewTestGinContext(w *httptest.ResponseRecorder) (*gin.Context, *gin.Engine) {
	c, engine := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	return c, engine
}

// SetJSONBody attaches a JSON-encoded body to the Gin context request.
func SetJSONBody(c *gin.Context, body any) {
	jsonBytes, _ := json.Marshal(body)
	c.Request = httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(jsonBytes))
	c.Request.Header.Set("Content-Type", "application/json")
}

// SetURLParams sets URL path parameters on the Gin context.
func SetURLParams(c *gin.Context, params map[string]string) {
	ginParams := make([]gin.Param, 0, len(params))
	for k, v := range params {
		ginParams = append(ginParams, gin.Param{Key: k, Value: v})
	}
	c.Params = ginParams
}

// SetQueryParams sets URL query parameters on the Gin context request.
func SetQueryParams(c *gin.Context, params map[string]string) {
	q := c.Request.URL.Query()
	for k, v := range params {
		q.Set(k, v)
	}
	c.Request.URL.RawQuery = q.Encode()
}

// SetAuthContext sets the userID in the Gin context as the auth middleware would.
func SetAuthContext(c *gin.Context, userID string) {
	c.Set("userID", userID)
}

// ParseResponseBody parses the JSON response body from the recorder into the target.
func ParseResponseBody(w *httptest.ResponseRecorder, target any) error {
	return json.Unmarshal(w.Body.Bytes(), target)
}
