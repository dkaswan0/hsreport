import https from "node:https";

async function testApi(name, fn) {
  try {
    const result = await fn();
    console.log(`[PASS] ${name}: ${result}`);
  } catch (err) {
    console.log(`[FAIL] ${name}: ${err.message}`);
  }
}

function httpPost(urlStr, headers, bodyObj) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const bodyStr = JSON.stringify(bodyObj);
    const req = https.request(url, {
      method: 'POST',
      rejectUnauthorized: false,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 150)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout 10s')); });
    req.write(bodyStr);
    req.end();
  });
}

function httpGet(urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const req = https.request(url, {
      method: 'GET',
      rejectUnauthorized: false,
      headers,
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 150)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout 10s')); });
    req.end();
  });
}

(async () => {
  console.log("================ API HEALTH AUDIT ================\n");

  // 1. Google Gemini
  await testApi("Google Gemini API", async () => {
    const key = process.env.GEMINI_API_KEY || "AQ.Ab8RN6KMGMNaUzLTdPSp9vctUqEAKBCgJ4WkAMFG3wIZqdyDmA";
    const res = await httpPost(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {}, {
      contents: [{ parts: [{ text: "Hello" }] }]
    });
    return "OK (Gemini 2.0 Flash responding)";
  });

  // 2. OpenRouter API
  await testApi("OpenRouter API", async () => {
    const key = process.env.OPENROUTER_API_KEY || "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";
    const res = await httpPost("https://openrouter.ai/api/v1/chat/completions", {
      "Authorization": `Bearer ${key}`
    }, {
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: "Hi" }]
    });
    return "OK (OpenRouter gpt-4o-mini responding)";
  });

  // 3. Groq API
  await testApi("Groq AI API", async () => {
    const key = process.env.GROQ_API_KEY || "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";
    const res = await httpPost("https://api.groq.com/openai/v1/chat/completions", {
      "Authorization": `Bearer ${key}`
    }, {
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Hi" }]
    });
    return "OK (Groq Llama 3.3 responding)";
  });

  // 4. DeepSeek API
  await testApi("DeepSeek API", async () => {
    const key = process.env.DEEPSEEK_API_KEY || "sk-62de4a573994406583eb4b3fbcaf0a75";
    const res = await httpPost("https://api.deepseek.com/chat/completions", {
      "Authorization": `Bearer ${key}`
    }, {
      model: "deepseek-chat",
      messages: [{ role: "user", content: "Hi" }]
    });
    return "OK (DeepSeek Chat responding)";
  });

  // 5. Cloudflare Workers AI API Token
  await testApi("Cloudflare API Token", async () => {
    const token = "cfut_IJpgncd1qOhocrmhQmVeI81xWhrCZ96cDG47K177d802bdbd";
    const res = await httpGet("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      "Authorization": `Bearer ${token}`
    });
    return "OK (Cloudflare Token Verified: " + res.body.substring(0, 60) + ")";
  });

  // 6. CarAPI
  await testApi("CarAPI (carapi.app)", async () => {
    const token = "0d94c8da-4995-4c36-932e-62743813a911";
    const secret = "81f2147368fc1d5c35f801edb4d1bab5";
    const res = await httpPost("https://carapi.app/api/auth/login", {}, {
      api_token: token,
      api_secret: secret
    });
    return "OK (CarAPI Login successful)";
  });

  // 7. SearchRouter API
  await testApi("SearchRouter API", async () => {
    const key = process.env.SEARCH_ROUTER_API_KEY || "sr_0781cc375fdec5fe58de248c416bdbca04b9c8618eaa8e41";
    const res = await httpPost("https://searchrouter.ai/api/v1/search", {
      "Authorization": `Bearer ${key}`
    }, {
      query: "Toyota Camry"
    });
    return "OK (SearchRouter responding)";
  });

  // 8. NHTSA VIN API
  await testApi("NHTSA VIN API", async () => {
    const res = await httpGet("https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/1HGCR2F83HA000000?format=json");
    return "OK (NHTSA Free VIN API responding)";
  });

  console.log("\n=================================================");
})();
