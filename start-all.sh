#!/bin/bash

# PostMessage Demo 启动脚本
echo "🚀 Starting PostMessage Demo..."
echo ""

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

echo "🔧 Starting all services..."
echo ""
echo "Services will be available at:"
echo "📝 Backend API: http://localhost:3001"
echo "📤 Upload Frontend: http://localhost:3002"  
echo "📋 List Frontend: http://localhost:3003"
echo "🖼️  Viewer Frontend: http://localhost:3004"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# 启动所有服务
pnpm dev