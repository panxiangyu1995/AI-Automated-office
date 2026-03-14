#!/bin/bash

# AI-Automated-office 初始化脚本
# 用于安装依赖和启动开发服务器

set -e

echo "=========================================="
echo "  AI-Automated-office 初始化脚本"
echo "=========================================="

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

# 安装前端依赖
echo ""
echo "正在安装前端依赖..."
pnpm install

# 检查 Tauri CLI
echo ""
echo "检查 Tauri CLI..."
if ! pnpm tauri --version &> /dev/null; then
    echo "Tauri CLI 已通过项目依赖安装"
fi

# 创建环境变量文件（如果不存在）
if [ ! -f .env.local ]; then
    echo ""
    echo "创建 .env.local 文件..."
    cp .env.example .env.local
    echo "请根据需要修改 .env.local 中的配置"
fi

echo ""
echo "=========================================="
echo "  初始化完成！"
echo "=========================================="
echo ""
echo "启动开发服务器："
echo "  前端: pnpm dev"
echo "  Tauri: pnpm tauri:dev"
echo ""
