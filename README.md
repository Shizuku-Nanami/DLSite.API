# DLSite API - Node.js 独立版本

🚀 一个基于 Express.js 的独立 Node.js 服务，用于获取 DLSite 网页基础元数据，完全不依赖 Cloudflare Workers 环境。

## ✨ 功能特性

- 🌐 **独立运行** - 完全基于 Node.js，无需 Cloudflare Workers
- 🛡️ **安全防护** - 集成 Helmet、CORS、请求频率限制
- 📊 **性能优化** - 压缩、缓存、连接复用
- 📝 **详细日志** - Morgan 日志记录
- 🔍 **健康检查** - 内置监控端点
- 📚 **API 文档** - 自动生成的 API 文档
- 🔧 **易于部署** - 支持 PM2、Docker 等部署方式

## 🚀 快速开始

### 1. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 yarn
yarn install
```

### 2. 配置环境变量

```bash
# 复制配置文件
cp config.example.env .env

# 编辑配置 (可选)
nano .env
```

### 3. 启动服务

```bash
# 开发模式 (自动重启)
npm run dev

# 生产模式
npm start

# 使用 PM2 管理
npm run pm2:start
```

### 4. 验证服务

```bash
# 健康检查
curl http://localhost:8787/health

# 查看 API 文档
curl http://localhost:8787/docs
```

## 📋 API 文档

### 基本信息

- **基础URL**: `http://localhost:8787`
- **API版本**: `1.0.0`
- **数据格式**: `JSON`

### 端点列表

| 端点 | 方法 | 描述 |
|------|------|------|
| `/` | GET | 根路径，返回服务状态 |
| `/health` | GET | 健康检查 |
| `/docs` | GET | API 文档 |
| `/stats` | GET | 服务统计信息 |
| `/dlsite` | POST | DLSite 搜索接口 |

### 主要 API - DLSite 搜索

**端点**: `POST /dlsite`

**请求体**:
```json
{
  "search": "maniax",
  "query": "ASMR",
  "results": 10,
  "page": 1,
  "format": "json"
}
```

**参数说明**:

| 参数 | 必需 | 类型 | 描述 | 可选值 |
|------|------|------|------|--------|
| `search` | 是 | string | 搜索类型 | `maniax`, `books`, `pro`, `appx`, `home`, `soft`, `app` |
| `query` | 是 | string | 搜索关键词 | 任意文本 |
| `results` | 是 | number | 返回结果数量 | 1-100 |
| `page` | 是 | number | 页码 | ≥1 |
| `format` | 否 | string | 返回格式 | `json`, `html` |

**响应示例**:
```json
{
  "results": [
    {
      "title": "作品标题",
      "link": "https://www.dlsite.com/maniax/work/=/product_id/RJ123456.html",
      "image": "https://img.dlsite.jp/resize/images2/work/doujin/RJ123456_img_main_240x240.jpg",
      "maker": "社团名称",
      "maker_link": "https://www.dlsite.com/maniax/circle/profile/=/maker_id/RG12345.html",
      "author": "作者名称",
      "price": "1,100円",
      "date": "販売日: 2024年01月01日",
      "tags": "ASMR||耳舔||癒し",
      "text": "作品描述..."
    }
  ],
  "metadata": {
    "query": "ASMR",
    "search": "maniax",
    "page": 1,
    "requestedResults": 10,
    "actualResults": 10,
    "processingTime": 1234
  }
}
```


### Systemd 服务

创建 `/etc/systemd/system/dlsite-api.service`:

```ini
[Unit]
Description=DLSite API Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=8787

[Install]
WantedBy=multi-user.target
```

```bash
# 启用并启动服务
sudo systemctl enable dlsite-api
sudo systemctl start dlsite-api

# 查看状态
sudo systemctl status dlsite-api
```

### Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8787

USER node

CMD ["node", "server.js"]
```

```bash
# 构建镜像
docker build -t dlsite-api .

# 运行容器
docker run -d -p 8787:8787 --name dlsite-api dlsite-api
```

## 🔒 安全配置

### 环境变量安全

```bash
# 限制特定域名访问
ALLOWED_ORIGINS=https://yourdomain.com,https://anotherdomain.com

# 启用生产模式
NODE_ENV=production
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 速率限制
        limit_req zone=api_limit burst=10 nodelay;
    }
}
```

## 📊 监控和日志

### 内置监控端点

```bash
# 服务统计
curl http://localhost:8787/stats

# 健康检查
curl http://localhost:8787/health
```

### 日志查看

```bash
# PM2 日志
pm2 logs dlsite-api

# Systemd 日志
journalctl -u dlsite-api -f

# 直接运行时的日志输出到控制台
```

## 🐛 故障排除

### 常见问题

1. **端口被占用**:
   ```bash
   # 查找占用端口的进程
   lsof -i :8787
   
   # 杀死进程
   kill -9 PID
   ```

2. **依赖安装失败**:
   ```bash
   # 清除缓存
   npm cache clean --force
   
   # 重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **连接超时**:
   ```bash
   # 检查网络连接
   curl -I https://www.dlsite.com
   
   # 调整超时设置
   REQUEST_TIMEOUT_MS=60000
   ```

4. **内存不足**:
   ```bash
   # 检查内存使用
   curl http://localhost:8787/stats
   
   # 限制结果数量
   MAX_RESULTS_LIMIT=50
   ```

### 性能调优

```bash
# 增加 Node.js 内存限制
node --max-old-space-size=4096 server.js

# 使用集群模式
npm install -g pm2
pm2 start server.js -i max
```

## 🤝 API 测试

### 基本测试

```bash
# 健康检查
curl http://localhost:8787/health

# DLSite 搜索测试
curl -X POST http://localhost:8787/dlsite \
  -H "Content-Type: application/json" \
  -d '{
    "search": "maniax",
    "query": "ASMR",
    "results": 5,
    "page": 1
  }'
```

### 压力测试

```bash
# 安装 Artillery
npm install -g artillery

# 创建测试配置
echo '
config:
  target: "http://localhost:8787"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Health check"
    requests:
      - get:
          url: "/health"
  - name: "API test"
    requests:
      - post:
          url: "/dlsite"
          json:
            search: "maniax"
            query: "test"
            results: 5
            page: 1
' > artillery-test.yml

# 运行测试
artillery run artillery-test.yml
```

## 🆘 技术支持

如果遇到问题，请检查：

1. Node.js 版本 (需要 ≥16.0.0)
2. 网络连接到 DLSite
3. 防火墙设置
4. 系统资源使用情况

需要帮助时，请提供：
- 错误日志
- 系统信息 (`curl http://localhost:8787/stats`)
- 环境配置
- 复现步骤 