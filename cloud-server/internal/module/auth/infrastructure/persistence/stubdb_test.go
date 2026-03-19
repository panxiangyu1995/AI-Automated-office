package persistence

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"fmt"
	"io"
	"sync/atomic"
)

type stubState struct {
	query func(query string, args []driver.NamedValue) (driver.Rows, error)
	exec  func(query string, args []driver.NamedValue) (driver.Result, error)
}

type stubDriver struct {
	state *stubState
}

type stubConn struct {
	state *stubState
}

type stubRows struct {
	cols []string
	vals [][]driver.Value
	pos  int
}

func (r *stubRows) Columns() []string { return r.cols }
func (r *stubRows) Close() error      { return nil }
func (r *stubRows) Next(dest []driver.Value) error {
	if r.pos >= len(r.vals) {
		return io.EOF
	}
	copy(dest, r.vals[r.pos])
	r.pos++
	return nil
}

func (d *stubDriver) Open(_ string) (driver.Conn, error) {
	return &stubConn{state: d.state}, nil
}

func (c *stubConn) Prepare(string) (driver.Stmt, error) { return nil, errors.New("not supported") }
func (c *stubConn) Close() error                        { return nil }
func (c *stubConn) Begin() (driver.Tx, error)           { return nil, errors.New("not supported") }
func (c *stubConn) CheckNamedValue(*driver.NamedValue) error {
	return nil
}

func (c *stubConn) QueryContext(_ context.Context, query string, args []driver.NamedValue) (driver.Rows, error) {
	if c.state.query == nil {
		return nil, errors.New("query handler not configured")
	}
	return c.state.query(query, args)
}

func (c *stubConn) ExecContext(_ context.Context, query string, args []driver.NamedValue) (driver.Result, error) {
	if c.state.exec == nil {
		return nil, errors.New("exec handler not configured")
	}
	return c.state.exec(query, args)
}

var stubDriverSeq int64

func openStubDB(state *stubState) (*sql.DB, error) {
	name := fmt.Sprintf("auth_stub_%d", atomic.AddInt64(&stubDriverSeq, 1))
	sql.Register(name, &stubDriver{state: state})
	return sql.Open(name, "")
}
