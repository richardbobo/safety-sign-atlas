#!/bin/bash
# 安全标志图集管理系统 - 启动脚本
cd "$(dirname "$0")"
PORT=3000 node server-optimized.js
