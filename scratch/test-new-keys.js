import https from "node:https";

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
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout 10s')); });
    req.write(bodyStr);
    req.end();
  });
}

(async () => {
  console.log("================ TESTING NEW KEYS ================\n");

  // 1. Test New Gemini Key
  try {
    const newGeminiKey = "AQ.Ab8RN6LPP02KWpHLCqLW1-UoVYJAmedebRUdmYQhLgDvo9D2aA";
    const res = await httpPost(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${newGeminiKey}`, {}, {
      contents: [{ parts: [{ text: "Hello" }] }]
    });
    console.log("[PASS] New Google AI Studio (Gemini) Key: OK! Status", res.status);
  } catch (err) {
    console.log("[FAIL] New Google AI Studio (Gemini) Key Error:", err.message);
  }

  // 2. Test New OpenRouter Key
  try {
    const newOpenRouterKey = "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";
    const res = await httpPost("https://openrouter.ai/api/v1/chat/completions", {
      "Authorization": `Bearer ${newOpenRouterKey}`
    }, {
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: "Hi" }]
    });
    console.log("[PASS] New OpenRouter Key: OK! Status", res.status);
  } catch (err) {
    console.log("[FAIL] New OpenRouter Key Error:", err.message);
  }

  console.log("\n=================================================");
})();
