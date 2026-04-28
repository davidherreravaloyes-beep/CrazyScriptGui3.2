import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, Loader2, Code, Copy, Check, MessageSquare, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';

interface Script {
  title: string;
  source: string;
  url: string;
  description: string;
  snippet: string;
}

export function AISearch({ siteConfig }: { siteConfig: any }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Script[]>([]);
  const [error, setError] = useState<{message: string, details?: string} | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setError(null);
    try {
      const response = await axios.post('/api/ai/search', { query });
      const data = response.data;
      setResults(data.scripts || []);
      
      if (!data.scripts || data.scripts.length === 0) {
        setError({ message: "No se encontraron scripts confiables para este juego.", details: "Prueba con términos de búsqueda más específicos." });
      }
    } catch (err: any) {
      console.error("AI Search Error:", err);
      const serverError = err.response?.data;
      
      setError({
        message: serverError?.error || "Error en la búsqueda",
        details: serverError?.details || "La inteligencia artificial no está configurada correctamente. Si eres el administrador, asegúrate de añadir la GEMINI_API_KEY."
      });
    } finally {
      setIsSearching(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const suggestions = (siteConfig?.aiSuggestions || "Blox Fruits Auto Farm, Haze Piece Script, Hoho Hub, OMG Hub Script").split(',').map((s: string) => s.trim());

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-bold mb-6"
        >
          <Sparkles className="w-4 h-4" />
          POWERED BY <span className="cyberpunk-text ml-1 mr-1" data-text="CRAZY IA">CRAZY IA</span> (GEMINI 1.5) v2.5
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase italic flex items-center justify-center gap-3">
          {siteConfig?.aiTitle ? (
            siteConfig.aiTitle.split(' ').map((word: string, i: number) => (
              <span key={i} data-text={word} className={cn(
                (word.toLowerCase() === 'crazy' || word.toLowerCase() === 'ia' || word.toLowerCase() === 'crazyia') ? "cyberpunk-text" : ""
              )}>
                {word}{' '}
              </span>
            ))
          ) : (
            <>
              <span className="cyberpunk-text" data-text="Crazy IA">Crazy IA</span>
              <span>Search</span>
            </>
          )}
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">
          {siteConfig?.aiSubtitle || 'Encuentra los scripts más recientes y funcionales usando inteligencia artificial avanzada.'}
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative group mb-12">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand/20 to-brand/40 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
        <div className="relative flex gap-2 p-2 rounded-2xl bg-[#0a0a0c] border border-border/50 shadow-2xl">
          <div className="flex-1 flex items-center px-4">
            <Search className="w-5 h-5 text-zinc-500 mr-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: Auto Farm Blox Fruits 2026..."
              className="w-full bg-transparent border-none text-white focus:outline-none placeholder:text-zinc-600 font-medium"
              disabled={isSearching}
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className={cn(
              "px-8 py-4 rounded-xl bg-brand text-black font-black uppercase tracking-tighter flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100",
              isSearching && "animate-pulse"
            )}
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Analizar"
            )}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 justify-center mb-16">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(suggestion);
              setTimeout(() => handleSearch(), 0);
            }}
            className="px-4 py-2 rounded-lg bg-zinc-900 border border-border/50 text-zinc-400 text-sm hover:text-white hover:border-brand/30 transition-all font-bold uppercase tracking-wider"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-brand animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white font-black italic uppercase">Buscando en la Red...</p>
              <p className="text-zinc-500 text-sm lowercase">La IA está analizando los resultados más recientes</p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-4"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-500 mb-2 font-black text-xl">!</div>
            <h3 className="text-red-400 font-black uppercase text-xl">{error.message}</h3>
            <p className="text-zinc-400 text-sm">{error.details}</p>
            
            {(error.message.includes("API Key") || error.message.includes("Clave")) && (
              <div className="mt-8 p-6 bg-black/40 rounded-xl border border-white/5 text-left space-y-4">
                <p className="font-bold text-white uppercase text-xs tracking-widest border-b border-white/10 pb-2">Guía para corregir el error:</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-zinc-200 font-bold text-xs mb-2 uppercase">Si estás en el Editor de AI Studio:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded bg-brand text-black flex items-center justify-center font-bold text-[10px]">1</span>
                        <p className="text-zinc-400">Ve a <b>Ajustes (engranaje ⚙️)</b> &gt; <b>Secrets</b>.</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded bg-brand text-black flex items-center justify-center font-bold text-[10px]">2</span>
                        <p className="text-zinc-400">Añade <code className="bg-zinc-800 px-1 py-0.5 rounded text-brand">GEMINI_API_KEY</code>.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-zinc-200 font-bold text-xs mb-2 uppercase">Si la web ya está publicada (Vercel/Netlify):</p>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Debes ir al panel de control de tu hosting (ej. <b>Vercel Dashboard</b>), entrar en los ajustes de tu proyecto, buscar <b>Environment Variables</b> y añadir la <code className="bg-zinc-800 px-1 py-0.5 rounded text-brand">GEMINI_API_KEY</code> manualmente. Luego haz un "Redeploy".
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div
            key="results"
            className="grid gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {results.map((script, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group p-6 rounded-2xl bg-[#0a0a0c] border border-border hover:border-brand/40 transition-all shadow-xl"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-brand/10 text-brand text-[10px] font-bold uppercase">LATEST</span>
                    </div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{script.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(script.snippet, idx)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-border text-xs font-bold text-white hover:bg-zinc-800 transition-colors"
                    >
                      {copiedIndex === idx ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      {copiedIndex === idx ? 'COPIADO!' : 'COPY CODE'}
                    </button>
                  </div>
                </div>
                
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  {script.description}
                </p>

                <div className="space-y-3">
                   <div className="flex items-center gap-2 text-zinc-500 uppercase text-[10px] font-bold tracking-widest">
                     <Terminal size={12} className="text-brand" />
                     Script Preview
                   </div>
                   <div className="relative group/code">
                     <div className="absolute inset-x-0 -bottom-2 h-full bg-gradient-to-t from-[#0a0a0c] to-transparent pointer-events-none" />
                     <pre className="p-4 rounded-xl bg-black border border-border/50 text-zinc-300 font-mono text-xs overflow-x-auto max-h-[150px]">
                       <code>{script.snippet}</code>
                     </pre>
                   </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12 group-hover:rotate-0 transition-transform">
              <MessageSquare className="w-8 h-8 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 italic uppercase">Esperando tu consulta...</h3>
            <p className="text-zinc-500">Prueba con el nombre de un juego de Roblox para encontrar scripts.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
