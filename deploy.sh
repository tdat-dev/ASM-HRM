#!/bin/bash
# File: deploy.sh - Đặt trên hosting

# Thư mục project
PROJECT_DIR="/home/username/htdocs"

# Pull code mới từ GitHub
cd $PROJECT_DIR
git pull origin main

# Set permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;

echo "Deployment completed at $(date)"
