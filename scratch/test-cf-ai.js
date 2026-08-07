import https from "node:https";

const accountId = "00d4bbbbb025227a441c7b8838250499";
const token = "cfut_IJpgncd1qOhocrmhQmVeI81xWhrCZ96cDG47K177d802bdbd";

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
  try {
    console.log("Testing Cloudflare Workers AI run...");
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
    const res = await httpPost(url, {
      "Authorization": `Bearer ${token}`
    }, {
      messages: [{ role: "user", content: "Say hello in Arabic" }]
    });
    console.log("Response Status:", res.status);
    console.log("Response Body:", res.body);
  } catch (err) {
    console.error("Cloudflare AI Run Error:", err.message);
  }
})();
