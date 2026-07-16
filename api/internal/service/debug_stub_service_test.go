package service

import (
	"testing"
)

func TestDebugStubService_Add(t *testing.T) {
	svc := NewDebugStubService()

	entry := StubEntry{Method: "GET", Path: "/api/v1/employees", Status: 200, Body: map[string]interface{}{"data": "mock"}}
	result := svc.Add(entry)

	if result.ID == "" {
		t.Error("expected ID to be set")
	}
	if result.CreatedAt.IsZero() {
		t.Error("expected CreatedAt to be set")
	}
}

func TestDebugStubService_List(t *testing.T) {
	svc := NewDebugStubService()
	svc.Add(StubEntry{Method: "GET", Path: "/api/v1/a", Status: 200})
	svc.Add(StubEntry{Method: "POST", Path: "/api/v1/b", Status: 201})

	list := svc.List()
	if len(list) != 2 {
		t.Errorf("expected 2 stubs, got %d", len(list))
	}
}

func TestDebugStubService_Get(t *testing.T) {
	svc := NewDebugStubService()
	added := svc.Add(StubEntry{Method: "GET", Path: "/api/v1/test", Status: 200})

	found, ok := svc.Get(added.ID)
	if !ok {
		t.Error("expected to find stub by ID")
	}
	if found.ID != added.ID {
		t.Errorf("expected ID %s, got %s", added.ID, found.ID)
	}
}

func TestDebugStubService_Get_NotFound(t *testing.T) {
	svc := NewDebugStubService()
	_, ok := svc.Get("nonexistent")
	if ok {
		t.Error("expected not found")
	}
}

func TestDebugStubService_Remove(t *testing.T) {
	svc := NewDebugStubService()
	added := svc.Add(StubEntry{Method: "GET", Path: "/api/v1/test", Status: 200})

	removed := svc.Remove(added.ID)
	if !removed {
		t.Error("expected removal to succeed")
	}

	list := svc.List()
	if len(list) != 0 {
		t.Errorf("expected 0 stubs after removal, got %d", len(list))
	}
}

func TestDebugStubService_Remove_NotFound(t *testing.T) {
	svc := NewDebugStubService()
	removed := svc.Remove("nonexistent")
	if removed {
		t.Error("expected removal to fail for nonexistent ID")
	}
}

func TestDebugStubService_Clear(t *testing.T) {
	svc := NewDebugStubService()
	svc.Add(StubEntry{Method: "GET", Path: "/api/v1/a", Status: 200})
	svc.Add(StubEntry{Method: "POST", Path: "/api/v1/b", Status: 201})

	svc.Clear()
	list := svc.List()
	if len(list) != 0 {
		t.Errorf("expected 0 stubs after clear, got %d", len(list))
	}
}

func TestDebugStubService_Match(t *testing.T) {
	svc := NewDebugStubService()
	svc.Add(StubEntry{Method: "GET", Path: "/api/v1/employees", Status: 200, Body: "mock-data"})

	found, ok := svc.Match("GET", "/api/v1/employees")
	if !ok {
		t.Error("expected match")
	}
	if found.Status != 200 {
		t.Errorf("expected status 200, got %d", found.Status)
	}
}

func TestDebugStubService_Match_NotFound(t *testing.T) {
	svc := NewDebugStubService()
	_, ok := svc.Match("GET", "/api/v1/nonexistent")
	if ok {
		t.Error("expected no match")
	}
}

func TestDebugStubService_Add_Overwrite(t *testing.T) {
	svc := NewDebugStubService()
	svc.Add(StubEntry{Method: "GET", Path: "/api/v1/test", Status: 200})
	svc.Add(StubEntry{Method: "GET", Path: "/api/v1/test", Status: 404})

	found, _ := svc.Match("GET", "/api/v1/test")
	if found.Status != 404 {
		t.Errorf("expected status 404 after overwrite, got %d", found.Status)
	}

	list := svc.List()
	if len(list) != 1 {
		t.Errorf("expected 1 stub after overwrite, got %d", len(list))
	}
}
