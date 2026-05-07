const fs = require('fs-extra');
const path = require('path');
const JSZip = require('jszip');

class SupabaseStore {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    async sessionExists(options) {
        const { data, error } = await this.supabase
            .from('bot_sessions')
            .select('id')
            .eq('id', options.session)
            .single();
        
        if (data) {
            console.log('✅ Sesión encontrada en Supabase. Recuperando...');
        } else {
            console.log('ℹ️ No se encontró sesión previa. Se requiere nuevo QR.');
        }
        return !!data;
    }

    async save(options) {
        const sessionPath = path.join(process.cwd(), `.wwebjs_auth/session-${options.session}`);
        if (!await fs.pathExists(sessionPath)) return;

        const zip = new JSZip();
        await this._addFolderToZip(zip, sessionPath, '');
        
        const content = await zip.generateAsync({ type: 'base64' });

        const { error } = await this.supabase
            .from('bot_sessions')
            .upsert({
                id: options.session,
                data: { zip: content },
                updated_at: new Date().toISOString()
            });

        if (!error) {
            console.log('✅ Sesión guardada en Supabase correctamente.');
        } else {
            console.error('❌ Error al guardar sesión en Supabase:', error);
        }

        // Clear memory
        zip.files = {}; 
    }

    async extract(options) {
        const { data, error } = await this.supabase
            .from('bot_sessions')
            .select('data')
            .eq('id', options.session)
            .single();

        if (error || !data) {
            console.error('Error fetching session from Supabase:', error);
            return;
        }

        const sessionPath = path.join(process.cwd(), `.wwebjs_auth/session-${options.session}`);
        await fs.ensureDir(sessionPath);

        const zip = await JSZip.loadAsync(data.data.zip, { base64: true });
        
        console.log(`📦 Extrayendo ${Object.keys(zip.files).length} archivos de sesión...`);
        for (const [relativePath, file] of Object.entries(zip.files)) {
            if (file.dir) {
                await fs.ensureDir(path.join(sessionPath, relativePath));
            } else {
                const content = await file.async('nodebuffer');
                await fs.outputFile(path.join(sessionPath, relativePath), content);
            }
        }
        console.log('✅ Sesión extraída correctamente.');
    }

    async delete(options) {
        const { error } = await this.supabase
            .from('bot_sessions')
            .delete()
            .eq('id', options.session);

        if (error) {
            console.error('Error deleting session from Supabase:', error);
        }
    }

    async _addFolderToZip(zip, folderPath, zipPath) {
        const files = await fs.readdir(folderPath);
        for (const file of files) {
            const filePath = path.join(folderPath, file);
            const relativeZipPath = path.join(zipPath, file);
            const stats = await fs.stat(filePath);

            if (stats.isDirectory()) {
                const folder = zip.folder(relativeZipPath);
                await this._addFolderToZip(folder, filePath, '');
            } else {
                const content = await fs.readFile(filePath);
                zip.file(relativeZipPath, content);
            }
        }
    }
}

module.exports = SupabaseStore;
