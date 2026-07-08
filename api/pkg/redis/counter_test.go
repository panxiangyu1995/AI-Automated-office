package redis

import (
	"context"
	"testing"
)

func TestUnreadCounter_IncrDecrGet(t *testing.T) {
	client := newTestClient(t)
	counter := NewUnreadCounter(client)
	ctx := context.Background()

	entID := "ent-1"
	empID := "emp-1"

	count, err := counter.Get(ctx, entID, empID)
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if count != 0 {
		t.Errorf("expected 0, got %d", count)
	}

	val, err := counter.Incr(ctx, entID, empID)
	if err != nil {
		t.Fatalf("Incr failed: %v", err)
	}
	if val != 1 {
		t.Errorf("expected 1 after incr, got %d", val)
	}

	val, err = counter.Incr(ctx, entID, empID)
	if err != nil {
		t.Fatalf("Incr failed: %v", err)
	}
	if val != 2 {
		t.Errorf("expected 2 after second incr, got %d", val)
	}

	count, _ = counter.Get(ctx, entID, empID)
	if count != 2 {
		t.Errorf("expected 2 from Get, got %d", count)
	}

	val, err = counter.Decr(ctx, entID, empID)
	if err != nil {
		t.Fatalf("Decr failed: %v", err)
	}
	if val != 1 {
		t.Errorf("expected 1 after decr, got %d", val)
	}
}

func TestUnreadCounter_DecrBelowZero(t *testing.T) {
	client := newTestClient(t)
	counter := NewUnreadCounter(client)
	ctx := context.Background()

	entID := "ent-2"
	empID := "emp-2"

	val, err := counter.Decr(ctx, entID, empID)
	if err != nil {
		t.Fatalf("Decr on zero should not error: %v", err)
	}
	if val != 0 {
		t.Errorf("expected 0 when decr below zero, got %d", val)
	}
}

func TestUnreadCounter_Reset(t *testing.T) {
	client := newTestClient(t)
	counter := NewUnreadCounter(client)
	ctx := context.Background()

	entID := "ent-3"
	empID := "emp-3"

	counter.Incr(ctx, entID, empID)
	counter.Incr(ctx, entID, empID)

	err := counter.Reset(ctx, entID, empID)
	if err != nil {
		t.Fatalf("Reset failed: %v", err)
	}

	count, _ := counter.Get(ctx, entID, empID)
	if count != 0 {
		t.Errorf("expected 0 after reset, got %d", count)
	}
}

func TestUnreadCounter_NilClient(t *testing.T) {
	counter := NewUnreadCounter(nil)
	ctx := context.Background()

	_, err := counter.Incr(ctx, "e", "m")
	if err == nil {
		t.Error("expected error with nil client")
	}

	_, err = counter.Decr(ctx, "e", "m")
	if err != nil {
		t.Errorf("Decr with nil client should not error, got: %v", err)
	}

	count, err := counter.Get(ctx, "e", "m")
	if err != nil {
		t.Errorf("Get with nil client should not error, got: %v", err)
	}
	if count != 0 {
		t.Errorf("expected 0 with nil client, got %d", count)
	}
}
