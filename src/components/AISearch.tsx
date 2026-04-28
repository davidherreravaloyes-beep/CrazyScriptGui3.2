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
    <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden rounded-3xl bg-black border border-white/5 mt-8 mx-4">
      {/* Hacker Matrix Background */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="flex justify-between h-full px-4 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -100 }}
              animate={{ 
                y: [0, -500, 0],
                transition: { 
                  duration: 5 + Math.random() * 10, 
                  repeat: Infinity,
                  ease: "linear" 
                }
              }}
              className="flex flex-col text-[10px] md:text-sm font-mono text-brand/50 leading-none select-none"
              style={{ x: Math.random() * 20 }}
            >
              {Array.from({ length: 50 }).map((_, j) => (
                <span key={j} className="py-1">
                  {Math.floor(Math.random() * 10)}
                </span>
              ))}
            </motion.div>
          ))}
          {/* Numbers going up */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`up-${i}`}
              initial={{ y: 500 }}
              animate={{ 
                y: [500, 0, 500],
                transition: { 
                  duration: 8 + Math.random() * 12, 
                  repeat: Infinity,
                  ease: "linear" 
                }
              }}
              className="flex flex-col text-[10px] md:text-sm font-mono text-brand/40 leading-none select-none"
              style={{ x: Math.random() * -20 }}
            >
              {Array.from({ length: 50 }).map((_, j) => (
                <span key={j} className="py-1">
                  {Math.floor(Math.random() * 10)}
                </span>
              ))}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/20 text-brand text-sm font-bold mb-8"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          SYSTEM OFFLINE / UPGRADING
        </motion.div>
        
        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter mb-4 cyberpunk-text" data-text="PRÓXIMAMENTE">
          PRÓXIMAMENTE
        </h1>
        
        <div className="h-1 w-24 bg-brand mx-auto mb-8 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
        
        <p className="text-zinc-300 font-mono text-sm md:text-base max-w-lg mx-auto tracking-widest uppercase font-bold text-shadow-glow">
          LOS ADMINISTRADORES ESTAN TRABAJANDO EN CRAZY IA 
          <span className="inline-block w-2 h-4 bg-brand ml-2 animate-pulse" />
        </p>

        <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm mx-auto opacity-50">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                animate={{ x: [-100, 100] }}
                transition={{ duration: 1 + i, repeat: Infinity, ease: "linear" }}
                className="h-full w-20 bg-brand"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
