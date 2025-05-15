# DLSite网页元数据抓取

一个基于 Cloudflare Workers 的轻量级 API 服务，用于获取DLSite网页基础元数据

## ✨ 功能特性
- 智能提取网页内容
- 响应结果 JSON 格式化
- 使用 TypeScript

## API 文档
### 请求格式

#### DLSite可用
```
POST https://your-worker.example/dlsite
```

|参数|必须|类型|描述|
|--|--|--|--|
|search|是|string|选择搜索的类型(maniax/books/pro/appx/home/soft/app)|
|query|是|string|需要搜索的文本|
|results|是|int|输出的条目条数|

```JSON
{"search":"maniax","query":"ASMR","results":"100"}
```