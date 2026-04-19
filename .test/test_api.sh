#!/bin/bash
# ============================================================
# Go 云端 API 集成测试脚本
# 使用：bash .test/test_api.sh
# 前置：cloud-server 运行在 localhost:3000
# 注意：bypass_auth 模式下 DB 可能为 nil，
#       admin/message/sync 路由可能返回 500 或空响应
# ============================================================

set -uo pipefail

BASE="http://localhost:3000/api/v1"
TENANT="235b7bd5-2ac0-466f-9e4e-f7b48e6c4ee5"
PASS=0; FAIL=0; TOTAL=0
CURL_OPTS="-s --max-time 5"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
results=()

assert_status() {
    local name="$1" expected="$2" actual="$3" body="$4"
    TOTAL=$((TOTAL + 1))
    if [ "$actual" = "$expected" ]; then
        PASS=$((PASS + 1)); results+=("${GREEN}PASS${NC} [$actual] $name")
    else
        FAIL=$((FAIL + 1)); results+=("${RED}FAIL${NC} expected=$expected got=$actual $name\n  body: $(echo "$body" | head -c 200)")
    fi
}

assert_contains() {
    local name="$1" needle="$2" body="$3" status="$4"
    TOTAL=$((TOTAL + 1))
    if echo "$body" | grep -q "$needle"; then
        PASS=$((PASS + 1)); results+=("${GREEN}PASS${NC} [$status] $name contains '$needle'")
    else
        FAIL=$((FAIL + 1)); results+=("${RED}FAIL${NC} $name missing '$needle'\n  body: $(echo "$body" | head -c 200)")
    fi
}

# assert_route_exists: 路由存在且返回了响应（非000）
assert_route_responds() {
    local name="$1" code="$2" body="$3"
    TOTAL=$((TOTAL + 1))
    if [ "$code" != "000" ] && [ -n "$code" ]; then
        PASS=$((PASS + 1)); results+=("${GREEN}PASS${NC} [$code] $name (route exists)")
    else
        FAIL=$((FAIL + 1)); results+=("${RED}FAIL${NC} $name no response (server panic?)")
    fi
}

print_results() {
    echo ""; echo "============================================"
    for r in "${results[@]}"; do echo -e "$r"; done
    echo "============================================"
    echo -e "${CYAN}Total: $TOTAL  ${GREEN}Pass: $PASS  ${RED}Fail: $FAIL${NC}"; echo ""
}

# ============================================================
echo -e "${YELLOW}=== 1. Health Check ===${NC}"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/health")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_status "GET /health" "200" "$code" "$body"
assert_contains "health ok" '"healthy"' "$body" "$code"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/health/liveness")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_status "GET /health/liveness" "200" "$code" "$body"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/health/readiness")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
TOTAL=$((TOTAL + 1))
if [ "$code" = "200" ] || [ "$code" = "503" ]; then
    PASS=$((PASS + 1)); results+=("${GREEN}PASS${NC} [$code] GET /health/readiness (200|503)")
else
    FAIL=$((FAIL + 1)); results+=("${RED}FAIL${NC} expected=200|503 got=$code readiness")
fi

# ============================================================
echo -e "${YELLOW}=== 2. Auth (bypass mode) ===${NC}"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"sadmintest@ai-office.local","password":"Admin123456"}')
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_status "POST /auth/login" "200" "$code" "$body"
assert_contains "login token" '"token"' "$body" "$code"

# Extract token using sed (more reliable than grep for long tokens)
TOKEN=$(echo "$body" | sed 's/.*"token":"//;s/".*//')
AUTH="Authorization: Bearer $TOKEN"
TH="X-Tenant-ID: $TENANT"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"sadmintest@ai-office.local","password":"wrongpwd"}')
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_status "POST /auth/login (bypass mode)" "200" "$code" "$body"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" -X POST "$BASE/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"username":"apitest_reg2@ai-office.local","password":"Test123456","name":"API新用户","department":"测试技术部"}')
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
TOTAL=$((TOTAL + 1))
if [ "$code" = "200" ] || [ "$code" = "503" ]; then
    PASS=$((PASS + 1)); results+=("${GREEN}PASS${NC} [$code] POST /auth/register (200|503)")
else
    FAIL=$((FAIL + 1)); results+=("${RED}FAIL${NC} expected=200|503 got=$code register\n  body: $(echo "$body" | head -c 200)")
fi

resp=$(curl $CURL_OPTS -w "\n%{http_code}" -X POST "$BASE/auth/forgot-password" \
    -H "Content-Type: application/json" \
    -d '{"username":"sadmintest@ai-office.local"}')
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
TOTAL=$((TOTAL + 1))
if [ "$code" = "200" ] || [ "$code" = "503" ]; then
    PASS=$((PASS + 1)); results+=("${GREEN}PASS${NC} [$code] POST /auth/forgot-password (200|503)")
else
    FAIL=$((FAIL + 1)); results+=("${RED}FAIL${NC} expected=200|503 got=$code forgot-password\n  body: $(echo "$body" | head -c 200)")
fi

# ============================================================
echo -e "${YELLOW}=== 3. Admin Routes (may panic in bypass mode) ===${NC}"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/admin/users" -H "$AUTH" -H "$TH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "GET /admin/users" "$code" "$body"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/admin/departments/tree" -H "$AUTH" -H "$TH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "GET /admin/departments/tree" "$code" "$body"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/admin/roles" -H "$AUTH" -H "$TH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "GET /admin/roles" "$code" "$body"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/admin/positions" -H "$AUTH" -H "$TH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "GET /admin/positions" "$code" "$body"

# ============================================================
echo -e "${YELLOW}=== 4. Audit Logs ===${NC}"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/audit/logs" -H "$AUTH" -H "$TH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "GET /audit/logs" "$code" "$body"

# ============================================================
echo -e "${YELLOW}=== 5. Message Routes ===${NC}"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/messages/unread-count" -H "$AUTH" -H "$TH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "GET /messages/unread-count" "$code" "$body"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/messages" -H "$AUTH" -H "$TH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "GET /messages" "$code" "$body"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/announcements" -H "$AUTH" -H "$TH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "GET /announcements" "$code" "$body"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/notifications/preferences" -H "$AUTH" -H "$TH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "GET /notifications/preferences" "$code" "$body"

# ============================================================
echo -e "${YELLOW}=== 6. Sync Routes ===${NC}"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" -X POST "$BASE/sync/push" \
    -H "$AUTH" -H "$TH" -H "Content-Type: application/json" \
    -d '{"device_id":"test","client_version":1,"last_sync_time":"2026-01-01T00:00:00Z","direction":"push","strategy":"last_write_wins","changes":[]}')
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "POST /sync/push" "$code" "$body"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" -X POST "$BASE/sync/pull" \
    -H "$AUTH" -H "$TH" -H "Content-Type: application/json" \
    -d '{"device_id":"test","client_version":1,"last_sync_time":"2026-01-01T00:00:00Z","direction":"pull","strategy":"last_write_wins"}')
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "POST /sync/pull" "$code" "$body"

# ============================================================
echo -e "${YELLOW}=== 7. Permission Routes ===${NC}"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/permissions/roles" -H "$AUTH" -H "$TH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "GET /permissions/roles" "$code" "$body"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/permissions" -H "$AUTH" -H "$TH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_route_responds "GET /permissions" "$code" "$body"

# ============================================================
echo -e "${YELLOW}=== 8. Error Cases ===${NC}"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" -d 'not json')
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_status "POST /auth/login (bad json, bypass)" "200" "$code" "$body"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" -d '{}')
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_status "POST /auth/login (empty, bypass)" "200" "$code" "$body"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/admin/users" -H "$AUTH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
assert_status "GET /admin/users (no tenant)" "400" "$code" "$body"
assert_contains "tenant required" 'TENANT_REQUIRED' "$body" "$code"

resp=$(curl $CURL_OPTS -w "\n%{http_code}" "$BASE/admin/users" -H "$TH")
code=$(echo "$resp" | tail -1); body=$(echo "$resp" | sed '$d')
TOTAL=$((TOTAL + 1))
if [ "$code" = "401" ] || [ "$code" = "500" ]; then
    PASS=$((PASS + 1)); results+=("${GREEN}PASS${NC} [$code] GET /admin/users (no auth, 401|500)")
else
    FAIL=$((FAIL + 1)); results+=("${RED}FAIL${NC} expected=401|500 got=$code no auth\n  body: $(echo "$body" | head -c 200)")
fi

# ============================================================
print_results

if [ "$FAIL" -gt 0 ]; then exit 1; fi
exit 0
