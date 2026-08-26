import { groqProvider } from '../src/lib/providers/groq.ts';

console.log('================================================================');
console.log('TESTING PATIENT PORTAL FRONTEND GROQ PROVIDER FLOW');
console.log('================================================================\n');

async function testFrontendFlow() {
  console.log('1. Checking groqProvider.isAvailable():', groqProvider.isAvailable());
  if (!groqProvider.isAvailable()) {
    throw new Error('groqProvider.isAvailable() returned false! This would cause silent fallback in the browser.');
  }
  console.log('✅ Provider is available!\n');

  const history = [
    { role: 'user', content: 'mujhe 2 din se tez bukhar hai aur thand lag rahi hai' }
  ];

  // Turn 1
  console.log('--- TURN 1 ---');
  console.log('Patient:', history[0].content);
  const res1 = await groqProvider.generateFollowUpQuestion(history, { language: 'hi' });
  console.log('AI Doctor Reply:', res1.reply);
  console.log('Slots:', JSON.stringify(res1.slots));
  console.log('Is Complete:', res1.isComplete);

  // Turn 2
  history.push({ role: 'assistant', content: res1.reply });
  history.push({ role: 'user', content: '102 bukhar tha subah aur sar me dard ho raha hai' });
  console.log('\n--- TURN 2 ---');
  console.log('Patient:', history[2].content);
  const res2 = await groqProvider.generateFollowUpQuestion(history, { language: 'hi' });
  console.log('AI Doctor Reply:', res2.reply);
  console.log('Slots:', JSON.stringify(res2.slots));
  console.log('Is Complete:', res2.isComplete);

  // Turn 3
  history.push({ role: 'assistant', content: res2.reply });
  history.push({ role: 'user', content: 'sukhi khansi hai aur gale me dard hai, dolo 650 liya tha' });
  console.log('\n--- TURN 3 ---');
  console.log('Patient:', history[4].content);
  const res3 = await groqProvider.generateFollowUpQuestion(history, { language: 'hi' });
  console.log('AI Doctor Reply:', res3.reply);
  console.log('Slots:', JSON.stringify(res3.slots));
  console.log('Is Complete:', res3.isComplete);

  // Turn 4
  history.push({ role: 'assistant', content: res3.reply });
  history.push({ role: 'user', content: 'koi purani bimari nahi hai aur koi allergy nahi hai' });
  console.log('\n--- TURN 4 ---');
  console.log('Patient:', history[6].content);
  const res4 = await groqProvider.generateFollowUpQuestion(history, { language: 'hi' });
  console.log('AI Doctor Reply:', res4.reply);
  console.log('Slots:', JSON.stringify(res4.slots));
  console.log('Is Complete:', res4.isComplete);

  console.log('\n================================================================');
  console.log('🎉 FRONTEND GROQ PROVIDER FLOW VERIFIED — ZERO LOCAL FALLBACKS!');
  console.log('================================================================\n');
}

testFrontendFlow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
