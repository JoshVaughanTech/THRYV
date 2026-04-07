import { readFileSync } from 'fs';

const url = 'https://rmpoyppbahwcqfpfrpnz.supabase.co';
const serviceKey = readFileSync('.env.local', 'utf8')
  .split('\n')
  .find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='))
  ?.split('=').slice(1).join('=')
  ?.trim();

const file = process.argv[2];
if (!file) { console.error('Usage: node run_sql.mjs <sql_file>'); process.exit(1); }

const sql = readFileSync(file, 'utf8');
console.log(`Running ${file} (${sql.length} chars)...`);

// Step 1: Create a temporary exec function
const createFn = `
CREATE OR REPLACE FUNCTION public._run_sql(q text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN EXECUTE q; RETURN '{"ok":true}'::json;
EXCEPTION WHEN OTHERS THEN RETURN json_build_object('error', SQLERRM);
END; $$;
`;

let res = await fetch(`${url}/rest/v1/rpc/_run_sql`, {
  method: 'POST',
  headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
  body: JSON.stringify({ q: createFn }),
});

if (!res.ok) {
  // Function doesn't exist yet - create it by splitting into a bootstrap
  // Use PostgREST's ability to call functions - we need to create ours first
  // The only way is to have an existing function or use pg wire protocol

  // Try: create the function by calling it as part of a DO block through an existing RPC
  // Workaround: use the anon key to insert into a table that has a trigger...
  // None of these work. Let's try the Supabase SQL API (v2)

  res = await fetch(`${url}/sql`, {
    method: 'POST',
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: createFn }),
  });

  if (!res.ok) {
    // Try the management API format
    res = await fetch(`${url}/sql`, {
      method: 'POST',
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'text/plain' },
      body: createFn,
    });
  }

  if (!res.ok) {
    const text = await res.text();
    console.error('Failed to create helper function:', res.status, text);
    console.error('\nPlease run the SQL manually in the Supabase Dashboard SQL Editor.');
    process.exit(1);
  }

  console.log('Helper function created.');
  // Reload schema cache
  await new Promise(r => setTimeout(r, 1000));
}

// Step 2: Run the actual SQL
res = await fetch(`${url}/rest/v1/rpc/_run_sql`, {
  method: 'POST',
  headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ q: sql }),
});

const result = await res.text();
console.log('Result:', result);

if (result.includes('error')) {
  console.error('Migration had errors. Check output above.');
} else {
  console.log('Migration successful!');
}

// Step 3: Clean up helper function
await fetch(`${url}/rest/v1/rpc/_run_sql`, {
  method: 'POST',
  headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ q: 'DROP FUNCTION IF EXISTS public._run_sql(text);' }),
});

console.log('Done.');
