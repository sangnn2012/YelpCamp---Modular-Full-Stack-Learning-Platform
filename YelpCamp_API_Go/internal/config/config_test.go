//go:build unit

package config

import (
	"os"
	"testing"
)

func TestLoadConfig_MissingRequiredVars(t *testing.T) {
	os.Unsetenv("HOST")
	os.Unsetenv("PORT")
	os.Unsetenv("JWT_SECRET")
	os.Unsetenv("DATABASE_URL")
	os.Unsetenv("CORS_ORIGIN")

	_, err := LoadConfig()
	if err == nil {
		t.Errorf("Expected error when required vars are missing, got nil")
	}
}

func TestLoadConfig_MissingDatabaseURL(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	os.Unsetenv("DATABASE_URL")
	defer os.Unsetenv("JWT_SECRET")

	_, err := LoadConfig()
	if err == nil {
		t.Errorf("Expected error when DATABASE_URL is missing, got nil")
	}
}

func TestLoadConfig_MissingJWTSecret(t *testing.T) {
	os.Setenv("DATABASE_URL", "postgres://localhost/test")
	os.Unsetenv("JWT_SECRET")
	defer os.Unsetenv("DATABASE_URL")

	_, err := LoadConfig()
	if err == nil {
		t.Errorf("Expected error when JWT_SECRET is missing, got nil")
	}
}

func TestLoadConfig_EnvOverrides(t *testing.T) {
	os.Setenv("HOST", "127.0.0.1")
	os.Setenv("PORT", "9999")
	os.Setenv("JWT_SECRET", "my-secret")
	os.Setenv("DATABASE_URL", "postgres://localhost/test")
	os.Setenv("CORS_ORIGIN", "http://example.com")
	defer func() {
		os.Unsetenv("HOST")
		os.Unsetenv("PORT")
		os.Unsetenv("JWT_SECRET")
		os.Unsetenv("DATABASE_URL")
		os.Unsetenv("CORS_ORIGIN")
	}()

	cfg, err := LoadConfig()
	if err != nil {
		t.Errorf("LoadConfig() returned error: %v", err)
	}

	if cfg.HTTPServer.Host != "127.0.0.1" {
		t.Errorf("Expected host '127.0.0.1', got '%s'", cfg.HTTPServer.Host)
	}
	if cfg.HTTPServer.Port != "9999" {
		t.Errorf("Expected port '9999', got '%s'", cfg.HTTPServer.Port)
	}
	if cfg.Jwt.Secret != "my-secret" {
		t.Errorf("Expected JWT secret 'my-secret', got '%s'", cfg.Jwt.Secret)
	}
	if cfg.Database.URL != "postgres://localhost/test" {
		t.Errorf("Expected database URL 'postgres://localhost/test', got '%s'", cfg.Database.URL)
	}
	if cfg.CORS.AllowedOrigins[0] != "http://example.com" {
		t.Errorf("Expected CORS origin 'http://example.com', got '%s'", cfg.CORS.AllowedOrigins[0])
	}
}

func TestHTTPServerConfig_Address(t *testing.T) {
	tests := []struct {
		name     string
		host     string
		port     string
		expected string
	}{
		{"default", "0.0.0.0", "3004", "0.0.0.0:3004"},
		{"localhost", "127.0.0.1", "8080", "127.0.0.1:8080"},
		{"empty host", "", "3004", ":3004"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := HTTPServerConfig{Host: tt.host, Port: tt.port}
			if got := cfg.Address(); got != tt.expected {
				t.Errorf("Address() = '%s', expected '%s'", got, tt.expected)
			}
		})
	}
}

func TestHTTPServerConfig_Address_PanicsOnEmptyPort(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Errorf("Expected panic on empty port, but did not panic")
		}
	}()

	cfg := HTTPServerConfig{Host: "0.0.0.0", Port: ""}
	cfg.Address()
}

func TestGetEnvOrDefault(t *testing.T) {
	tests := []struct {
		name       string
		key        string
		envValue   string
		setEnv     bool
		defaultVal string
		expected   string
	}{
		{"returns env value when set", "TEST_VAR_1", "from-env", true, "default", "from-env"},
		{"returns default when not set", "TEST_VAR_2", "", false, "default", "default"},
		{"returns default when empty", "TEST_VAR_3", "", true, "default", "default"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.setEnv {
				os.Setenv(tt.key, tt.envValue)
				defer os.Unsetenv(tt.key)
			} else {
				os.Unsetenv(tt.key)
			}

			got := getEnvOrDefault(tt.key, tt.defaultVal)
			if got != tt.expected {
				t.Errorf("getEnvOrDefault(%s, %s) = '%s', expected '%s'", tt.key, tt.defaultVal, got, tt.expected)
			}
		})
	}
}
