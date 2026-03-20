#!/bin/bash

# AI-Automated-office 初始化脚本
# 用于安装依赖和启动开发服务器

set -e

echo "=========================================="
echo "  AI-Automated-office 初始化脚本"
echo "=========================================="

# ===========================================
# 前端环境检查
# ===========================================

echo ""
echo "[1/4] 检查前端环境..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未安装 Node.js，请先安装 Node.js >= 18"
    exit 1
fi

echo "Node.js 版本: $(node --version)"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "正在安装 pnpm..."
    npm install -g pnpm
fi

echo "pnpm 版本: $(pnpm --version)"

# 检查 Rust
if ! command -v rustc &> /dev/null; then
    echo "错误: 未安装 Rust，请先安装 Rust >= 1.70"
    echo "访问 https://rustup.rs/ 获取安装指南"
    exit 1
fi

echo "Rust 版本: $(rustc --version)"

# ===========================================
# 云端环境检查
# ===========================================

echo ""
echo "[2/4] 检查云端环境..."

# 检查 Go
if ! command -v go &> /dev/null; then
    echo "错误: 未安装 Go，请先安装 Go >= 1.21"
    echo "访问 https://go.dev/dl/ 获取安装指南"
    exit 1
fi

echo "Go 版本: $(go version)"

# 检查 Air (Go 热重载工具)
if ! command -v air &> /dev/null; then
    echo "正在安装 Air (Go 热重载工具)..."
    go install github.com/cosmtrek/air@latest
fi

echo "Air 版本: $(air -v)"

# 检查 Docker (可选，用于数据库)
echo ""
echo "[3/4] 检查 Docker (用于云端数据库)..."
if ! command -v docker &> /dev/null; then
    echo "警告: 未安装 Docker，云端数据库需要 Docker 支持"
    echo "访问 https://docs.docker.com/get-docker/ 获取安装指南"
    echo "或者手动启动 PostgreSQL 数据库"
else
    echo "Docker 版本: $(docker --version)"

    # 检查 Docker daemon 是否运行
    if docker info &> /dev/null; then
        echo "Docker daemon 运行正常"
    else
        echo "警告: Docker daemon 未运行，请先启动 Docker"
    fi
fi

# ===========================================
# 安装依赖
# ===========================================

echo ""
echo "正在安装前端依赖..."
pnpm install

# 检查 Tauri CLI
echo ""
echo "检查 Tauri CLI..."
if ! pnpm tauri --version &> /dev/null; then
    echo "Tauri CLI 已通过项目依赖安装"
fi

# 安装云端 Go 依赖
echo ""
echo "正在安装云端 Go 依赖..."
cd cloud-server
go mod download
go mod tidy
cd ..

# ===========================================
# 环境变量检查
# ===========================================

echo ""
echo "[4/4] 检查环境变量配置..."

# 前端环境变量
if [ ! -f .env.local ]; then
    echo ""
    echo "创建前端 .env.local 文件..."
    cp .env.example .env.local
    echo "请根据需要修改 .env.local 中的配置"
fi

# 云端环境变量
if [ ! -f cloud-server/configs/config.yaml ]; then
    echo ""
    echo "警告: 云端配置文件 cloud-server/configs/config.yaml 不存在"
    echo "请确保配置文件存在后再启动云端服务"
fi

# ===========================================
# 完成
# ===========================================

echo ""
echo "=========================================="
echo "  初始化完成！"
echo "=========================================="
echo ""
echo "启动开发服务器："
echo ""
echo "  [前端开发]"
echo "    pnpm dev              - 启动前端开发服务器"
echo "    pnpm tauri:dev        - 启动 Tauri 桌面应用"
echo ""
echo "  [云端开发]"
echo "    cd cloud-server"
echo "    make dev              - 启动云端开发服务器 (热重载)"
echo "    make run              - 启动云端开发服务器 (普通)"
echo ""
echo "  [数据库]"
echo "    docker-compose up -d  - 启动 PostgreSQL 数据库"
echo "    cd cloud-server && go run migrations/migrate.go - 运行数据库迁移"
echo ""
echo "默认端口："
echo "  - 前端: http://localhost:1420"
echo "  - 云端: http://localhost:8080"
echo "  - PostgreSQL: localhost:54320 (docker-compose 启动)"
echo ""
