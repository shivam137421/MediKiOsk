import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mwnbovfyttvmtpccjxdn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bmJvdmZ5dHR2bXRwY2NqeGRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQ3NTIzMCwiZXhwIjoyMTAzMDUxMjMwfQ.rOBLdZC8ChS0pvIwQp7-JNEiiPfeCp4dXeJUQBekT5A';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ALL_TABLES = [
  'profiles',
  'departments',
  'kiosks',
  'patients',
  'encounters',
  'consents',
  'interview_sessions',
  'interview_answers',
  'documents',
  'document_extractions',
  'medications',
  'allergies',
  'investigations',
  'timeline_events',
  'triage_alerts',
  'ai_summaries',
  'ai_suggestions',
  'ayush_assessments',
  'audit_logs',
  'system_settings'
];

async function inspectDatabase() {
  console.log('================================================================');
  console.log('SUPABASE LIVE DATABASE INSPECTION REPORT');
  console.log('Project URL:', supabaseUrl);
  console.log('Timestamp:', new Date().toISOString());
  console.log('================================================================\n');

  const report = {
    existingTables: [],
    missingTables: [],
    tableCounts: {},
    tableErrors: {},
    sampleRecords: {},
    canWriteRead: false
  };

  for (const tableName of ALL_TABLES) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: false })
        .limit(3);

      if (error) {
        report.missingTables.push(tableName);
        report.tableErrors[tableName] = error.message;
      } else {
        report.existingTables.push(tableName);
        report.tableCounts[tableName] = data ? data.length : 0;
        if (data && data.length > 0) {
          report.sampleRecords[tableName] = data;
        }
      }
    } catch (err) {
      report.missingTables.push(tableName);
      report.tableErrors[tableName] = err.message;
    }
  }

  // Test Write & Read Capability on audit_logs
  try {
    const testLog = {
      id: '04444444-4444-4444-4444-444444444444',
      actor_role: 'system',
      action: 'SYSTEM_CONNECTIVITY_TEST',
      details: { verifiedAt: new Date().toISOString() }
    };
    const { data: insertData, error: insertError } = await supabase
      .from('audit_logs')
      .upsert(testLog)
      .select()
      .single();

    if (!insertError && insertData) {
      report.canWriteRead = true;
    } else {
      report.writeReadError = insertError?.message;
    }
  } catch (err) {
    report.writeReadError = err.message;
  }

  console.log(JSON.stringify(report, null, 2));
}

inspectDatabase();
