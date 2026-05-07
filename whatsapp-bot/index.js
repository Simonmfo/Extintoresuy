const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const { supabase } = require('./supabase');
const SupabaseStore = require('./SupabaseStore');
const cron = require('node-cron');
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Express setup to keep the service alive
let latestQR = null;

app.get('/', (req, res) => res.send('ExtintoresUY WhatsApp Bot Service is running.'));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

// Initialize WhatsApp Client with Supabase Remote Auth
const store = new SupabaseStore(supabase);
const client = new Client({
    authStrategy: new RemoteAuth({
        store: store,
        backupSyncIntervalMs: 300000, // Sync every 5 minutes
        session: 'extintoresuy-session'
    }),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
        headless: true,
        handleSIGINT: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-canvas-aa',
            '--disable-2d-canvas-clip-aa',
            '--disable-gl-drawing-for-tests',
            '--font-render-hinting=none'
        ],
    }
});

client.on('qr', async (qr) => {
    console.log('QR RECEIVED');
    qrcodeTerminal.generate(qr, { small: true });
    
    // Save QR to DB for the admin panel to see
    await supabase
        .from('bot_status')
        .upsert({ 
            id: 'whatsapp-bot', 
            qr: qr, 
            status: 'waiting_qr',
            last_update: new Date().toISOString() 
        });
});

client.on('ready', async () => {
    console.log('WhatsApp Client is ready!');
    await supabase
        .from('bot_status')
        .upsert({ 
            id: 'whatsapp-bot', 
            qr: null, 
            status: 'ready',
            last_update: new Date().toISOString() 
        });
});

client.on('remote_session_saved', () => {
    console.log('Session saved to Supabase!');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.initialize();

// Cron Job: Every day at 09:00 AM
cron.schedule('0 9 * * *', async () => {
    console.log('Running daily expiration check...');
    await checkExpirations();
});

async function checkExpirations() {
    try {
        const today = new Date();
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + 30);
        
        const targetDateStr = targetDate.toISOString().split('T')[0];
        console.log(`Checking for assets expiring on: ${targetDateStr}`);

        // Fetch assets expiring in 30 days with client info
        const { data: assets, error } = await supabase
            .from('assets')
            .select('*, clients(*)')
            .eq('expiration_date', targetDateStr);

        if (error) throw error;
        if (!assets || assets.length === 0) {
            console.log('No assets expiring in 30 days.');
            return;
        }

        console.log(`Found ${assets.length} assets expiring soon.`);

        for (const asset of assets) {
            const clientInfo = asset.clients;
            if (clientInfo && clientInfo.phone) {
                await sendNotification(clientInfo.phone, clientInfo.name, asset);
            }
        }
    } catch (err) {
        console.error('Error in checkExpirations:', err);
    }
}

async function sendNotification(phone, clientName, asset) {
    try {
        // Format phone number (assuming Uruguay +598)
        let formattedPhone = phone.replace(/\s+/g, '').replace('+', '');
        if (formattedPhone.startsWith('0')) formattedPhone = '598' + formattedPhone.substring(1);
        if (!formattedPhone.startsWith('598')) formattedPhone = '598' + formattedPhone;
        
        const chatId = `${formattedPhone}@c.us`;
        
        const message = `*AVISO DE VENCIMIENTO - ExtintoresUY*\n\n` +
            `Hola *${clientName}*,\n\n` +
            `Te informamos que tu equipo *${asset.name || 'Extintor'}* (${asset.type || ''}) ` +
            `con ubicación *${asset.description || 'N/D'}* está próximo a vencer el día *${asset.expiration_date}* (en 30 días).\n\n` +
            `Por favor, coordina una inspección o recarga para mantener la seguridad de tu establecimiento.\n\n` +
            `_Este es un mensaje automático de ExtintoresUY_`;

        await client.sendMessage(chatId, message);
        console.log(`Notification sent to ${clientName} (${phone}) for asset ${asset.id}`);
    } catch (err) {
        console.error(`Failed to send notification to ${phone}:`, err);
    }
}
