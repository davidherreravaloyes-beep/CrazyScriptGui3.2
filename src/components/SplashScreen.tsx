import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function SplashScreen({ onComplete, siteConfig }: { onComplete: () => void, siteConfig?: any }) {
  const [hasPlayed, setHasPlayed] = useState(false);

  const displayConfig = siteConfig || {
    splashText: 'CrazyGuiscripts',
    splashOwner: 'D4vidskys'
  };

  useEffect(() => {
    // Cinematic intro impact
    const audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); 
    audio.currentTime = 10; // Start a bit into it for more immediate sound
    audio.volume = 0.2;

    audio.onerror = () => {
      console.warn("Splash sound failed to load.");
    };

    let soundTimer: NodeJS.Timeout;
    if (!hasPlayed) {
      soundTimer = setTimeout(() => {
        if (audio.readyState >= 2) {
          audio.play().catch(e => console.log("Sound impact blocked:", e));
        }
        setHasPlayed(true);
      }, 1200);
    }

    const timer = setTimeout(() => {
      onComplete();
    }, 3800);
    return () => {
      clearTimeout(timer);
      if (soundTimer) clearTimeout(soundTimer);
    };
  }, [onComplete, hasPlayed]);

  // Split the text into two parts for the C/G animation
  const splashText = displayConfig.splashText || 'CrazyGuiscripts';
  const midPoint = Math.ceil(splashText.length / 2);
  const part1 = splashText.substring(0, midPoint);
  const part2 = splashText.substring(midPoint);
  const char1 = part1[0];
  const rest1 = part1.substring(1);
  const char2 = part2[0];
  const rest2 = part2.substring(1);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
    >
      {/* Background glow effects */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] aspect-square bg-brand/10 opacity-20 blur-[150px] rounded-full" />
      </motion.div>
      
      <motion.div 
        animate={{ 
          y: [-2, 2, -2],
          rotate: [-0.5, 0.5, -0.5]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="relative flex flex-col items-center w-full px-6"
      >
        <div className="relative flex items-center justify-center font-black text-[14vw] md:text-9xl tracking-tighter w-full text-center select-none">
          {/* Left Part */}
          <div className="flex items-center">
            <motion.span
              initial={{ x: -150, opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ x: 0, opacity: 1, scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                damping: 20,
                stiffness: 80,
                delay: 0.2
              }}
              className="text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]"
            >
              {char1}
            </motion.span>
            <motion.div
              initial={{ opacity: 0, width: 0, x: -10 }}
              animate={{ opacity: 1, width: "auto", x: 0 }}
              transition={{ 
                duration: 1.2, 
                delay: 0.8,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="text-white/90 overflow-hidden whitespace-nowrap"
            >
              <span className="inline-block px-1">{rest1}</span>
            </motion.div>
          </div>

          {/* Right Part */}
          <div className="flex items-center">
            <motion.span
              initial={{ x: 150, opacity: 0, scale: 0.8, rotate: 10 }}
              animate={{ x: 0, opacity: 1, scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                damping: 20,
                stiffness: 80,
                delay: 0.2
              }}
              className="text-brand drop-shadow-[0_0_40px_rgba(168,85,247,0.4)]"
            >
              {char2}
            </motion.span>
            <motion.div
              initial={{ opacity: 0, width: 0, x: 10 }}
              animate={{ opacity: 1, width: "auto", x: 0 }}
              transition={{ 
                duration: 1.2, 
                delay: 0.8,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="text-brand/90 overflow-hidden whitespace-nowrap"
            >
              <span className="inline-block px-1">{rest2}</span>
            </motion.div>
          </div>

          {/* Glitch Shine Sweep */}
          <motion.div
            initial={{ left: "-100%", opacity: 0 }}
            animate={{ left: "200%", opacity: [0, 0.5, 0] }}
            transition={{ 
              duration: 1.5, 
              delay: 1.5,
              ease: "easeInOut"
            }}
            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] blur-xl pointer-events-none"
          />
        </div>

        {/* Subtitle / Owner Name with staggered layout */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2 }}
          className="mt-8 flex flex-col items-center"
        >
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 64 }}
            transition={{ duration: 0.8, delay: 2.2, ease: "easeOut" }}
            className="h-px bg-brand/40 mb-4" 
          />
          <span className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.6em] text-center opacity-80">
            OWNED BY <span className="text-white/80 ml-2 tracking-[0.4em] drop-shadow-sm">{displayConfig.splashOwner || 'D4vidskys'}</span>
          </span>
        </motion.div>
      </motion.div>

      {/* Modern Slim Loading Bar */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-40 h-[2px] bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 3.2, ease: [0.65, 0, 0.35, 1] }}
          className="h-full bg-gradient-to-r from-brand/50 via-brand to-brand/50 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
        />
      </div>

      {/* Ambient noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </motion.div>


  );
}
