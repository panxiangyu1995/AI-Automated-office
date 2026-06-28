#!/bin/bash
# E2E 测试完整循环脚本
# 使用方法: ./scripts/test/e2e-full-loop.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=== E2E 测试完整循环 ==="
echo "项目目录: $PROJECT_DIR"
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 清理旧环境
cleanup() {
    log_info "清理测试环境..."
    docker-compose -f docker-compose.test.yml down -v --remove-orphans 2>/dev/null || true
}

# 启动测试环境
start_env() {
    log_info "启动测试环境..."
    docker-compose -f docker-compose.test.yml up -d
    
    log_info "等待服务启动..."
    ./scripts/test/wait-for-services.sh
}

# 执行测试
run_tests() {
    log_info "执行 Playwright E2E 测试..."
    
    # 设置环境变量
    export E2E_BACKEND_URL=http://localhost:8080
    export E2E_FRONTEND_URL=http://localhost:1420
    
    # 执行测试
    pnpm test:e2e
}

# 截图保存（失败时）
save_failure_evidence() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local screenshot_dir="tests/e2e/screenshots"
    
    mkdir -p "$screenshot_dir"
    
    log_info "保存测试失败证据到: $screenshot_dir"
    
    # 使用 agent-browser 截图（如果可用）
    if command -v agent-browser &> /dev/null; then
        agent-browser screenshot "$screenshot_dir/failure-$timestamp.png" 2>/dev/null || true
    fi
    
    # 复制日志
    docker-compose -f docker-compose.test.yml logs api > "$screenshot_dir/api-logs-$timestamp.log" 2>/dev/null || true
}

# 主流程
main() {
    # 清理旧环境
    cleanup
    
    # 启动环境
    start_env
    
    # 执行测试
    if run_tests; then
        log_info "测试通过 ✓"
        EXIT_CODE=0
    else
        log_error "测试失败 ✗"
        save_failure_evidence
        EXIT_CODE=1
    fi
    
    # 清理环境
    cleanup
    
    if [ $EXIT_CODE -eq 0 ]; then
        log_info "=== 测试完成 ==="
    else
        log_error "=== 测试失败 - 请修复代码后重新运行 ==="
    fi
    
    exit $EXIT_CODE
}

# 解析参数
case "${1:-}" in
    --cleanup)
        cleanup
        log_info "清理完成"
        ;;
    --start)
        start_env
        log_info "环境启动完成"
        ;;
    --stop)
        cleanup
        log_info "环境停止完成"
        ;;
    --help)
        echo "E2E 测试完整循环脚本"
        echo ""
        echo "用法:"
        echo "  $0              执行完整测试循环（启动 -> 测试 -> 清理）"
        echo "  $0 --cleanup    仅清理环境"
        echo "  $0 --start      仅启动环境"
        echo "  $0 --stop       仅停止环境"
        echo "  $0 --help       显示帮助"
        ;;
    *)
        main
        ;;
esac
