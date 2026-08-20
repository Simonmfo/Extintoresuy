const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config();

// Use SERVICE_ROLE_KEY if available (for RLS bypass), fallback to ANON_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(
    process.env.SUPABASE_URL,
    supabaseKey,
    {
        realtime: {
            transport: ws,
        },
        auth: {
            persistSession: false
        }
    }
);

module.exports = { supabase };
