import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mwnbovfyttvmtpccjxdn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bmJvdmZ5dHR2bXRwY2NqeGRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQ3NTIzMCwiZXhwIjoyMTAzMDUxMjMwfQ.rOBLdZC8ChS0pvIwQp7-JNEiiPfeCp4dXeJUQBekT5A';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testRpc() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT 1;' });
    console.log('RPC exec_sql result:', data, error?.message);
  } catch (err) {
    console.log('RPC failed:', err.message);
  }
}

testRpc();
