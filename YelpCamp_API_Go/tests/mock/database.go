package mock

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/sangnn2012/yelpcamp-api-go/pkg/database"
)

// Compile-time interface compliance check
var _ database.DB = (*MockDB)(nil)

// MockDB implements database.DB using function pointers for flexible test scenarios.
type MockDB struct {
	QueryRowFunc func(ctx context.Context, sql string, args ...any) pgx.Row
	QueryFunc    func(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	ExecFunc     func(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

func (m *MockDB) QueryRow(ctx context.Context, sql string, args ...any) pgx.Row {
	if m.QueryRowFunc != nil {
		return m.QueryRowFunc(ctx, sql, args...)
	}
	return &MockRow{ScanFunc: func(dest ...any) error { return fmt.Errorf("no rows") }}
}

func (m *MockDB) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	if m.QueryFunc != nil {
		return m.QueryFunc(ctx, sql, args...)
	}
	return &MockRows{}, nil
}

func (m *MockDB) Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	if m.ExecFunc != nil {
		return m.ExecFunc(ctx, sql, args...)
	}
	return pgconn.NewCommandTag("OK"), nil
}

// MockRow implements pgx.Row for single-row query mocking.
type MockRow struct {
	ScanFunc func(dest ...any) error
}

func (m *MockRow) Scan(dest ...any) error {
	if m.ScanFunc != nil {
		return m.ScanFunc(dest...)
	}
	return nil
}

// MockRows implements pgx.Rows for multi-row query mocking.
type MockRows struct {
	rows    []func(dest ...any) error // each element scans one row
	index   int
	closed  bool
	scanErr error
}

func NewMockRows(scanFuncs ...func(dest ...any) error) *MockRows {
	return &MockRows{rows: scanFuncs, index: -1}
}

func (m *MockRows) Next() bool {
	if m.closed {
		return false
	}
	m.index++
	return m.index < len(m.rows)
}

func (m *MockRows) Scan(dest ...any) error {
	if m.index < 0 || m.index >= len(m.rows) {
		return fmt.Errorf("no current row")
	}
	return m.rows[m.index](dest...)
}

func (m *MockRows) Close()                                         {}
func (m *MockRows) Err() error                                     { return m.scanErr }
func (m *MockRows) CommandTag() pgconn.CommandTag                  { return pgconn.NewCommandTag("SELECT") }
func (m *MockRows) FieldDescriptions() []pgconn.FieldDescription   { return nil }
func (m *MockRows) Values() ([]any, error)                         { return nil, nil }
func (m *MockRows) RawValues() [][]byte                            { return nil }
func (m *MockRows) Conn() *pgx.Conn                                { return nil }
