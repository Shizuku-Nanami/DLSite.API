const http = require("http");

// 测试配置
const BASE_URL = "http://127.0.0.1:8787";
const TIMEOUT = 15000;

// 简单的HTTP请求函数
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DLSite-API-Test/1.0",
      },
      timeout: TIMEOUT,
    };

    const req = http.request(url, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// 测试函数
async function runTests() {
  console.log("🚀 开始运行 DLSite API 测试");
  console.log(`📍 测试地址: ${BASE_URL}`);
  console.log("=".repeat(50));

  try {
    // 1. 健康检查测试
    console.log("\n🧪 测试 1: 健康检查");
    const healthResult = await makeRequest("GET", "/health");
    console.log(`   状态码: ${healthResult.status}`);
    if (healthResult.status === 200) {
      console.log(`   ✅ 健康检查通过`);
      console.log(`   🔍 服务状态: ${healthResult.data.status}`);
    } else {
      console.log(`   ❌ 健康检查失败`);
      return false;
    }

    // 2. API 文档测试
    console.log("\n🧪 测试 2: API 文档");
    const docsResult = await makeRequest("GET", "/docs");
    console.log(`   状态码: ${docsResult.status}`);
    if (docsResult.status === 200) {
      console.log(`   ✅ API 文档获取成功`);
    } else {
      console.log(`   ❌ API 文档获取失败`);
    }

    // 3. DLSite API 测试
    console.log("\n🧪 测试 3: DLSite API 功能");
    const apiBody = {
      search: "maniax",
      query: "ASMR",
      results: 5,
      page: 1,
    };

    console.log(`   请求体: ${JSON.stringify(apiBody)}`);

    const apiResult = await makeRequest("POST", "/dlsite", apiBody);
    console.log(`   状态码: ${apiResult.status}`);

    if (apiResult.status === 200) {
      console.log(`   ✅ API 请求成功`);
      if (apiResult.data.results && Array.isArray(apiResult.data.results)) {
        console.log(`   📊 返回结果数: ${apiResult.data.results.length}`);
        console.log(
          `   ⏱️  处理时间: ${apiResult.data.metadata?.processingTime}ms`
        );
      }
    } else {
      console.log(`   ❌ API 请求失败`);
      console.log(`   错误信息: ${JSON.stringify(apiResult.data, null, 2)}`);
      return false;
    }

    // 4. 错误处理测试
    console.log("\n🧪 测试 4: 错误处理");
    const errorResult = await makeRequest("POST", "/dlsite", {
      invalid: "data",
    });
    console.log(`   状态码: ${errorResult.status}`);
    if (errorResult.status === 400) {
      console.log(`   ✅ 错误处理正常`);
      console.log(`   💬 错误信息: ${errorResult.data.message}`);
    } else {
      console.log(`   ❌ 错误处理异常`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 所有测试完成！");
    console.log("✅ API 运行正常");

    return true;
  } catch (error) {
    console.log("\n❌ 测试运行失败:");
    console.log(`   错误: ${error.message}`);

    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 解决方案:");
      console.log("   1. 确保服务已启动: npm start");
      console.log("   2. 检查端口 8787 是否被占用");
      console.log("   3. 检查防火墙设置");
    }

    return false;
  }
}

// 运行测试
if (require.main === module) {
  runTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runTests, makeRequest };
