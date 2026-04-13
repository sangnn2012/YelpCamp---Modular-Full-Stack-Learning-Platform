package config

import "os"

// HTTPServerConfig holds the configuration for the HTTP server.
type HTTPServerConfig struct {
	Host string
	Port string
}

// Address constructs the listen address string (e.g., "0.0.0.0:3004") from Host and Port.
func (c HTTPServerConfig) Address() string {
	if c.Port == "" {
		panic("HTTPServerConfig.Port cannot be empty")
	}
	return c.Host + ":" + c.Port
}

// JwtConfig holds JWT-related configuration.
type JwtConfig struct {
	Secret string
}

// DatabaseConfig holds database connection configuration.
type DatabaseConfig struct {
	URL string
}

// CORSConfig holds CORS-related configuration.
type CORSConfig struct {
	AllowedOrigins []string
}

// Config holds the application configuration.
type Config struct {
	HTTPServer HTTPServerConfig
	Jwt        JwtConfig
	Database   DatabaseConfig
	CORS       CORSConfig
}

// LoadConfig loads configuration from environment variables.
func LoadConfig() (*Config, error) {
	cfg := &Config{
		HTTPServer: HTTPServerConfig{
			Host: getEnvOrDefault("HOST", "0.0.0.0"),
			Port: getEnvOrDefault("PORT", "3004"),
		},
		Jwt: JwtConfig{
			Secret: getEnvOrDefault("JWT_SECRET", ""),
		},
		Database: DatabaseConfig{
			URL: getEnvOrDefault("DATABASE_URL", ""),
		},
		CORS: CORSConfig{
			AllowedOrigins: []string{
				getEnvOrDefault("CORS_ORIGIN", "http://localhost:3000"),
				"http://localhost:3003",
			},
		},
	}
	return cfg, nil
}

// getEnvOrDefault returns the value of the environment variable or the default value if not set.
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
