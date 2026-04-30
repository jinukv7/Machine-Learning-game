/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Play, 
  ChevronRight, 
  Brain, 
  Search, 
  Target, 
  Clock, 
  CheckCircle2, 
  X,
  RotateCcw,
  Info,
  Award,
  Zap,
  LayoutGrid,
  Bot,
  Flag,
  Skull,
  Key as KeyIcon,
  Circle
} from 'lucide-react';

// --- Types & Constants ---

type Screen = 
  | 'HOME' 
  | 'L1_INTRO' | 'L1_GAME' | 'L1_LESSON' 
  | 'L2_INTRO' | 'L2_GAME' | 'L2_LESSON' 
  | 'L3_INTRO' | 'L3_GAME' | 'L3_LESSON' 
  | 'RESULTS';

const CATEGORIES_L1 = ['Animal', 'Vehicle', 'Food', 'Building'] as const;
type CategoryL1 = typeof CATEGORIES_L1[number];

interface CardL1 {
  id: string;
  emoji: string;
  description: string;
  category: CategoryL1;
}

const CARDS_L1: CardL1[] = [
  { id: '1', emoji: '🐶', description: 'Has fur, barks, wags tail', category: 'Animal' },
  { id: '2', emoji: '🐱', description: 'Has fur, meows, climbs trees', category: 'Animal' },
  { id: '3', emoji: '🚗', description: 'Has wheels, engine, fuel tank', category: 'Vehicle' },
  { id: '4', emoji: '✈️', description: 'Has wings, jet engine, flies', category: 'Vehicle' },
  { id: '5', emoji: '🍎', description: 'Red, round, grows on trees', category: 'Food' },
  { id: '6', emoji: '🍕', description: 'Dough, sauce, melted cheese', category: 'Food' },
  { id: '7', emoji: '🏠', description: 'Has rooms, roof, front door', category: 'Building' },
  { id: '8', emoji: '🏥', description: 'Large, sterile, has beds', category: 'Building' },
  { id: '9', emoji: '🦁', description: 'Big cat, mane, loud roar', category: 'Animal' },
  { id: '10', emoji: '🚲', description: 'Two wheels, pedals, no engine', category: 'Vehicle' },
  { id: '11', emoji: '🍔', description: 'Bun, patty, lettuce, tomato', category: 'Food' },
  { id: '12', emoji: '🏢', description: 'Tall, glass, office spaces', category: 'Building' },
];

interface DataPointL2 {
  id: string;
  icon: string;
  size: number; // 1-10
  speed: number; // 1-10
  hiddenCluster: 'FastSmall' | 'FastLarge' | 'SlowSmall' | 'SlowLarge';
}

const SHAPES_L2 = ['Circle', 'Box', 'Hexagon', 'Diamond'];

// --- Audio Utility ---

const playTone = (freq: number, type: OscillatorType, duration: number) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio Context blocked or not available");
  }
};

const soundEffects = {
  correct: () => {
    playTone(523.25, 'sine', 0.2); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.2), 100); // E5
  },
  wrong: () => {
    playTone(440, 'triangle', 0.2); // A4
    setTimeout(() => playTone(349.23, 'triangle', 0.2), 100); // F4
  },
  click: () => playTone(880, 'sine', 0.05),
  levelComplete: () => {
    playTone(523.25, 'sine', 0.3);
    setTimeout(() => playTone(659.25, 'sine', 0.3), 150);
    setTimeout(() => playTone(783.99, 'sine', 0.5), 300);
  }
};

// --- Components ---

const ProgressBar = ({ current, total, label, score, timer }: { current: number, total: number, label: string, score: number, timer?: number }) => (
  <header className="h-20 bg-[#1E293B] border-b border-blue-500/30 flex items-center justify-between px-8 shrink-0 z-50">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">M</div>
      <h1 className="text-xl font-bold tracking-tight uppercase hidden md:block">ML Paradigm Quest</h1>
    </div>
    
    <div className="flex items-center gap-4 md:gap-8">
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest">Level {current.toString().padStart(2, '0')}</span>
        <span className="text-sm font-semibold text-blue-400">{label}</span>
      </div>
      <div className="h-8 w-px bg-slate-700"></div>
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 uppercase">Score</span>
        <span className="text-xl font-mono font-bold text-emerald-400">{score.toString().padStart(4, '0')}</span>
      </div>
      {timer !== undefined && (
        <>
          <div className="h-8 w-px bg-slate-700"></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase">Time</span>
            <span className={`text-xl font-mono font-bold ${timer < 10 ? 'text-red-500 animate-pulse' : ''}`}>
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </>
      )}
    </div>

    <div className="flex gap-2">
      {[1, 2, 3].map(i => (
        <div key={i} className={`w-3 h-3 rounded-full transition-colors duration-500 ${i <= current ? 'bg-blue-500' : 'bg-slate-700'}`} />
      ))}
    </div>
  </header>
);

const LessonCard = ({ title, concept, examples, icon, onNext }: { title: string, concept: string, examples: string[], icon: string, onNext: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-2xl mx-auto level-card p-10 text-center relative overflow-hidden"
  >
    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-violet-500 to-amber-500" />
    <span className="text-6xl mb-6 block">{icon}</span>
    <h2 className="text-3xl font-bold mb-4">{title}</h2>
    <p className="text-slate-300 text-lg mb-8 leading-relaxed">
      {concept}
    </p>
    <div className="bg-slate-900/50 rounded-2xl p-6 mb-8 text-left border border-slate-700/50">
      <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-3 font-bold">Real-World Examples</h3>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {examples.map((ex, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {ex}
          </li>
        ))}
      </ul>
    </div>
    <button 
      onClick={onNext}
      className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto transition-all hover:scale-105 active:scale-95"
    >
      Continue Mission <ChevronRight className="w-5 h-5" />
    </button>
  </motion.div>
);

export default function App() {
  const [screen, setScreen] = useState<Screen>('HOME');
  const [levelScores, setLevelScores] = useState({ l1: 0, l2: 0, l3: 0 });
  const [totalScore, setTotalScore] = useState(0);
  
  // Shared state
  const [timer, setTimer] = useState(0);

  // Level 1 State
  const [l1Items] = useState(CARDS_L1);
  const [l1Sorted, setL1Sorted] = useState<string[]>([]);
  const [l1ActiveId, setL1ActiveId] = useState<string | null>(null);
  const [l1TrainingProgress, setL1TrainingProgress] = useState(0);

  // Level 2 State
  const [l2Data, setL2Data] = useState<DataPointL2[]>([]);
  const [l2Selections, setL2Selections] = useState<string[]>([]);
  const [l2Groups, setL2Groups] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [l2Revealed, setL2Revealed] = useState(false);

  // Level 3 State
  const [l3Policy, setL3Policy] = useState({ goal: 80, trap: -80, empty: -2, key: 30 });
  const [l3Training, setL3Training] = useState(false);
  const [l3Episode, setL3Episode] = useState(0);
  const [l3AgentPos, setL3AgentPos] = useState({ x: 0, y: 0 });
  const [l3Path, setL3Path] = useState<{ x: number, y: number }[]>([]);
  const [l3BestSteps, setL3BestSteps] = useState(Infinity);

  // --- Handlers ---

  const goTo = (s: Screen) => {
    soundEffects.click();
    setScreen(s);
  };

  useEffect(() => {
    setTotalScore(levelScores.l1 + levelScores.l2 + levelScores.l3);
  }, [levelScores]);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if ((screen === 'L1_GAME' || screen === 'L2_GAME') && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0 && (screen === 'L1_GAME' || screen === 'L2_GAME')) {
      handleLevelComplete();
    }
    return () => clearInterval(interval);
  }, [screen, timer]);

  const handleLevelComplete = useCallback(() => {
    soundEffects.levelComplete();
    if (screen === 'L1_GAME') {
      const bonus = Math.round(timer * 0.5);
      setLevelScores(prev => ({ ...prev, l1: prev.l1 + bonus }));
      setScreen('L1_LESSON');
    } else if (screen === 'L2_GAME') {
      const bonus = Math.round(timer * 0.5);
      setLevelScores(prev => ({ ...prev, l2: prev.l2 + bonus }));
      setScreen('L2_LESSON');
    }
  }, [screen, timer]);

  // Level 1 logic
  const onSortL1 = (itemId: string, category: CategoryL1) => {
    const item = CARDS_L1.find(c => c.id === itemId);
    if (!item) return;

    if (item.category === category) {
      soundEffects.correct();
      setL1Sorted(prev => [...prev, itemId]);
      setLevelScores(prev => ({ ...prev, l1: prev.l1 + 10 }));
      setL1ActiveId(null);
      
      if (l1Sorted.length + 1 === CARDS_L1.length) {
        let p = 0;
        const interval = setInterval(() => {
          p += 2;
          setL1TrainingProgress(p);
          if (p >= 100) {
            clearInterval(interval);
            handleLevelComplete();
          }
        }, 30);
      }
    } else {
      soundEffects.wrong();
    }
  };

  // Level 2 logic
  useEffect(() => {
    if (screen === 'L2_INTRO') {
      const generateData = (): DataPointL2[] => {
        return Array.from({ length: 16 }).map((_, i) => {
          const type = (['FastSmall', 'FastLarge', 'SlowSmall', 'SlowLarge'] as const)[Math.floor(i / 4)];
          let size = 0, speed = 0;
          switch (type) {
            case 'FastSmall': speed = 8 + Math.random() * 2; size = 2 + Math.random() * 2; break;
            case 'FastLarge': speed = 8 + Math.random() * 2; size = 8 + Math.random() * 2; break;
            case 'SlowSmall': speed = 2 + Math.random() * 2; size = 2 + Math.random() * 2; break;
            case 'SlowLarge': speed = 2 + Math.random() * 2; size = 8 + Math.random() * 2; break;
          }
          return {
            id: i.toString(),
            icon: SHAPES_L2[Math.floor(Math.random() * SHAPES_L2.length)],
            size,
            speed,
            hiddenCluster: type
          };
        }).sort(() => Math.random() - 0.5);
      };
      setL2Data(generateData());
    }
  }, [screen]);

  const onGroupL2 = (group: 'A' | 'B' | 'C' | 'D') => {
    soundEffects.click();
    const newGroups = { ...l2Groups };
    l2Selections.forEach(id => {
      newGroups[id] = group;
    });
    setL2Groups(newGroups);
    setL2Selections([]);
  };

  const submitL2 = () => {
    setL2Revealed(true);
    let score = 0;
    const clusters: Record<string, string[]> = {};
    l2Data.forEach(d => {
      clusters[d.hiddenCluster] = [...(clusters[d.hiddenCluster] || []), d.id];
    });

    Object.values(clusters).forEach(ids => {
      const userGroupCounts: Record<string, number> = {};
      ids.forEach(id => {
        const ug = l2Groups[id];
        if (ug) userGroupCounts[ug] = (userGroupCounts[ug] || 0) + 1;
      });
      const maxMatch = Math.max(0, ...Object.values(userGroupCounts));
      score += maxMatch * 10;
    });

    setLevelScores(prev => ({ ...prev, l2: score }));
    setTimeout(() => handleLevelComplete(), 4000);
  };

  const MAZE = [
    [0, 0, 0, 0, 0, 0],
    [0, 2, 0, 1, 0, 0], 
    [0, 0, 1, 0, 0, 0],
    [0, 1, 0, 0, 1, 0],
    [0, 0, 0, 2, 1, 0],
    [1, 0, 0, 0, 0, 3],
  ];

  const trainAgent = async () => {
    setL3Training(true);
    setL3Episode(0);
    setL3BestSteps(Infinity);

    for (let ep = 1; ep <= 20; ep++) {
      setL3Episode(ep);
      let pos = { x: 0, y: 0 };
      let steps = 0;
      let path = [pos];
      const learningFactor = ep / 20;
      
      while (steps < 40) {
        setL3AgentPos(pos);
        setL3Path([...path]);
        await new Promise(r => setTimeout(r, ep > 15 ? 30 : 50));

        if (MAZE[pos.y][pos.x] === 3) break;

        const move = { x: 0, y: 0 };
        if (Math.random() < learningFactor) {
          if (pos.x < 5 && Math.random() > 0.5) move.x = 1;
          else if (pos.y < 5) move.y = 1;
          else if (pos.x < 5) move.x = 1;
          else if (pos.x > 0) move.x = -1;
          else move.y = -1;
        } else {
          const r = Math.random();
          if (r < 0.25) move.x = 1;
          else if (r < 0.5) move.x = -1;
          else if (r < 0.75) move.y = 1;
          else move.y = -1;
        }

        const next = { x: Math.max(0, Math.min(5, pos.x + move.x)), y: Math.max(0, Math.min(5, pos.y + move.y)) };
        if (MAZE[next.y][next.x] === 1 && Math.random() > learningFactor) break;

        pos = next;
        path.push(pos);
        steps++;
      }

      if (MAZE[pos.y][pos.x] === 3) {
        setL3BestSteps(s => Math.min(s, steps));
      }
    }

    let score = 10;
    if (l3BestSteps <= 8) score = 100;
    else if (l3BestSteps <= 12) score = 70;
    else if (l3BestSteps <= 16) score = 40;

    setLevelScores(prev => ({ ...prev, l3: score }));
    setL3Training(false);
    setTimeout(() => goTo('L3_LESSON'), 1000);
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#0F172A] text-slate-50 font-sans select-none">
      <AnimatePresence mode="wait">
        {screen === 'HOME' && (
          <motion.div key="home" className="flex-1 flex flex-col items-center justify-center p-4 relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-dot-pattern opacity-10" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center z-10">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                <Brain className="w-4 h-4" /> AI Academy Simulation
              </div>
              <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter uppercase italic leading-none">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-amber-400">ML Paradigm</span><br/>Quest
              </h1>
              <p className="text-xl md:text-2xl text-slate-400 font-light max-w-2xl mx-auto mb-12">
                Discover the logic behind intelligence. Master Supervised, Unsupervised, and Reinforcement Learning.
              </p>
              <button 
                onClick={() => goTo('L1_INTRO')}
                className="group relative px-12 py-5 bg-blue-500 hover:bg-blue-600 rounded-2xl font-bold text-xl shadow-2xl shadow-blue-500/30 transition-all hover:-translate-y-1 active:translate-y-0"
              >
                <div className="flex items-center gap-3"><Play className="fill-white w-6 h-6" /> START MISSION</div>
              </button>
              <div className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
                {['Supervised', 'Unsupervised', 'Reinforcement'].map((l, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${i === 0 ? 'bg-blue-500' : 'bg-slate-800 text-slate-600'}`}>
                      {i === 0 ? <Trophy className="w-6 h-6" /> : <Search className="w-6 h-6" />}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{l}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {(screen.startsWith('L1')) && (
          <motion.div key="l1" className="flex-1 flex flex-col" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}>
            <ProgressBar current={1} total={3} label="Supervised Learning" score={totalScore} timer={screen === 'L1_GAME' ? timer : undefined} />
            {screen === 'L1_INTRO' && (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="max-w-2xl">
                   <h2 className="text-4xl font-black mb-6 uppercase italic text-blue-400">Level 1: The Sorting Machine</h2>
                   <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                     Supervised learning uses <span className="text-white font-bold underline">labeled data</span>. 
                     You will act as the supervisor, teaching the machine by assigning correct labels to training examples.
                   </p>
                   <button onClick={() => { setTimer(90); goTo('L1_GAME'); }} className="bg-blue-500 hover:bg-blue-600 px-10 py-4 rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-xl shadow-blue-500/20">Begin Training</button>
                </div>
              </div>
            )}
            {screen === 'L1_GAME' && (
              <div className="flex-1 flex flex-col p-8 gap-6 overflow-hidden">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 overflow-y-auto pr-2">
                  {l1Items.map(card => {
                    const isSorted = l1Sorted.includes(card.id);
                    return (
                      <motion.div key={card.id} layoutId={card.id} whileHover={!isSorted ? { scale: 1.05 } : {}} onClick={() => !isSorted && setL1ActiveId(card.id)} className={`relative cursor-pointer level-card p-4 flex flex-col items-center justify-center text-center ${isSorted ? 'opacity-30 grayscale pointer-events-none' : ''} ${l1ActiveId === card.id ? 'border-blue-400 shadow-blue-500/30 ring-2 ring-blue-500/20' : ''}`}>
                         <span className="text-4xl mb-2">{card.emoji}</span>
                         <p className="text-[10px] leading-tight font-medium text-slate-300">{card.description}</p>
                         {isSorted && <div className="absolute inset-0 flex items-center justify-center text-emerald-400"><CheckCircle2 className="w-10 h-10" /></div>}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-32 shrink-0">
                  {CATEGORIES_L1.map(cat => (
                    <button key={cat} onClick={() => l1ActiveId && onSortL1(l1ActiveId, cat)} className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${l1ActiveId ? 'border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10' : 'border-slate-800 bg-slate-800/10 cursor-not-allowed'}`}>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{cat}</span>
                    </button>
                  ))}
                </div>
                {l1TrainingProgress > 0 && (
                  <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-8">
                     <div className="max-w-md w-full text-center">
                        <h3 className="text-2xl font-bold mb-4 uppercase italic">Training Processor...</h3>
                        <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                           <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${l1TrainingProgress}%` }} />
                        </div>
                     </div>
                  </div>
                )}
              </div>
            )}
            {screen === 'L1_LESSON' && (
              <div className="flex-1 flex items-center justify-center p-8">
                <LessonCard icon="🧠" title="Mission Debrief" concept="You provided the correct answers (labels). This is how models learn to classify emails, recognize faces, and diagnose diseases." examples={['Spam Filters', 'Facial ID', 'Medical AI']} onNext={() => goTo('L2_INTRO')} />
              </div>
            )}
          </motion.div>
        )}

        {screen.startsWith('L2') && (
          <motion.div key="l2" className="flex-1 flex flex-col" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}>
            <ProgressBar current={2} total={3} label="Unsupervised Learning" score={totalScore} timer={screen === 'L2_GAME' ? timer : undefined} />
            {screen === 'L2_INTRO' && (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="max-w-2xl">
                   <h2 className="text-4xl font-black mb-6 uppercase italic text-violet-400">Level 2: Cluster Detective</h2>
                   <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                     Unsupervised learning has <span className="text-white font-bold underline">no labels</span>. 
                     You must find hidden patterns and group items together based only on their attributes.
                   </p>
                   <button onClick={() => { setTimer(120); goTo('L2_GAME'); }} className="bg-violet-500 hover:bg-violet-600 px-10 py-4 rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-xl shadow-violet-500/20">Detect Clusters</button>
                </div>
              </div>
            )}
            {screen === 'L2_GAME' && (
              <div className="flex-1 flex flex-col p-8 gap-6 overflow-hidden">
                <div className="flex-1 flex gap-6 overflow-hidden">
                  <div className="flex-1 grid grid-cols-4 gap-4 overflow-y-auto pr-2">
                    {l2Data.map(d => {
                      const group = l2Groups[d.id];
                      const isSelected = l2Selections.includes(d.id);
                      return (
                        <div key={d.id} onClick={() => !l2Revealed && setL2Selections(prev => prev.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id])} className={`level-card p-4 flex flex-col items-center justify-center gap-3 cursor-pointer relative ${isSelected ? 'border-violet-400 shadow-violet-500/30' : ''}`}>
                          <div className={`w-10 h-10 rounded-full border-2 border-slate-700 flex items-center justify-center ${group === 'A' ? 'bg-emerald-500/20 border-emerald-500' : group === 'B' ? 'bg-blue-500/20 border-blue-500' : group === 'C' ? 'bg-amber-500/20 border-amber-500' : group === 'D' ? 'bg-rose-500/20 border-rose-500' : ''}`}>
                            <Circle className="w-5 h-5" />
                          </div>
                          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-slate-600" style={{ width: `${d.speed * 10}%` }} /></div>
                          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-slate-400" style={{ width: `${d.size * 10}%` }} /></div>
                          {l2Revealed && <span className="absolute inset-x-0 -bottom-1 text-center text-[7px] font-black uppercase text-slate-500">{d.hiddenCluster}</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-40 flex flex-col gap-3">
                    {['A', 'B', 'C', 'D'].map(g => (
                      <button key={g} disabled={l2Revealed} onClick={() => onGroupL2(g as any)} className={`flex-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center ${l2Selections.length > 0 ? 'bg-violet-500/5 border-violet-500/50 hover:bg-violet-500/10' : 'bg-slate-800/10 border-slate-800 opacity-50'}`}>
                         <span className="text-[10px] font-black text-slate-500">GROUP {g}</span>
                      </button>
                    ))}
                    <button onClick={submitL2} className="bg-violet-500 py-3 rounded-xl text-xs font-bold mt-2">SUBMIT</button>
                  </div>
                </div>
              </div>
            )}
            {screen === 'L2_LESSON' && (
              <div className="flex-1 flex items-center justify-center p-8">
                <LessonCard icon="🔍" title="Pattern Recognition" concept="You discovered structure without being told the answers. This is how AI identifies customer segments and detects financial fraud." examples={['Netflix Recommends', 'Fraud Detection', 'Customer Clusters']} onNext={() => goTo('L3_INTRO')} />
              </div>
            )}
          </motion.div>
        )}

        {screen.startsWith('L3') && (
          <motion.div key="l3" className="flex-1 flex flex-col" initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}>
            <ProgressBar current={3} total={3} label="Reinforcement Learning" score={totalScore} />
            {screen === 'L3_INTRO' && (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="max-w-2xl">
                   <h2 className="text-4xl font-black mb-6 uppercase italic text-amber-500">Level 3: Maze Runner</h2>
                   <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                     Reinforcement learning uses <span className="text-white font-bold underline">rewards and penalties</span>. 
                     The agent learns by trying different actions and seeing which ones lead to the biggest prize.
                   </p>
                   <button onClick={() => goTo('L3_GAME')} className="bg-amber-500 hover:bg-amber-600 px-10 py-4 rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-xl shadow-amber-500/20">Init Agent</button>
                </div>
              </div>
            )}
            {screen === 'L3_GAME' && (
              <div className="flex-1 flex flex-col md:flex-row p-8 gap-8 overflow-hidden">
                <div className="flex-1 aspect-square max-h-[500px] bg-slate-900 border border-slate-700/50 rounded-2xl p-4 relative grid grid-cols-6 grid-rows-6 gap-1">
                   {MAZE.map((row, y) => row.map((cell, x) => (
                     <div key={`${x}-${y}`} className={`bg-slate-800/30 rounded flex items-center justify-center relative`}>
                        {cell === 3 && <Flag className="w-5 h-5 text-emerald-500" />}
                        {cell === 1 && <Skull className="w-5 h-5 text-red-500 opacity-30" />}
                        {cell === 2 && <KeyIcon className="w-5 h-5 text-amber-400 opacity-30" />}
                        {l3Path.some(p => p.x === x && p.y === y) && <div className="absolute inset-0 bg-amber-500/10 border border-amber-500/10" />}
                     </div>
                   )))}
                   <motion.div className="absolute p-1" animate={{ left: `${(l3AgentPos.x / 6) * 100}%`, top: `${(l3AgentPos.y / 6) * 100}%` }} style={{ width: '16.66%', height: '16.66%' }}>
                      <div className="w-full h-full bg-amber-500 rounded-lg flex items-center justify-center text-xl shadow-lg ring-2 ring-amber-400/20 overflow-hidden">🤖</div>
                   </motion.div>
                </div>
                <div className="w-80 flex flex-col gap-4">
                   {['goal', 'trap', 'empty', 'key'].map(k => (
                     <div key={k} className="level-card p-4 space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500"><span>{k} policy</span><span className="text-white font-mono">{l3Policy[k as keyof typeof l3Policy]}</span></div>
                        <input type="range" min={k === 'trap' || k === 'empty' ? -100 : 0} max={100} value={l3Policy[k as keyof typeof l3Policy]} onChange={(e) => setL3Policy(p => ({ ...p, [k]: parseInt(e.target.value) }))} className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg" />
                     </div>
                   ))}
                   <div className="mt-auto space-y-4">
                     <p className="text-center text-[10px] uppercase tracking-widest text-slate-500">Best steps: {l3BestSteps === Infinity ? '---' : l3BestSteps}</p>
                     <button onClick={trainAgent} disabled={l3Training} className="w-full bg-amber-500 py-4 rounded-2xl font-black shadow-xl shadow-amber-500/20 active:scale-95 transition-transform disabled:opacity-50">{l3Training ? "TRAINING..." : "START TRAIN"}</button>
                   </div>
                </div>
              </div>
            )}
            {screen === 'L3_LESSON' && (
              <div className="flex-1 flex items-center justify-center p-8">
                <LessonCard icon="🕹️" title="Trial & Error" concept="The agent explores the environment and optimizes its actions to maximize total score. This is how self-driving cars and game-playing AIs learn." examples={['AlphaGo', 'Robotics', 'Self-Driving']} onNext={() => goTo('RESULTS')} />
              </div>
            )}
          </motion.div>
        )}

        {screen === 'RESULTS' && (
          <motion.div key="results" className="flex-1 flex flex-col p-8 overflow-y-auto items-center" initial={{ y: 500 }} animate={{ y: 0 }}>
             <div className="w-full max-w-2xl text-center pb-12">
                <Trophy className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                <h1 className="text-5xl font-black mb-8 italic uppercase tracking-tighter">Mission Accomplished</h1>
                <div className="text-8xl font-black italic mb-8 bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">{totalScore}</div>
                <div className="grid grid-cols-3 gap-4 mb-12">
                   {[{ l: 'L1', s: levelScores.l1 }, { l: 'L2', s: levelScores.l2 }, { l: 'L3', s: levelScores.l3 }].map(x => (
                     <div key={x.l} className="level-card p-4">
                        <div className="text-[10px] text-slate-500 uppercase font-black mb-1">{x.l} Score</div>
                        <div className="text-2xl font-bold font-mono">{x.s}</div>
                     </div>
                   ))}
                </div>
                <button onClick={() => window.location.reload()} className="bg-blue-500 px-12 py-5 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition-transform active:scale-95">Re-play Quest</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
