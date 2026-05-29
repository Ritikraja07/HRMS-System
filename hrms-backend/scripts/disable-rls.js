require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL; // e.g. https://xxxx.supabase.co
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Extract the project ref from SUPABASE_URL (https://PROJECTREF.supabase.co)
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

const sql = `
  ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
  ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
  ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
`;

const body = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Length': Buffer.byteLength(body),
  },
};

console.log(`🔧 Disabling RLS on project_members, projects, messages...`);
console.log(`   Project ref: ${projectRef}`);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ RLS disabled successfully on all tables!');
    } else {
      console.log(`❌ HTTP ${res.statusCode}: ${data}`);
      console.log('\nFall back: Please run this SQL manually in your Supabase SQL Editor:');
      console.log('  ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;');
      console.log('  ALTER TABLE projects DISABLE ROW LEVEL SECURITY;');
      console.log('  ALTER TABLE messages DISABLE ROW LEVEL SECURITY;');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
  console.log('\nPlease run this SQL manually in your Supabase SQL Editor:');
  console.log('  ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;');
  console.log('  ALTER TABLE projects DISABLE ROW LEVEL SECURITY;');
  console.log('  ALTER TABLE messages DISABLE ROW LEVEL SECURITY;');
});

req.write(body);
req.end();
