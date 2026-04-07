// Temporary script to run SQL migrations via Supabase service role
// Usage: node run_migration.mjs <sql_file>

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const url = 'https://rmpoyppbahwcqfpfrpnz.supabase.co';
const serviceKey = readFileSync('.env.local', 'utf8')
  .split('\n')
  .find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='))
  ?.split('=').slice(1).join('=')
  ?.trim();

if (!serviceKey) {
  console.error('Could not find SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false, autoRefreshToken: false },
});

const file = process.argv[2];
if (!file) {
  console.error('Usage: node run_migration.mjs <sql_file>');
  process.exit(1);
}

const sql = readFileSync(file, 'utf8');
console.log(`Running ${file}...`);

// First create a temporary exec_sql function
const createFn = `
CREATE OR REPLACE FUNCTION public._tmp_exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
BEGIN
  EXECUTE query;
END;
$fn$;
`;

const { error: fnErr } = await supabase.rpc('_tmp_exec_sql', { query: 'SELECT 1' }).catch(() => ({}));

// If the function doesn't exist yet, we need to create it via a different approach
// Let's split the SQL into statements and run them individually via RPC
// But first we need the function... chicken-and-egg.

// Alternative: use the Supabase HTTP API to create the function
const createRes = await fetch(`${url}/rest/v1/rpc/_tmp_exec_sql`, {
  method: 'POST',
  headers: {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: 'SELECT 1' }),
});

if (createRes.status === 404 || (await createRes.text()).includes('PGRST202')) {
  // Function doesn't exist - we can't run raw SQL without it
  // Try using the pg protocol directly through fetch
  console.log('No exec_sql function found. Attempting to create one...');

  // We'll use the SQL API endpoint if available
  const sqlRes = await fetch(`${url}/pg`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: createFn }),
  });

  if (!sqlRes.ok) {
    console.error('Cannot run raw SQL. Please run the migration manually in the Supabase SQL Editor.');
    console.error('File:', file);
    process.exit(1);
  }
}

// Try running the SQL
const { error } = await supabase.rpc('_tmp_exec_sql', { query: sql });
if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

// Clean up
await supabase.rpc('_tmp_exec_sql', { query: 'DROP FUNCTION IF EXISTS public._tmp_exec_sql(text);' });

console.log('Done!');
