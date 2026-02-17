// Get CHECK constraints on keywords table via Supabase REST API
const https = require('https');
require('dotenv').config({ path: './infin8content/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const query = `
  SELECT 
    conname as constraint_name,
    consrc as check_clause
  FROM pg_constraint 
  WHERE conrelid = 'public.keywords'::regclass 
    AND contype = 'c'
  ORDER BY conname;
`;

const url = `${supabaseUrl}/rest/v1/rpc/get_constraints`;

const postData = JSON.stringify({ sql_query: query });

const options = {
  hostname: new URL(supabaseUrl).hostname,
  path: '/rest/v1/rpc/exec_sql',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    'apikey': serviceKey
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('CHECK constraints on keywords table:');
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(postData);
req.end();
