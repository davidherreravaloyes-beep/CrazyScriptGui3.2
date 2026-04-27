/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { SplashScreen } from './components/SplashScreen';
import { Hero } from './components/Hero';
import { ScriptCard, FilterBar } from './components/ScriptGrid';
import { ActivityFeed } from './components/ActivityFeed';
import { ScriptModal } from './components/ScriptModal';
import { SubmitScriptModal } from './components/SubmitScriptModal';
import { Executors } from './components/Executors';
import { AdminPanel } from './components/AdminPanel';
import { LoginView } from './components/LoginView';
import { Footer } from './components/Footer';
import { MOCK_SCRIPTS, CATEGORIES, Script, Executor } from './constants';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Star, Trophy, Loader2, Gem, Sparkles } from 'lucide-react';
import { db, auth, onAuthStateChanged, type User, handleFirestoreError, OperationType, syncUserProfile } from './lib/firebase';
import { collection, query, orderBy, getDoc, getDocs, doc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { UserProfileModal } from './components/UserProfileModal';
import { UserSearchModal } from './components/UserSearchModal';
import { AISearch } from './components/AISearch';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'scripts' | 'executors' | 'admin' | 'login' | 'super-ia'>('scripts');
  const [user, setUser] = useState<User | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'views' | 'likes'>('latest');
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [firestoreScripts, setFirestoreScripts] = useState<Script[]>([]);
  const [externalScripts, setExternalScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any>({
    name: 'CrazyGui',
    brand: 'scripts',
    featuredTitle: 'Featured Scripts',
    premiumTitle: 'Premium Scripts',
    uploadTitle: 'Upload your own scripts',
    splashText: 'CrazyGuiscripts',
    splashOwner: 'D4vidskys'
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Site Config
        const configSnap = await getDoc(doc(db, 'config', 'site'));
        if (configSnap.exists()) {
          const config = configSnap.data();
          setSiteConfig(config);
          if (config.brandColor) {
            const root = document.documentElement;
            root.style.setProperty('--color-brand', config.brandColor);
            root.style.setProperty('--color-accent', config.brandColor);
            root.style.setProperty('--color-brand-muted', config.brandColor + 'cc');
            root.style.setProperty('--color-brand-dark', config.brandColor + '99');
          }
        }

        // Fetch Scripts
        const qScripts = query(collection(db, 'scripts'), orderBy('createdAt', 'desc'));
        const scriptsSnap = await getDocs(qScripts);
        const scripts = scriptsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Script[];
        setFirestoreScripts(scripts);
        setLoading(false);

        // Fetch Executors
        const qExecs = query(collection(db, 'executors'), orderBy('updatedAt', 'desc'));
        const execsSnap = await getDocs(qExecs);
        const executors = execsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Executor[];
        setFirestoreExecutors(executors);

      } catch (error: any) {
        if (error.code === 'resource-exhausted' || error.message?.includes('Quota exceeded')) {
          console.warn('Firebase Quota Exceeded. Using cached/static data.');
        } else {
          console.error('Data fetch error:', error);
        }
        setLoading(false);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      const secretKey = localStorage.getItem('DEV_ADMIN_KEY');
      const isSecretAdmin = secretKey === 'SleepingCityMaster';

      if (currentUser) {
        syncUserProfile(currentUser);

        if (isSecretAdmin || currentUser.email === 'davidherreravaloyes@gmail.com' || currentUser.email === 'herreravaloyesa@gmail.com') {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
            setIsAdmin(adminDoc.exists());
          } catch (error) {
            setIsAdmin(false);
          }
        }
        if (currentPage === 'login') {
          setCurrentPage('scripts');
        }
      } else {
        setIsAdmin(isSecretAdmin);
      }
    });

    fetchData();

    return () => {
      unsubscribeAuth();
    };
  }, [currentPage]);

  // Disable Auto-boost tracking (Quota saving)
  const lastBoostTimes = useRef<{ [key: string]: { views: number, likes: number } }>({});

  // Delayed Booster System (30m delay, 5% probability)
  useEffect(() => {
    if (!isAdmin || firestoreScripts.length === 0) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      
      // Iterate through scripts to find candidates
      for (const script of firestoreScripts) {
        // Condition: Older than 30 mins, not boosted yet, and 5% luck
        const createdAtMs = script.createdAt?.seconds ? script.createdAt.seconds * 1000 : 0;
        const reflectsTarget = script.views === 200000; // Marker to avoid repeated updates

        if (!reflectsTarget && createdAtMs > 0 && (now - createdAtMs > 1800000)) {
          // 5% chance to trigger the boost
          if (Math.random() < 0.05) {
            try {
              await updateDoc(doc(db, 'scripts', script.id), {
                views: 200000,
                likes: 157000,
                updatedAt: serverTimestamp()
              });
              // Success - Break loop for this interval to save quota
              break; 
            } catch (e) {
              // Silent fail
            }
          }
        }
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [isAdmin, firestoreScripts]);

  const [firestoreExecutors, setFirestoreExecutors] = useState<Executor[]>([]);

  // Bot Posting System (Admin only)
  useEffect(() => {
    if (!isAdmin || !user) return;

    const bots = [
      { id: 'bot1', name: 'ScoutIA', source: 'scriptpastebin.com' },
      { id: 'bot2', name: 'DeltaBot', source: 'rscripts.net' },
      { id: 'bot3', name: 'Spectrum', source: 'scriptpastebin.com' },
      { id: 'bot4', name: 'SkyScraper', source: 'rscripts.net' },
      { id: 'bot5', name: 'Nexus', source: 'scriptpastebin.com' },
      { id: 'bot6', name: 'Thermomix', source: 'rscripts.net' },
      { id: 'bot7', name: 'elgoat', source: 'scriptpastebin.com' },
      { id: 'bot8', name: 'lilbrocazy', source: 'rscripts.net' },
      { id: 'bot9', name: 'Lexxx', source: 'scriptpastebin.com' },
      { id: 'bot10', name: 'AzaShadow', source: 'rscripts.net' }
    ];

    const discoveries = [
      { title: 'Delta Hub V3', game: 'Universal', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/DeltaHub/Main/main/v3.lua"))()' },
      { title: 'Blox Fruits Hub', game: 'Blox Fruits', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/ScriptHub/Main/main/blox_delta_v2.lua"))()' },
      { title: 'Pet Sim 99 Farm', game: 'Pet Simulator 99', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/PS99Bots/Stable/main/ps99_delta.lua"))()' },
      { title: 'Haze Piece Infinite', game: 'Haze Piece', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/HazeX25/Public/main/haze_universal.lua"))()' },
      { title: 'King Legacy Farm', game: 'King Legacy', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/KingLegPro/Main/main/king_delta.lua"))()' },
      { title: 'Brookhaven Admin GUI', game: 'Brookhaven', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/AdminCmds24/Brook/main/gui_v2.lua"))()' },
      { title: 'MM2 Eclipse Hub', game: 'Murder Mystery 2', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/EclipseDev/Main/main/mm2_delta_final.lua"))()' },
      { title: 'Blade Ball Parry', game: 'Blade Ball', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/BladeDev/Main/main/parry_v3.lua"))()' },
      { title: 'Adopt Me Better', game: 'Adopt Me!', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/AdoptDev/Main/main/adopt_fixed.lua"))()' },
      { title: 'Bee Swarm Sim OP', game: 'Bee Swarm Simulator', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/BeeSim6/Main/main/v6_fixed.lua"))()' },
      { title: 'Doors Monster Avoid', game: 'Doors', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/DoorsExpl/Main/main/safe_v4.lua"))()' },
      { title: 'Solara Admin Panel', game: 'Universal', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/SolaraDev/Main/main/panel_v2.lua"))()' },
      { title: 'Arsenal Aimbot Pro', game: 'Arsenal', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/ArsDev/Main/main/aim.lua"))()' },
      { title: 'Da Hood Silent Aim', game: 'Da Hood', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/DHoodDev/Main/main/silent.lua"))()' },
      { title: 'Natural Disaster Survival', game: 'Natural Disaster Survival', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/NDS/Main/main/script.lua"))()' },
      { title: 'Prison Life Admin', game: 'Prison Life', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/PL/Main/main/admin.lua"))()' },
      { title: 'Build A Boat AutoFarm', game: 'Build A Boat For Treasure', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/BAB/Main/main/farm.lua"))()' },
      { title: 'Lumber Tycoon 2 Gui', game: 'Lumber Tycoon 2', code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/LT2/Main/main/gui.lua"))()' }
    ];

    const interval = setInterval(async () => {
      // 60% chance every 40 minutes as requested
      if (Math.random() > 0.60) return;
      
      // Post 2 different scripts
      for (let i = 0; i < 2; i++) {
        const bot = bots[Math.floor(Math.random() * bots.length)];
        const scriptData = discoveries[Math.floor(Math.random() * discoveries.length)];
        const icons = ['TreePine', 'Target', 'Sword', 'Cloud', 'Globe', 'Leaf', 'Zap', 'Skull', 'Shield', 'Search', 'Lock', 'Key', 'Ghost', 'Flame', 'Gem', 'Star'];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];
        
        const scriptId = `bot-${bot.id}-${Date.now()}-${i}`;

        try {
          await setDoc(doc(db, 'scripts', scriptId), {
            title: `[NEW] ${scriptData.title}`,
            rawScript: scriptData.code,
            game: scriptData.game,
            author: bot.name,
            authorId: user.uid,
            thumbnail: `https://images.unsplash.com/photo-${1542750000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&q=80&w=800`,
            views: Math.floor(Math.random() * 5000) + 1200,
            likes: Math.floor(Math.random() * 300) + 50,
            isVerified: true,
            iconName: randomIcon,
            category: 'Adventure',
            description: `👾 script detectado por ${bot.name}. Optimizado para Delta Executor. ¡Funcionando perfectamente!`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          // Silent catch for quota
        }
        
        // Small delay between the two posts
        if (i === 0) await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }, 2400000); // Check every 40 minutes (2400000ms)

    return () => clearInterval(interval);
  }, [isAdmin, user]);

  useEffect(() => {
    const syncExternalScripts = async () => {
      try {
        const response = await fetch('/api/rscripts/sync');
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setExternalScripts(prev => {
              const existingIds = new Set(prev.map(s => s.id));
              const newScripts = data.filter((s: any) => !existingIds.has(s.id));
              return [...prev, ...newScripts];
            });
          }
        }
      } catch (err) {
        console.error("External sync error:", err);
      }
    };
    syncExternalScripts();
  }, []);

  const allScripts = useMemo(() => {
    // Combine mock data with real firestore data and external scripts
    return [...firestoreScripts, ...externalScripts, ...MOCK_SCRIPTS].reduce((acc: Script[], current) => {
      const x = acc.find(item => item.id === current.id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);
  }, [firestoreScripts, externalScripts]);

  const filteredScripts = useMemo(() => {
    const filtered = allScripts.filter(script => {
      const isActuallyPremium = script.isPremium;
      const matchesCategory = selectedCategory === 'All' || script.category === selectedCategory;
      const matchesSearch = script.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           script.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           script.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch && !isActuallyPremium;
    });

    // Apply Sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
      
      // Default: Latest (by createdAt or updatedAt if mock)
      const getTime = (s: Script) => {
        if (s.createdAt?.seconds) return s.createdAt.seconds;
        if (s.createdAt instanceof Date) return s.createdAt.getTime() / 1000;
        // Fallback for mock data which only has updatedAt as a string
        return 0;
      };
      
      return getTime(b) - getTime(a);
    });
  }, [selectedCategory, searchQuery, allScripts, sortBy]);

  const handleOpenSubmit = () => {
    if (user) {
      setIsSubmitModalOpen(true);
    } else {
      setCurrentPage('login');
    }
  };

  const handleEditScript = (script: Script) => {
    setEditingScript(script);
    setSelectedScript(null);
  };

  const closeModals = () => {
    setIsSubmitModalOpen(false);
    setEditingScript(null);
    setSelectedScript(null);
  };

  const handleSplashComplete = useMemo(() => () => setShowSplash(false), []);

  return (
    <div className="min-h-screen bg-background selection:bg-brand/30 selection:text-brand">
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} siteConfig={siteConfig} />}
      </AnimatePresence>

      {currentPage === 'login' ? (
        <LoginView onBack={() => setCurrentPage('scripts')} />
      ) : (
        <>
          <Navbar 
            onOpenSubmit={handleOpenSubmit} 
            onPageChange={setCurrentPage}
            currentPage={currentPage}
            onOpenUserSearch={() => setIsUserSearchOpen(true)}
            siteConfig={siteConfig}
          />

          {/* Floating Crazy IA Button */}
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentPage('super-ia')}
            className={cn(
              "fixed bottom-8 right-8 z-[60] w-16 h-16 rounded-2xl bg-brand text-black flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)] cursor-pointer group transition-all",
              currentPage === 'super-ia' && "hidden"
            )}
          >
            <Sparkles className="w-8 h-8 group-hover:animate-spin-slow" />
            <div className="absolute -top-10 right-0 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-brand/20">
              Crazy IA
            </div>
          </motion.button>

          <main>
            {currentPage === 'scripts' ? (
              <>
                <Hero 
                  onSearch={setSearchQuery} 
                  onOpenSubmit={handleOpenSubmit} 
                  siteConfig={siteConfig}
                />

            {/* Featured Section */}
            <section className="max-w-7xl mx-auto px-4 mb-20">
              <div className="flex flex-col lg:flex-row gap-10">
                {/* Main Content */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Star size={20} className="text-brand" fill="currentColor" />
                      {siteConfig?.featuredTitle || 'Featured Scripts'}
                    </h2>
                    
                    <div className="flex items-center gap-4 bg-zinc-900/50 p-1 rounded-xl border border-border/50">
                      {(['latest', 'views', 'likes'] as const).map((sort) => (
                        <button
                          key={sort}
                          onClick={() => setSortBy(sort)}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                            sortBy === sort 
                              ? "bg-brand text-black" 
                              : "text-zinc-500 hover:text-white"
                          )}
                        >
                          {sort}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <FilterBar 
                    categories={CATEGORIES} 
                    selectedCategory={selectedCategory} 
                    onSelectCategory={setSelectedCategory} 
                  />

                  <motion.div 
                    whileTap={{ scale: 0.998 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredScripts.map((script, idx) => (
                        <ScriptCard 
                          key={script.id} 
                          script={script} 
                          index={idx} 
                          onClick={setSelectedScript} 
                          onSelectUser={setSelectedUserId}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                  
                  {filteredScripts.length === 0 && (
                    <motion.div 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="text-center py-32 bg-card/20 rounded-3xl border border-dashed border-border"
                    >
                       <p className="text-zinc-500 text-lg">No results found for your search/filter.</p>
                       <button 
                        onClick={() => {setSelectedCategory('All'); setSearchQuery('');}}
                        className="mt-4 text-brand font-bold text-sm hover:underline"
                      >
                        Clear all filters
                      </button>
                    </motion.div>
                  )}

                  <div className="mt-12 flex justify-center">
                    <button className="px-8 py-3 bg-zinc-900 border border-border text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all flex items-center gap-2 group">
                      Load More Scripts
                      <Trophy size={16} className="text-brand group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Sidebar Activity */}
                <aside className="w-full lg:w-80 flex-shrink-0">
                   <ActivityFeed />
                </aside>
              </div>
            </section>

            {/* Premium Scripts Section */}
            <section className="max-w-7xl mx-auto px-4 mb-20">
              <div className="bg-[#0a0a0c] border border-brand/20 rounded-[32px] p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand/5 blur-[120px] -mr-48 -mt-48" />
                
                <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6 relative z-10">
                  <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
                      <Gem size={28} className="text-brand animate-pulse" fill="currentColor" />
                      {siteConfig?.premiumTitle || 'Premium Scripts'}
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium">{siteConfig?.premiumSubtitle || 'Get access to undetected, high-performance private scripts.'}</p>
                  </div>
                  <button className="px-6 py-2.5 bg-brand/10 border border-brand/20 text-brand text-xs font-black rounded-xl uppercase tracking-widest hover:bg-brand hover:text-black transition-all">
                    View All Premium
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                  {allScripts.filter(s => s.isPremium).map((script, idx) => (
                    <ScriptCard 
                      key={script.id} 
                      script={script} 
                      index={idx} 
                      onClick={setSelectedScript} 
                      onSelectUser={setSelectedUserId}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Categories CTA Section */}
            <section className="max-w-7xl mx-auto px-4 py-20 border-t border-border/50">
              <div className="bg-gradient-to-br from-brand/20 to-blue-500/10 rounded-[40px] p-8 md:p-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 blur-[100px] -mr-32 -mt-32" />
                
                <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-12">
                  <div className="max-w-md">
                    <div className="flex items-center gap-2 text-brand font-black text-xs uppercase mb-6 tracking-widest">
                      <Flame size={16} fill="currentColor" /> Grow with us
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                      {(siteConfig?.uploadTitle || 'Upload your own scripts').split('<br />').map((line: string, i: number) => (
                        <span key={i}>
                          {line}
                          {i < (siteConfig?.uploadTitle || 'Upload your own scripts').split('<br />').length - 1 && <br />}
                        </span>
                      ))}
                    </h2>
                    <p className="text-zinc-400 mb-10 text-lg leading-relaxed">
                      {siteConfig?.uploadSubtitle || 'Join 1,200+ developers sharing their creations with the largest community of script-users. Get verified today.'}
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={handleOpenSubmit}
                        className="px-8 py-4 bg-brand text-black font-bold rounded-2xl hover:bg-brand-muted transition-all active:scale-95 neon-glow"
                      >
                        Become a Creator
                      </button>
                      <button className="px-8 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all">
                        Learn More
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    {[
                      { label: 'Scripts', value: '12K+' },
                      { label: 'Users', value: '500K+' },
                      { label: 'Authors', value: '1.2K' },
                      { label: 'Daily DLs', value: '45K' },
                    ].map((stat) => (
                      <div key={stat.label} className="stat-card p-6 bg-black/60 backdrop-blur-3xl border border-white/5 rounded-3xl group hover:border-brand/30 transition-colors">
                        <div className="text-2xl md:text-3xl font-bold text-white mb-1 group-hover:text-brand transition-colors">{stat.value}</div>
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
            </>
            ) : currentPage === 'executors' ? (
              <Executors isAdmin={isAdmin} />
            ) : currentPage === 'super-ia' ? (
              <AISearch siteConfig={siteConfig} />
            ) : currentPage === 'admin' ? (
              <AdminPanel onEditScript={handleEditScript} />
            ) : null}
          </main>

          <Footer siteConfig={siteConfig} />

          <UserProfileModal 
            isOpen={!!selectedUserId} 
            onClose={() => setSelectedUserId(null)} 
            userId={selectedUserId || ''} 
          />

          <UserSearchModal
            isOpen={isUserSearchOpen}
            onClose={() => setIsUserSearchOpen(false)}
            onSelectUser={setSelectedUserId}
          />

          <AnimatePresence>
            {selectedScript && (
              <ScriptModal 
                script={selectedScript} 
                onClose={closeModals} 
                isAdmin={isAdmin}
                onEdit={handleEditScript}
              />
            )}
            {(isSubmitModalOpen || editingScript) && (
              <SubmitScriptModal 
                onClose={closeModals} 
                editScript={editingScript || undefined}
                isAdmin={isAdmin}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
