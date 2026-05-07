const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
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
