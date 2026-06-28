#!/bin/bash
# agent-browser 交互式测试脚本
# 用于手动测试和调试 E2E 测试

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=== agent-browser 交互式测试 ==="
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查依赖
check_deps() {
    log_info "检查依赖..."
    
    if ! command -v agent-browser &> /dev/null; then
        log_error "agent-browser 未安装"
        echo "请先安装: npm i -g agent-browser"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
}

# 启动环境
start_env() {
    log_info "启动测试环境..."
    docker-compose -f docker-compose.test.yml up -d
    log_info "等待服务就绪..."
    ./scripts/test/wait-for-services.sh
}

# 停止环境
stop_env() {
    log_info "停止测试环境..."
    docker-compose -f docker-compose.test.yml down
}

# 打开浏览器
open_browser() {
    log_info "打开浏览器..."
    agent-browser open http://localhost:1420
}

# 常用测试流程
common_tests() {
    log_info "执行常用测试流程..."
    echo ""
    echo "=== 常用测试场景 ==="
    echo ""
    echo "1. 登录测试"
    echo "2. 用户管理测试"
    echo "3. 部门管理测试"
    echo "4. AI 对话测试"
    echo "5. 全部测试"
    echo ""
    read -p "选择测试场景 [1-5]: " choice
    
    case $choice in
        1)
            test_login
            ;;
        2)
            test_login
            test_user_management
            ;;
        3)
            test_login
            test_department_management
            ;;
        4)
            test_login
            test_ai_chat
            ;;
        5)
            test_login
            test_user_management
            test_department_management
            test_ai_chat
            ;;
        *)
            log_error "无效选择"
            ;;
    esac
}

# 登录测试
test_login() {
    echo ""
    log_info "测试: 登录"
    echo ""
    
    agent-browser open http://localhost:1420/login
    agent-browser wait --load networkidle
    agent-browser snapshot -i
    
    echo ""
    echo "请在浏览器中完成登录测试"
    echo "完成后按 Enter 继续..."
    read
}

# 用户管理测试
test_user_management() {
    echo ""
    log_info "测试: 用户管理"
    echo ""
    
    agent-browser open http://localhost:1420/admin/users
    agent-browser wait --load networkidle
    agent-browser snapshot -i
    
    echo ""
    echo "请在浏览器中完成用户管理测试"
    echo "完成后按 Enter 继续..."
    read
}

# 部门管理测试
test_department_management() {
    echo ""
    log_info "测试: 部门管理"
    echo ""
    
    agent-browser open http://localhost:1420/admin/departments
    agent-browser wait --load networkidle
    agent-browser snapshot -i
    
    echo ""
    echo "请在浏览器中完成部门管理测试"
    echo "完成后按 Enter 继续..."
    read
}

# AI 对话测试
test_ai_chat() {
    echo ""
    log_info "测试: AI 对话"
    echo ""
    
    agent-browser open http://localhost:1420
    agent-browser wait --load networkidle
    agent-browser snapshot -i
    
    echo ""
    echo "请在浏览器中完成 AI 对话测试"
    echo "完成后按 Enter 继续..."
    read
}

# 查看日志
view_logs() {
    echo ""
    log_info "查看日志..."
    echo ""
    echo "1. API 日志"
    echo "2. Frontend 日志"
    echo "3. PostgreSQL 日志"
    echo "4. Redis 日志"
    echo ""
    read -p "选择 [1-4]: " choice
    
    case $choice in
        1)
            docker-compose -f docker-compose.test.yml logs api --tail=100
            ;;
        2)
            docker-compose -f docker-compose.test.yml logs frontend --tail=100
            ;;
        3)
            docker-compose -f docker-compose.test.yml logs postgres --tail=100
            ;;
        4)
            docker-compose -f docker-compose.test.yml logs redis --tail=100
            ;;
    esac
}

# 交互菜单
interactive_menu() {
    while true; do
        echo ""
        echo "=== agent-browser 交互测试 ==="
        echo ""
        echo "1. 启动环境"
        echo "2. 打开浏览器"
        echo "3. 常用测试流程"
        echo "4. 查看日志"
        echo "5. 停止环境"
        echo "6. 退出"
        echo ""
        read -p "选择 [1-6]: " choice
        
        case $choice in
            1)
                start_env
                ;;
            2)
                open_browser
                ;;
            3)
                common_tests
                ;;
            4)
                view_logs
                ;;
            5)
                stop_env
                ;;
            6)
                log_info "退出"
                break
                ;;
            *)
                log_error "无效选择"
                ;;
        esac
    done
}

# 主流程
main() {
    check_deps
    
    case "${1:-}" in
        --start)
            start_env
            open_browser
            interactive_menu
            ;;
        --test)
            start_env
            common_tests
            stop_env
            ;;
        --open)
            open_browser
            ;;
        *)
            interactive_menu
            ;;
    esac
}

main "$@"
