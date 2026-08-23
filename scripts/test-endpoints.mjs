const key = process.env.GEMINI_API_KEY || '';

async function testEndpoints() {
  if (!key) {
    console.log('No GEMINI_API_KEY provided in env');
    return;
  }
  const payload = JSON.stringify({
    contents: [{ parts: [{ text: 'Hello, reply with 1 word: "Working"' }] }]
  });

  const endpoints = [
    {
      name: 'v1beta / gemini-1.5-flash (x-goog-api-key)',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }
    },
    {
      name: 'v1 / gemini-1.5-flash (x-goog-api-key)',
      url: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }
    },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, { method: 'POST', headers: ep.headers, body: payload });
      const data = await res.json();
      console.log(`${ep.name} Status:`, res.status);
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

testEndpoints();
