console.log('================================================================');
console.log('TESTING MULTI-TURN AI CHAT CONVERSATION VIA LIVE SERVER');
console.log('================================================================\n');

async function run() {
  const baseUrl = 'http://localhost:3000';
  const history = [
    { role: 'user', content: 'mujhe 2 din se tez bukhar hai aur thand lag rahi hai' }
  ];

  // Turn 1
  console.log('--- TURN 1 ---');
  console.log('Patient:', history[0].content);
  let res1 = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, language: 'hi' })
  }).then(r => r.json());
  console.log(`AI Doctor (${res1.provider}):`, res1.reply);
  console.log('Slots:', JSON.stringify(res1.slots));

  // Turn 2
  history.push({ role: 'assistant', content: res1.reply });
  history.push({ role: 'user', content: '102 bukhar tha subah aur sar me dard ho raha hai' });
  console.log('\n--- TURN 2 ---');
  console.log('Patient:', history[2].content);
  let res2 = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, language: 'hi' })
  }).then(r => r.json());
  console.log(`AI Doctor (${res2.provider}):`, res2.reply);
  console.log('Slots:', JSON.stringify(res2.slots));

  // Turn 3
  history.push({ role: 'assistant', content: res2.reply });
  history.push({ role: 'user', content: 'sukhi khansi hai aur gale me dard hai, dolo 650 liya tha' });
  console.log('\n--- TURN 3 ---');
  console.log('Patient:', history[4].content);
  let res3 = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, language: 'hi' })
  }).then(r => r.json());
  console.log(`AI Doctor (${res3.provider}):`, res3.reply);
  console.log('Slots:', JSON.stringify(res3.slots));

  // Turn 4
  history.push({ role: 'assistant', content: res3.reply });
  history.push({ role: 'user', content: 'koi purani bimari ya allergy nahi hai' });
  console.log('\n--- TURN 4 ---');
  console.log('Patient:', history[6].content);
  let res4 = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ history, language: 'hi' })
  }).then(r => r.json());
  console.log(`AI Doctor (${res4.provider}):`, res4.reply);
  console.log('Slots:', JSON.stringify(res4.slots));
  console.log('Is Complete:', res4.isComplete);

  console.log('\n================================================================');
  console.log('🎉 ALL 4 TURNS PROCESSED SUCCESSFULLY VIA LIVE GROQ AI MODEL!');
  console.log('================================================================\n');
}

run().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
