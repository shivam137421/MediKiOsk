const apiKey = process.env.GEMINI_API_KEY || '';

async function testAuthMethods() {
  if (!apiKey) {
    console.log('No GEMINI_API_KEY set in env');
    return;
  }
  console.log('Testing Gemini API Authentication with Key...');
}

testAuthMethods();
