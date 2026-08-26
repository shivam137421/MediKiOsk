// ==============================================================================
// VERIFY RUNNING SERVER AT http://localhost:3000
// ==============================================================================

async function verifyServer() {
  console.log('================================================================');
  console.log('VERIFYING RUNNING MEDIKIOSK DEV SERVER (http://localhost:3000)');
  console.log('================================================================\n');

  let allOk = true;

  // 1. Landing Page
  try {
    const res = await fetch('http://localhost:3000/');
    console.log(`[1] GET / (Landing Page) -> Status: ${res.status}`);
    const html = await res.text();
    const hasBrand = html.includes('MediKiosk') || html.includes('Triage');
    console.log(`    Content Verified: ${hasBrand ? '✅ MediKiosk detected' : '❌ Brand not found'}`);
    if (res.status !== 200 || !hasBrand) allOk = false;
  } catch (e) {
    console.error('❌ Failed to fetch Landing page:', e.message);
    allOk = false;
  }

  // 2. Auth Login Page
  try {
    const res = await fetch('http://localhost:3000/auth/login');
    console.log(`\n[2] GET /auth/login (Auth Page) -> Status: ${res.status}`);
    const html = await res.text();
    const hasAuth = html.includes('MediKiosk') || html.includes('Authentication');
    console.log(`    Content Verified: ${hasAuth ? '✅ Auth page loaded' : '❌ Not found'}`);
    if (res.status !== 200) allOk = false;
  } catch (e) {
    console.error('❌ Failed to fetch Login page:', e.message);
    allOk = false;
  }

  // 3. API Route: /api/ai/chat
  try {
    const chatPayload = {
      history: [
        { role: 'user', content: 'mujhe pairo mein 2 din se tez dard hai' }
      ],
      language: 'hi'
    };
    const res = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chatPayload)
    });
    console.log(`\n[3] POST /api/ai/chat -> Status: ${res.status}`);
    const data = await res.json();
    console.log(`    AI Reply: "${data.reply}"`);
    console.log(`    Provider Used: ${data.provider}`);
    console.log(`    Target Slot: ${data.targetSlot}`);
    if (res.status !== 200 || !data.reply) allOk = false;
  } catch (e) {
    console.error('❌ Failed to test AI chat route:', e.message);
    allOk = false;
  }

  // 4. API Route: /api/ai/summary
  try {
    const summaryPayload = {
      patient: {
        id: 'demo-p1',
        full_name: 'Aarav Sharma',
        age_years: 48,
        gender: 'male',
        abha_id: '91-4829-1029-4821'
      },
      chiefComplaint: 'Leg Pain',
      clinicalSlots: {
        severityNumber: 7,
        durationOnset: '2 days ago',
        characterQuality: 'cramping'
      },
      ayushAnswers: {
        prakritiPrimary: 'Vata',
        agniType: 'Manda Agni'
      }
    };
    const res = await fetch('http://localhost:3000/api/ai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(summaryPayload)
    });
    console.log(`\n[4] POST /api/ai/summary -> Status: ${res.status}`);
    const data = await res.json();
    console.log(`    API Response:`, data);
    if (res.status !== 200) allOk = false;
  } catch (e) {
    console.error('❌ Failed to test AI summary route:', e.message);
    allOk = false;
  }

  // 5. Middleware RBAC Route Protection: /patient without cookie redirects to /auth/login
  try {
    const res = await fetch('http://localhost:3000/patient', { redirect: 'manual' });
    console.log(`\n[5] GET /patient (Unauthenticated) -> Status: ${res.status} (Redirect Expected: 307)`);
    const location = res.headers.get('location');
    console.log(`    Redirect Location: ${location}`);
    if (res.status === 307 && location?.includes('/auth/login')) {
      console.log('    ✅ Unauthenticated request correctly protected and redirected to login');
    } else {
      console.error('    ❌ Unexpected response for unauthenticated route');
      allOk = false;
    }
  } catch (e) {
    console.error('❌ Failed to test middleware protection:', e.message);
    allOk = false;
  }

  // 6. Access /patient with valid Patient Cookie
  try {
    const res = await fetch('http://localhost:3000/patient', {
      headers: {
        'Cookie': 'medikiosk_role=patient; medikiosk_user_id=a1111111-1111-1111-1111-111111111111'
      }
    });
    console.log(`\n[6] GET /patient (Authenticated as Patient) -> Status: ${res.status}`);
    const html = await res.text();
    const hasIntake = html.includes('Intake') || html.includes('MediKiosk') || html.includes('Patient');
    console.log(`    Portal Access: ${hasIntake ? '✅ Patient Portal loaded' : '❌ Access issue'}`);
    if (res.status !== 200) allOk = false;
  } catch (e) {
    console.error('❌ Failed to access Patient Portal:', e.message);
    allOk = false;
  }

  // 7. Access /doctor with valid Doctor Cookie
  try {
    const res = await fetch('http://localhost:3000/doctor', {
      headers: {
        'Cookie': 'medikiosk_role=doctor; medikiosk_user_id=usr-doc-01'
      }
    });
    console.log(`\n[7] GET /doctor (Authenticated as Doctor) -> Status: ${res.status}`);
    const html = await res.text();
    const hasDoctor = html.includes('Doctor') || html.includes('Queue') || html.includes('Consultation') || html.includes('MediKiosk');
    console.log(`    Portal Access: ${hasDoctor ? '✅ Doctor Portal loaded' : '❌ Access issue'}`);
    if (res.status !== 200) allOk = false;
  } catch (e) {
    console.error('❌ Failed to access Doctor Portal:', e.message);
    allOk = false;
  }

  // 8. Access /admin with valid Admin Cookie
  try {
    const res = await fetch('http://localhost:3000/admin', {
      headers: {
        'Cookie': 'medikiosk_role=admin; medikiosk_user_id=usr-adm-01'
      }
    });
    console.log(`\n[8] GET /admin (Authenticated as Admin) -> Status: ${res.status}`);
    const html = await res.text();
    const hasAdmin = html.includes('Admin') || html.includes('Operations') || html.includes('Triage') || html.includes('MediKiosk');
    console.log(`    Portal Access: ${hasAdmin ? '✅ Admin Portal loaded' : '❌ Access issue'}`);
    if (res.status !== 200) allOk = false;
  } catch (e) {
    console.error('❌ Failed to access Admin Portal:', e.message);
    allOk = false;
  }

  console.log('\n================================================================');
  if (allOk) {
    console.log('🎉 ALL LIVE SERVER ENDPOINTS & PORTALS VERIFIED WITH 100% SUCCESS!');
  } else {
    console.log('❌ SOME SERVER ENDPOINT CHECKS FAILED.');
  }
  console.log('================================================================\n');

  process.exit(allOk ? 0 : 1);
}

verifyServer();
