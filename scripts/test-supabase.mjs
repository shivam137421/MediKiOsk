import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mwnbovfyttvmtpccjxdn.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13bmJvdmZ5dHR2bXRwY2NqeGRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzQ3NTIzMCwiZXhwIjoyMTAzMDUxMjMwfQ.rOBLdZC8ChS0pvIwQp7-JNEiiPfeCp4dXeJUQBekT5A';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testConnection() {
  console.log('Testing connection to Supabase project:', supabaseUrl);
  try {
    const { data, error } = await supabase.from('patients').select('*').limit(5);
    if (error) {
      console.log('Query result / error:', error.message, error.code);
    } else {
      console.log('Connection successful! Patients found:', data?.length);
    }
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

testConnection();
