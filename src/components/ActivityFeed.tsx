import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, User, ExternalLink, Loader2, Gavel, Sparkles } from 'lucide-react';
import { RECENT_ACTIVITY } from '../constants';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(1248);

  // Online users simulation
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        setOnlineUsers(prev => prev + 1000);
      } else {
        setOnlineUsers(prev => prev + Math.floor(Math.random() * 5));
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Activities from Firestore
  useEffect(() => {
    const q = query(collection(db, 'scripts'), orderBy('createdAt', 'desc'), limit(15));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreActivities = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          user: data.author || 'Anonymous',
          action: 'published',
          target: data.title,
          time: 'NEW',
          isBot: data.isBot || data.authorId?.startsWith('bot-') || ['ScoutIA', 'DeltaBot', 'Spectrum', 'Nexus'].includes(data.author),
          isAdmin: data.author === 'D4VIDSKYS' || data.author === 'davidherrera' || data.author === 'D4vidskys'
        };
      });

      // Fetch external API for variety
      const fetchExternal = async () => {
        try {
          const response = await fetch('/api/rscripts');
          if (response.ok) {
            const externalData = await response.json();
            const externalActivities = externalData.map((item: any) => ({
              id: item.id,
              user: item.user,
              action: item.action,
              target: item.title,
              time: item.time,
              isAdmin: item.user === 'System' || item.user === 'Server'
            }));
            
            // Merge and sort (simple merge for now)
            setActivities([...firestoreActivities, ...externalActivities].slice(0, 15));
          } else {
            setActivities(firestoreActivities);
          }
        } catch (e) {
          setActivities(firestoreActivities);
        } finally {
          setLoading(false);
        }
      };

      fetchExternal();
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="glass p-6 rounded-3xl border border-border/50 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Activity size={18} className="text-brand" />
          Live Activity
        </h3>
        <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
      </div>

      <div className="space-y-6">
        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="text-brand animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {activities.map((item: any, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                whileTap={{ scale: 0.98 }}
                className="flex gap-4 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-border flex-shrink-0 flex items-center justify-center relative">
                  <User size={16} className="text-zinc-500 group-hover:text-brand transition-colors" />
                  {item.isBot && <Sparkles size={10} className="absolute -top-1 -right-1 text-brand animate-pulse" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    <span className="text-zinc-500 font-normal flex items-center gap-1">
                      {item.user}
                      {item.isAdmin && <Gavel size={10} className="text-brand" fill="currentColor" />}
                    </span> {item.action}
                  </p>
                  <p className="text-xs text-brand truncate font-mono">
                    {item.target}
                  </p>
                  <span className="text-[10px] text-zinc-600 uppercase mt-1 block tracking-wider">{item.time}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="mt-10 pt-6 border-t border-border/30">
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="text-zinc-500">Online Users</span>
          <span className="text-white font-bold">{onlineUsers.toLocaleString()}</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
           <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '75%' }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-brand"
           />
        </div>
      </div>
    </div>
  );
}
