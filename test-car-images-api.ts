import https from "https";

async function testCarImagesApi() {
  const apiKey = "ci_7dfc9e4e63b36ad66fdf58f0b451f1a1527591f2542380a044322d38";
  const apiSecret = "7e22a50a1545db05c6dd1939825bbb21737200a3af56a4821f70408f3f618aad";

  const urlsToTest = [
    { url: `https://carimagesapi.com/api/v1/cars/images?make=Toyota&model=Camry&year=2023`, headers: { "Authorization": `Bearer ${apiKey}`, "X-API-KEY": apiKey, "api-key": apiKey } },
    { url: `https://api.carimagesapi.com/v1/images?make=Toyota&model=Camry&year=2023`, headers: { "Authorization": `Bearer ${apiKey}`, "api-key": apiKey } },
    { url: `https://carimagesapi.com/api/images?make=Toyota&model=Camry&year=2023&api_key=${apiKey}` },
  ];

  for (const item of urlsToTest) {
    console.log(`Testing URL: ${item.url}`);
    try {
      const res = await fetch(item.url, { headers: item.headers || {} });
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Body (first 300 chars):`, text.substring(0, 300));
    } catch (err: any) {
      console.log(`Fetch error for ${item.url}:`, err.message);
    }
  }
}

testCarImagesApi();
