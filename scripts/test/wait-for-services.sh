#!/bin/bash
# 等待服务就绪脚本
# 等待所有依赖服务启动并就绪后才继续

set -e

MAX_WAIT=300  # 最多等待 5 分钟
ELAPSED=0
INTERVAL=3

echo "等待服务就绪..."

# 等待 PostgreSQL
echo "  - PostgreSQL (:54320)..."
while ! pg_isready -h localhost -p 54320 -U postgres > /dev/null 2>&1; do
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    if [ $ELAPSED -ge $MAX_WAIT ]; then
        echo "  PostgreSQL 启动超时 (等待了 ${ELAPSED}s)"
        exit 1
    fi
    echo "    等待中... (${ELAPSED}s)"
done
echo "  PostgreSQL 就绪 ✓"

# 等待 Redis
ELAPSED=0
echo "  - Redis (:6379)..."
while ! redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; do
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    if [ $ELAPSED -ge $MAX_WAIT ]; then
        echo "  Redis 启动超时 (等待了 ${ELAPSED}s)"
        exit 1
    fi
    echo "    等待中... (${ELAPSED}s)"
done
echo "  Redis 就绪 ✓"

# 等待 API
ELAPSED=0
echo "  - API Server (:8080)..."
while ! curl -sf http://localhost:8080/api/v1/health > /dev/null 2>&1; do
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    if [ $ELAPSED -ge $MAX_WAIT ]; then
        echo "  API Server 启动超时 (等待了 ${ELAPSED}s)"
        echo "  检查 API 日志: docker-compose -f docker-compose.test.yml logs api"
        exit 1
    fi
    echo "    等待中... (${ELAPSED}s)"
done
echo "  API Server 就绪 ✓"

# 等待 Frontend
ELAPSED=0
echo "  - Frontend (:1420)..."
while ! curl -sf http://localhost:1420 > /dev/null 2>&1; do
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    if [ $ELAPSED -ge $MAX_WAIT ]; then
        echo "  Frontend 启动超时 (等待了 ${ELAPSED}s)"
        echo "  检查 Frontend 日志: docker-compose -f docker-compose.test.yml logs frontend"
        exit 1
    fi
    echo "    等待中... (${ELAPSED}s)"
done
echo "  Frontend 就绪 ✓"

echo ""
echo "所有服务已就绪 ✓"
echo ""
echo "服务地址:"
echo "  - Frontend: http://localhost:1420"
echo "  - API:      http://localhost:8080"
echo "  - API Doc:  http://localhost:8080/swagger/"
