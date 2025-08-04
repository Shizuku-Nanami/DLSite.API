require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { parseHTML } = require("linkedom");

const app = express();
const PORT = process.env.PORT || 8787;
const HOST = process.env.HOST || "0.0.0.0";

// 中间件配置 - 注意顺序很重要！
app.use(
  cors({
    origin: function (origin, callback) {
      // 允许所有来源，包括没有origin的请求（如移动应用、Postman等）
      callback(null, true);
    },
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
    ],
    credentials: true, // 允许发送cookies和凭据
    optionsSuccessStatus: 200,
    preflightContinue: false,
  })
);

// 额外的CORS头部处理中间件
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control"
  );
  next();
});

// JSON 解析中间件 - 必须在路由之前
app.use(
  express.json({
    limit: "10mb",
    strict: true,
    type: "application/json",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// DLSite 搜索模板配置
const BASE_URL = "https://www.dlsite.com";
const TEMPLATES = {
  maniax:
    "/maniax/fsr/=/language/jp/sex_category[0]/male/keyword/{query}/work_category[0]/doujin/work_category[1]/books/work_category[2]/pc/work_category[3]/app/order[0]/trend/options_and_or/and/per_page/{results}/page/{page}/show_type/1/from/fs.header/?locale={lang}",
  books:
    "/books/fsr/=/language/jp/sex_category[0]/male/keyword/{query}/work_category[0]/books/order[0]/trend/options_and_or/and/per_page/{results}/page/{page}/show_type/1/from/fs.header/?locale={lang}",
  pro: "/pro/fsr/=/language/jp/sex_category[0]/male/keyword/{query}/work_category[0]/pc/order[0]/trend/options_and_or/and/per_page/{results}/page/{page}/show_type/1/from/fs.header/?locale={lang}",
  appx: "/appx/fsr/=/language/jp/sex_category[0]/male/keyword/{query}/order[0]/trend/options_and_or/and/per_page/{results}/page/{page}/show_type/1/from/fs.header/?locale={lang}",
  home: "/home/fsr/=/language/jp/keyword/{query}/age_category[0]/general/work_category[0]/doujin/work_category[1]/pc/work_category[2]/app/order[0]/trend/options_and_or/and/per_page/{results}/page/{page}/show_type/1/from/fs.header/?locale={lang}",
  soft: "/soft/fsr/=/language/jp/keyword/{query}/age_category[0]/general/order[0]/trend/options_and_or/and/per_page/{results}/page/{page}/show_type/1/from/fs.header/?locale={lang}",
  app: "/app/fsr/=/language/jp/keyword/{query}/age_category[0]/general/order[0]/trend/options_and_or/and/per_page/{results}/page/{page}/show_type/1/from/fs.header/?locale={lang}",
};

// 工具函数
function normalizeImageUrl(url) {
  if (!url) return null;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) return BASE_URL + url;
  return url;
}

// 请求频率限制 (简单实现)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1分钟
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 60; // 每分钟最多60次请求

function rateLimit(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();

  if (!requestCounts.has(clientIP)) {
    requestCounts.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return next();
  }

  const clientData = requestCounts.get(clientIP);

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }

  if (clientData.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "请求过于频繁，请稍后再试",
      resetTime: new Date(clientData.resetTime).toISOString(),
    });
  }

  clientData.count++;
  next();
}

// 健康检查和根路径
app.get(["/", "/health"], (req, res) => {
  res.json({
    status: "healthy",
    message: "DLSite API 正在运行 (Node.js 版本)",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    endpoints: {
      main: "POST /dlsite",
      health: "GET /health",
      docs: "GET /docs",
    },
    server: {
      node: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
    },
  });
});

// API 文档
app.get("/docs", (req, res) => {
  res.json({
    title: "DLSite Metadata API 文档",
    description: "获取 DLSite 网页基础元数据的 API 服务",
    version: "1.0.0",
    baseUrl: `${req.protocol}://${req.get("host")}`,
    endpoints: {
      "/dlsite": {
        method: "POST",
        description: "搜索 DLSite 作品信息",
        contentType: "application/json",
        parameters: {
          search: {
            type: "string",
            required: true,
            description: "搜索类型",
            enum: Object.keys(TEMPLATES),
          },
          query: {
            type: "string",
            required: true,
            description: "搜索关键词",
          },
          results: {
            type: "number",
            required: true,
            description: "返回结果数量",
            maximum: 100,
          },
          page: {
            type: "number",
            required: true,
            description: "页码",
          },
          format: {
            type: "string",
            required: false,
            description: "返回格式 (json|html)",
            default: "json",
          },
        },
        example: {
          search: "maniax",
          query: "ASMR",
          results: 10,
          page: 1,
        },
        curl_example: `curl -X POST ${req.protocol}://${req.get(
          "host"
        )}/dlsite \\
  -H "Content-Type: application/json" \\
  -d '{"search":"maniax","query":"ASMR","results":10,"page":1}'`,
      },
    },
  });
});

// 主要 API 端点
app.post("/dlsite", rateLimit, async (req, res) => {
  const startTime = Date.now();

  try {
    // 检查请求体是否为空
    if (!req.body || typeof req.body !== "object") {
      console.log("ERROR: 请求体无效");
      return res.status(400).json({
        error: "Invalid request body",
        message: "请求体必须是有效的 JSON 对象",
        received: typeof req.body,
        hint: "请确保设置了正确的 Content-Type: application/json 头部",
      });
    }

    // 验证请求体参数
    const { search, query, results, page, format } = req.body;

    // 检查必需参数
    const missingParams = [];
    if (!search) missingParams.push("search");
    if (!query) missingParams.push("query");
    if (!results) missingParams.push("results");
    if (!page) missingParams.push("page");

    if (missingParams.length > 0) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "缺少必需参数",
        required: ["search", "query", "results", "page"],
        missing: missingParams,
        received: req.body,
        hint: "请确保所有必需参数都已提供",
      });
    }

    // 验证搜索类型
    const template = TEMPLATES[search];
    if (!template) {
      return res.status(400).json({
        error: "Invalid search category",
        message: "无效的搜索类型",
        validCategories: Object.keys(TEMPLATES),
        received: search,
      });
    }

    // 限制结果数量
    const maxResults = Math.min(parseInt(results), 100);
    if (maxResults !== parseInt(results)) {
      console.warn(`Results limited from ${results} to ${maxResults}`);
    }

    // 构建搜索 URL
    const lang = "ja_JP";
    const encodedQuery = encodeURIComponent(query);
    const urlPath = template
      .replace(/{query}/g, encodedQuery)
      .replace(/{results}/g, String(maxResults))
      .replace(/{page}/g, String(page))
      .replace(/{lang}/g, lang);
    const fullUrl = BASE_URL + urlPath;

    // 动态导入 node-fetch
    const fetch = (await import("node-fetch")).default;

    // 获取 DLSite 页面
    const response = await fetch(fullUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
      },
      timeout: parseInt(process.env.REQUEST_TIMEOUT_MS) || 30000,
    });

    if (!response.ok) {
      throw new Error(
        `DLSite responded with ${response.status}: ${response.statusText}`
      );
    }

    const html = await response.text();

    // 如果请求原始 HTML
    if (format === "html") {
      return res.type("html").send(html);
    }

    // 解析 HTML 并提取数据
    const productRegex = /data-list_item_product_id="([^"]+)"/g;
    const searchResults = [];

    // 提取产品ID列表
    const productIds = [...html.matchAll(productRegex)].map(
      (match) => match[1]
    );

    if (productIds.length === 0) {
      return res.json({
        results: [],
        metadata: {
          query,
          search,
          page: parseInt(page),
          requestedResults: maxResults,
          actualResults: 0,
          processingTime: Date.now() - startTime,
          message: "未找到匹配的结果",
        },
      });
    }

    // 解析 HTML
    const { document } = parseHTML(html);
    const table = document.querySelector(".work_1col_table.n_worklist");

    if (!table) {
      return res.json({
        results: [],
        metadata: {
          query,
          search,
          page: parseInt(page),
          requestedResults: maxResults,
          actualResults: 0,
          processingTime: Date.now() - startTime,
          message: "页面结构发生变化，未找到作品列表",
        },
      });
    }

    const rows = table.querySelectorAll("tr[data-list_item_product_id]");
    const processLimit = Math.min(rows.length, maxResults);

    // 处理每一行数据
    for (let i = 0; i < processLimit; i++) {
      const row = rows[i];

      try {
        const a = row.querySelector(".work_name a");
        const title = a?.textContent?.trim() || "";
        const link = a?.getAttribute("href") || "";

        const img = row.querySelector(".work_thumb img");
        const rawImg =
          img?.getAttribute("data-src") || img?.getAttribute("src") || null;
        const image = normalizeImageUrl(rawImg);

        const b = row.querySelector(".maker_name a");
        const maker = b?.textContent?.trim() || "";
        const maker_link = b?.getAttribute("href") || "";

        const c = row.querySelector(".maker_name .author");
        const author = c?.textContent?.trim().split(/\s+/).join("||") || "";

        const d = row.querySelector(".work_price_parts .work_price_base");
        const price = d?.textContent?.trim() || "";

        const e = row.querySelector(".sales_date");
        const date = e?.textContent?.trim() || "";

        const f = row.querySelector(".search_tag");
        const tags =
          f?.textContent
            ?.trim()
            .split(/[\n\s]+/)
            .filter((tag) => tag)
            .join("||") || "";

        const g = row.querySelector(".work_text");
        const text = g?.textContent?.trim() || "";

        searchResults.push({
          title,
          link: link.startsWith("http") ? link : BASE_URL + link,
          image,
          maker,
          maker_link: maker_link
            ? maker_link.startsWith("http")
              ? maker_link
              : BASE_URL + maker_link
            : "",
          author,
          price: price ? price + "円" : "",
          date,
          tags,
          text,
        });
      } catch (error) {
        console.error(`处理第 ${i} 行时出错:`, error.message);
        continue;
      }
    }

    // 返回结果
    res.json({
      results: searchResults,
    });
  } catch (error) {
    console.error("API Error:", error);

    res.status(500).json({
      error: error.message,
      message: "抓取 DLSite 数据时发生错误",
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - startTime,
    });
  }
});

// 统计端点
app.get("/stats", (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    activeConnections: requestCounts.size,
    timestamp: new Date().toISOString(),
  });
});

// 404 处理
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `路径 '${req.originalUrl}' 不存在`,
    availablePaths: ["/", "/health", "/dlsite", "/docs", "/stats"],
    method: req.method,
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  res.status(500).json({
    error: "Internal Server Error",
    message: "服务器内部错误",
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// 优雅关闭
process.on("SIGTERM", () => {
  console.log("收到 SIGTERM 信号，正在优雅关闭...");
  server.close(() => {
    console.log("服务器已关闭");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("收到 SIGINT 信号，正在优雅关闭...");
  server.close(() => {
    console.log("服务器已关闭");
    process.exit(0);
  });
});

// 启动服务器
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 DLSite API Server 启动成功!`);
  console.log(`📍 服务地址: http://${HOST}:${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || "development"}`);
  console.log(`📚 API 文档: http://${HOST}:${PORT}/docs`);
  console.log(`💓 健康检查: http://${HOST}:${PORT}/health`);
  console.log("---");
});

module.exports = app;
