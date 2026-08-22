async function testCarApi() {
  const token = "ci_7dfc9e4e63b36ad66fdf58f0b451f1a1527591f2542380a044322d38";
  const secret = "7e22a50a1545db05c6dd1939825bbb21737200a3af56a4821f70408f3f618aad";

  console.log("Testing CarAPI Auth with provided keys...");
  try {
    const res = await fetch("https://carapi.app/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ api_token: token, api_secret: secret }),
    });

    console.log("Login HTTP Status:", res.status);
    const text = await res.text();
    console.log("Login Response Body:", text);

    if (res.ok) {
      const jwt = text.replace(/^"|"$/g, "").trim();
      console.log("JWT acquired! Testing VIN decode with sample VIN...");
      const vinRes = await fetch("https://carapi.app/api/vin/1G1YY22U565100001", {
        headers: { Authorization: `Bearer ${jwt}`, Accept: "application/json" },
      });
      console.log("VIN Decode HTTP Status:", vinRes.status);
      const vinData = await vinRes.json();
      console.log("VIN Decode Result:", JSON.stringify(vinData, null, 2));
    }
  } catch (err: any) {
    console.error("Test Error:", err.message);
  }
}

testCarApi();
