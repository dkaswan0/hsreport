import https from "https";

async function testWithHttps() {
  const token = "ci_7dfc9e4e63b36ad66fdf58f0b451f1a1527591f2542380a044322d38";
  const secret = "7e22a50a1545db05c6dd1939825bbb21737200a3af56a4821f70408f3f618aad";

  const data = JSON.stringify({ api_token: token, api_secret: secret });

  const options = {
    hostname: "carapi.app",
    port: 443,
    path: "/api/auth/login",
    method: "POST",
    agent: new https.Agent({ rejectUnauthorized: false }),
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Content-Length": data.length,
    },
    timeout: 10000,
  };

  const req = https.request(options, (res) => {
    console.log("Status Code:", res.statusCode);
    let body = "";
    res.on("data", (chunk) => body += chunk);
    res.on("end", () => {
      console.log("Response:", body);
    });
  });

  req.on("error", (e) => {
    console.error("HTTPS Error:", e.message);
  });

  req.write(data);
  req.end();
}

testWithHttps();
