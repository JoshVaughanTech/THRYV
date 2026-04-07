import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const url = 'https://rmpoyppbahwcqfpfrpnz.supabase.co';
const serviceKey = readFileSync('.env.local', 'utf8')
  .split('\n')
  .find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='))
  ?.split('=').slice(1).join('=')
  ?.trim();

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const demoUsers = [
  { email: 'sarah.chen@demo.thryv.app', full_name: 'Sarah Chen', password: 'DemoPass123!' },
  { email: 'ali.kapoor@demo.thryv.app', full_name: 'Ali Kapoor', password: 'DemoPass123!' },
  { email: 'jake.morrison@demo.thryv.app', full_name: 'Jake Morrison', password: 'DemoPass123!' },
  { email: 'priya.nair@demo.thryv.app', full_name: 'Priya Nair', password: 'DemoPass123!' },
  { email: 'jake.reynolds@demo.thryv.app', full_name: 'Jake Reynolds', password: 'DemoPass123!' },
  { email: 'emma.watson@demo.thryv.app', full_name: 'Emma Watson', password: 'DemoPass123!' },
  { email: 'marcus.johnson@demo.thryv.app', full_name: 'Marcus Johnson', password: 'DemoPass123!' },
  { email: 'sophia.martinez@demo.thryv.app', full_name: 'Sophia Martinez', password: 'DemoPass123!' },
  { email: 'ryan.park@demo.thryv.app', full_name: 'Ryan Park', password: 'DemoPass123!' },
];

console.log('Creating demo auth users...\n');

const ids = {};
for (const u of demoUsers) {
  // Check if already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', u.email)
    .single();

  if (existing) {
    console.log(`  ✓ ${u.full_name} already exists (${existing.id})`);
    ids[u.email] = existing.id;
    continue;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { full_name: u.full_name },
  });

  if (error) {
    console.error(`  ✗ ${u.full_name}: ${error.message}`);
  } else {
    console.log(`  ✓ ${u.full_name} created (${data.user.id})`);
    ids[u.email] = data.user.id;
  }
}

// Output the IDs for the seed SQL
console.log('\n--- User IDs ---');
for (const [email, id] of Object.entries(ids)) {
  console.log(`${email}: ${id}`);
}

console.log('\nDone! Now run the seed_demo_v2.sql to populate data.');
