const fs = require('fs-extra');
const path = require('path');
const JSZip = require('jszip');

class SupabaseStore {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    async sessionExists(options) {
        const sessionId = options.clientId || options.session;
        const { data, error } = await this.supabase
            .from('bot_sessions')
            .select('id')
            .eq('id', sessionId)
            .single();
        
        if (data) {
            console.log('✅ Sesión encontrada en Supabase. Recuperando...');
        } else {
            console.log('ℹ️ No se encontró sesión previa. Se requiere nuevo QR.');
        }
        return !!data;
    }

    async save(options) {
        const sessionId = options.clientId || options.session;
        // The library creates folders with "RemoteAuth-" prefix in recent versions
        let sessionPath = path.join(process.cwd(), `.wwebjs_auth/RemoteAuth-${sessionId}`);
        
        if (!await fs.pathExists(sessionPath)) {
            // Fallback to the other common pattern
            sessionPath = path.join(process.cwd(), `.wwebjs_auth/session-${sessionId}`);
        }

        console.log(`💾 Intentando guardar sesión desde: ${sessionPath}`);
        if (!await fs.pathExists(sessionPath)) {
            console.error(`❌ No existe la carpeta de sesión en: ${sessionPath}`);
            return;
        }

        const zip = new JSZip();
        await this._addFolderToZip(zip, sessionPath, '');
        
        console.log(`💾 Comprimiendo sesión para subir a Supabase...`);
        const content = await zip.generateAsync({ type: 'base64', compression: 'STORE' });
        
        console.log(`🚀 Subiendo ${Math.round(content.length / 1024)}KB a Supabase...`);
        const { error } = await this.supabase
            .from('bot_sessions')
            .upsert({
                id: sessionId,
                data: { zip: content },
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error('❌ Error al guardar sesión en Supabase:', error);
        } else {
            console.log('✅ Sesión guardada exitosamente en Supabase.');
        }

        if (!error) {
            console.log('✅ Sesión guardada en Supabase correctamente.');
        } else {
            console.error('❌ Error al guardar sesión en Supabase:', error);
        }

        // Clear memory
        zip.files = {}; 
    }

    async extract(options) {
        const sessionId = options.clientId || options.session;
        const { data, error } = await this.supabase
            .from('bot_sessions')
            .select('data')
            .eq('id', sessionId)
            .single();

        if (error || !data) {
            console.error('❌ Error al obtener sesión de Supabase:', error);
            return;
        }

        let sessionPath = path.join(process.cwd(), `.wwebjs_auth/RemoteAuth-${sessionId}`);
        // During extraction, we always use the new pattern but we can check if the other one exists
        console.log(`📦 Extrayendo sesión en: ${sessionPath}`);
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
        const sessionId = options.clientId || options.session;
        const { error } = await this.supabase
            .from('bot_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) {
            console.error('Error deleting session from Supabase:', error);
        }
    }

    async _addFolderToZip(zip, folderPath, zipPath) {
        const files = await fs.readdir(folderPath);
        for (const file of files) {
            try {
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
            } catch (err) {
                // Ignore files that disappear during zipping (like temporary lock files)
                console.warn(`⚠️ Ignorando archivo en el zip: ${file} (posiblemente bloqueado o temporal)`);
            }
        }
    }
}

module.exports = SupabaseStore;
