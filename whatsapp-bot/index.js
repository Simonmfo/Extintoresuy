const { Client, RemoteAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const { supabase } = require('./supabase');
const SupabaseStore = require('./SupabaseStore');
const cron = require('node-cron');
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Express setup to keep the service alive
let latestQR = null;

app.get('/', (req, res) => res.send('Extintor.uy WhatsApp Bot Service is running.'));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

// Initialize WhatsApp Client with Remote Auth to persist session in Supabase
const store = new SupabaseStore(supabase);
const client = new Client({
    authStrategy: new RemoteAuth({
        clientId: 'extintoresuy-session',
        store: store,
        backupSyncIntervalMs: 60000 // Backup session every 60 seconds
    }),
    authTimeoutMs: 90000,
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
        headless: process.env.PUPPETEER_HEADLESS === 'false' ? false : true,
        handleSIGINT: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-canvas-aa',
            '--disable-2d-canvas-clip-aa',
            '--disable-gl-drawing-for-tests',
            '--font-render-hinting=none',
            '--js-flags="--max-old-space-size=512"' // Limit memory
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

client.on('loading_screen', (percent, message) => {
    console.log(`LOADING SCREEN: ${percent}% - ${message}`);
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED: Session is valid.');
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
    console.log('✅ Session successfully saved to Supabase!');
});

client.on('auth_failure', msg => {
    console.error('❌ AUTHENTICATION FAILURE:', msg);
});

// Realtime command listener
supabase
    .channel('bot-commands')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bot_commands' }, async (payload) => {
        const { id, command, payload: data } = payload.new;
        
        if (command === 'send_message') {
            console.log(`Processing command: send_message to ${data.phone}`);
            
            try {
                // Update to processing
                await supabase.from('bot_commands').update({ status: 'processing' }).eq('id', id);

                // Format phone
                let formattedPhone = data.phone.replace(/\s+/g, '').replace('+', '');
                if (formattedPhone.startsWith('0')) formattedPhone = '598' + formattedPhone.substring(1);
                if (!formattedPhone.startsWith('598')) formattedPhone = '598' + formattedPhone;
                const chatId = `${formattedPhone}@c.us`;

                await client.sendMessage(chatId, data.message);

                // Update to completed
                await supabase.from('bot_commands').update({ status: 'completed' }).eq('id', id);
                console.log('Command completed successfully');
            } catch (err) {
                console.error('Command failed:', err);
                await supabase.from('bot_commands').update({ 
                    status: 'failed', 
                    error: err.message 
                }).eq('id', id);
            }
        }
    })
    .subscribe();

client.initialize();

// Cron Job: Every day at 09:00 AM
cron.schedule('0 9 * * *', async () => {
    console.log('Running daily expiration check...');
    try {
        const targetDays = [30, 20, 15, 10, 5, 1];
        const now = new Date();
        
        for (const days of targetDays) {
            const targetDate = new Date();
            targetDate.setDate(now.getDate() + days);
            const dateStr = targetDate.toISOString().split('T')[0];

            console.log(`Checking for expirations on: ${dateStr} (${days} days from now)`);

            const { data: assets, error } = await supabase
                .from('assets')
                .select('*, clients(*)')
                .eq('expiration_date', dateStr);

            if (error) {
                console.error(`Error fetching assets for ${dateStr}:`, error);
                continue;
            }

            if (!assets || assets.length === 0) continue;

            console.log(`Found ${assets.length} assets expiring in ${days} days.`);

            for (const asset of assets) {
                const client = asset.clients;
                if (!client) continue;

                // Fetch factory profile to get its name and phone
                const { data: factory } = await supabase
                    .from('profiles')
                    .select('full_name, phone')
                    .eq('id', client.company_id)
                    .single();

                const factoryName = factory?.full_name || 'tu fábrica de recarga';
                const factoryPhone = factory?.phone || '';

                const clientMsg = `*VENCIMIENTO DE CARGA DE EXTINTOR*\n\nHola, te informamos que la carga de tu extintor está por vencer.\n\n*Detalles del equipo:*\n- Número/Matrícula: ${asset.matricula || asset.id}\n- Tipo: ${asset.type || asset.name || 'Extintor'}\n- Fábrica de recarga: ${factoryName}\n- Vencimiento: ${asset.expiration_date}\n\nPara recargar su extintor llame al ${factoryPhone || 'la fábrica de recarga'}`;

                // Send to Client
                if (client.phone) {
                    await sendWhatsApp(client.phone, clientMsg);
                    console.log(`Notification sent to client: ${client.name} (${client.phone})`);
                }

                // Send to Factory
                if (factoryPhone) {
                    const factoryMsg = `*ALERTA DE VENCIMIENTO DE CARGA*\n\nHola, te informamos que la carga de un extintor de tu cliente *${client.name}* está por vencer.\n\n*Detalles del equipo:*\n- Número/Matrícula: ${asset.matricula || asset.id}\n- Tipo: ${asset.type || asset.name || 'Extintor'}\n- Fábrica de recarga: ${factoryName}\n- Vencimiento: ${asset.expiration_date}\n- Teléfono Cliente: ${client.phone || 'No registrado'}\n\nPara recargar su extintor llame al ${factoryPhone || 'la fábrica de recarga'}`;
                    await sendWhatsApp(factoryPhone, factoryMsg);
                    console.log(`Notification sent to factory: ${factoryName} (${factoryPhone})`);
                }
            }
        }
    } catch (err) {
        console.error('Error in cron job:', err);
    }
}, {
    timezone: "America/Montevideo"
});

async function sendWhatsApp(phone, message) {
    try {
        let formattedPhone = phone.replace(/\s+/g, '').replace('+', '');
        if (formattedPhone.startsWith('0')) formattedPhone = '598' + formattedPhone.substring(1);
        if (!formattedPhone.startsWith('598')) formattedPhone = '598' + formattedPhone;
        const chatId = `${formattedPhone}@c.us`;
        await client.sendMessage(chatId, message);
    } catch (err) {
        console.error(`Failed to send message to ${phone}:`, err);
    }
}
