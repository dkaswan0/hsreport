async function testModel(modelName) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  console.log(`Testing model: ${modelName}...`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Say hello" }] }]
      })
    });
    console.log(`Model ${modelName} status:`, res.status);
    const data = await res.json();
    if (res.ok) {
      console.log("Success! Response:", data.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.log("Error response:", JSON.stringify(data));
    }
  } catch (err) {
    console.log(`Error testing ${modelName}:`, err.message);
  }
}

async function run() {
  await testModel("gemini-1.5-flash");
  await testModel("gemini-1.5-flash-8b");
  await testModel("gemini-1.5-flash-latest");
  await testModel("gemini-3.5-flash");
}

run();
