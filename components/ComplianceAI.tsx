
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { db } from '../services/db';

const ComplianceAI: React.FC = () => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const assets = await db.getAssets();

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Eres un asistente experto en seguridad industrial. 
        Datos actuales de la base de datos de extintores: ${JSON.stringify(assets)}.
        Pregunta del usuario: ${query}
        Responde de forma breve y profesional basada únicamente en estos datos.`,
      });

      setAnswer(response.text || "No pude procesar la consulta.");
    } catch (err) {
      setAnswer("Error al conectar con el analista de cumplimiento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
        <h3 className="text-xs font-black uppercase tracking-widest text-primary">Analista AI ExtintoresUY</h3>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="¿Cuál es el estado general?"
          className="flex-1 bg-black/20 border-none rounded-lg text-xs p-2 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={askAI}
          disabled={loading}
          className="bg-primary text-background-dark p-2 rounded-lg disabled:opacity-50"
        >
          <span className="material-symbols-outlined !text-sm">{loading ? 'sync' : 'send'}</span>
        </button>
      </div>

      {answer && (
        <div className="mt-3 p-3 bg-black/20 rounded-lg text-[11px] text-slate-300 italic leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

export default ComplianceAI;
