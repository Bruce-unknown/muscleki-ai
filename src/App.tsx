import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import StatsPanel from './components/StatsPanel';
import WorkoutScheduler from './components/WorkoutScheduler';
import IntegrationManager from './components/IntegrationManager';
import ReminderCenter from './components/ReminderCenter';
import NutritionScanner from './components/NutritionScanner';
import { Workout, CalendarToken, Reminder } from './types';
import { ShieldAlert, Flame, Cpu, Settings, Bell, Volume2, X, AlertTriangle, Apple, Calendar } from 'lucide-react';


// Chime synthesizer using Web Audio API
export function playBrowserAlertSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Resume context if suspended
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Dual-oscillator synth for a robust cybernetic chime
    const playTone = (timeOffset: number, frequency: number, duration: number, peakVolume: number) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(frequency, now + timeOffset);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(frequency * 1.5, now + timeOffset); // Harmonic fifth

      gainNode.gain.setValueAtTime(0, now + timeOffset);
      gainNode.gain.linearRampToValueAtTime(peakVolume, now + timeOffset + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + duration);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now + timeOffset);
      osc1.stop(now + timeOffset + duration + 0.05);

      osc2.start(now + timeOffset);
      osc2.stop(now + timeOffset + duration + 0.05);
    };

    // Sequential premium retro-future alert chimes
    playTone(0, 523.25, 0.15, 0.08);    // C5
    playTone(0.12, 659.25, 0.15, 0.08);  // E5
    playTone(0.24, 880.00, 0.35, 0.1);   // A5 (higher resolution alarm note)
  } catch (error) {
    console.warn('Audio feedback blocked by browser autoplay rules.', error);
  }
}

// Default Initial Data for rich visual fidelity
const DEFAULT_WORKOUTS: Workout[] = [
  {
    id: 1,
    user_id: 1,
    title: "Hypertrophy Push A (Chest/Shoulders/Triceps)",
    description: "Incline Dumbbell Press: 3x8 (75lbs), OHP: 3x8 (115lbs), Cable Flyes: 3x12, Tricep Pushdowns: 4x12. Focus on eccentric contraction control.",
    scheduled_time: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // 18 hours from now
    status: "scheduled"
  },
  {
    id: 2,
    user_id: 1,
    title: "Posterior Chain focus & Leg Press B",
    description: "Romanian Deadlift: 4x8 (225lbs), Leg Press: 3x10 (360lbs), Hamstring Curls: 3x12, Calf Raises: 4x15. Keep rest periods under 90s.",
    scheduled_time: new Date(Date.now() + 42 * 60 * 60 * 1000).toISOString(), // 42 hours from now
    status: "scheduled"
  },
  {
    id: 3,
    user_id: 1,
    title: "Restorative Yoga & Core Mobility",
    description: "Stretching focus on hips and lower back. Plank hold for 3 sets of 60 seconds.",
    scheduled_time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    status: "completed"
  }
];

const DEFAULT_CALENDARS: CalendarToken[] = [
  {
    id: 1,
    user_id: 1,
    provider: "google",
    access_token: "ya29.a0AfB_byC8xR-98nBvL_k8rFm7xZ_9pLq8",
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    connected: true
  },
  {
    id: 2,
    user_id: 1,
    provider: "outlook",
    access_token: "",
    expires_at: "",
    connected: false
  }
];

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 1,
    workout_id: 1,
    workout_title: "Hypertrophy Push A (Chest/Shoulders/Triceps)",
    phone_number: "+1 (555) 014-9922",
    trigger_time: new Date(Date.now() + 17.75 * 60 * 60 * 1000).toISOString(), // 15 mins before workout 1
    status: "pending"
  },
  {
    id: 2,
    workout_id: 3,
    workout_title: "Restorative Yoga & Core Mobility",
    phone_number: "+1 (555) 014-9922",
    trigger_time: new Date(Date.now() - 6.25 * 60 * 60 * 1000).toISOString(),
    status: "sent"
  }
];

export default function App() {
  const userEmail = "shadowjohn890@gmail.com";

  // State
  const [activeTab, setActiveTab] = useState<'scheduler' | 'nutrition' | 'profile'>('scheduler');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // User Profile States
  const [profileWeight, setProfileWeight] = useState<string>('70');
  const [profileHeight, setProfileHeight] = useState<string>('170');
  const [profileAge, setProfileAge] = useState<string>('25');
  const [profileGoal, setProfileGoal] = useState<string>('maintain');
  const [profileRegion, setProfileRegion] = useState<string>('US');
  const [profileCalculatedTargets, setProfileCalculatedTargets] = useState<any>(null);

  // Fetch initial profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/profile?user_id=1');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setProfileWeight(String(data.user.weight_kg || '70'));
            setProfileHeight(String(data.user.height_cm || '170'));
            setProfileAge(String(data.user.age || '25'));
            setProfileGoal(data.user.fitness_goal || 'maintain');
            setProfileRegion(data.user.preferred_region || 'US');
          }
          if (data.targets) {
            setProfileCalculatedTargets(data.targets);
            localStorage.setItem('muscleki_nutrition_targets', JSON.stringify({
              calories: data.targets.calories,
              protein: data.targets.protein,
              carbs: data.targets.carbs,
              fats: data.targets.fats,
              water_ml: data.targets.water_ml,
              preset: data.user.fitness_goal === 'lose' ? 'cut' : data.user.fitness_goal === 'gain' ? 'bulk' : 'balanced'
            }));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch user profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile?user_id=1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          weight_kg: parseFloat(profileWeight),
          height_cm: parseFloat(profileHeight),
          age: parseInt(profileAge),
          fitness_goal: profileGoal,
          preferred_region: profileRegion
        })
      });

      if (response.ok) {
        const data = await response.json();
        setProfileCalculatedTargets(data.targets);
        
        // Save to local storage for instant sync across tabs
        const presetType = profileGoal === 'lose' ? 'cut' : profileGoal === 'gain' ? 'bulk' : 'balanced';
        const newTargets = {
          calories: data.targets.calories,
          protein: data.targets.protein,
          carbs: data.targets.carbs,
          fats: data.targets.fats,
          water_ml: data.targets.water_ml,
          preset: presetType
        };
        localStorage.setItem('muscleki_nutrition_targets', JSON.stringify(newTargets));
        
        // Dispatch custom event for real-time hydration & nutrition update
        window.dispatchEvent(new CustomEvent('profile-updated'));

        // Instant notification toast
        const toastId = `profile-save-${Date.now()}`;
        setToasts(prev => [
          ...prev,
          {
            id: toastId,
            title: "⚡ Bio-Profile Updated",
            message: `Accurate BMR calculated. Daily target adjusted to ${data.targets.calories} kcal & ${data.targets.water_ml}ml.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        ]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 5000);
      } else {
        throw new Error("Profile update rejected by backend server.");
      }
    } catch (err) {
      console.error(err);
      // Fallback local calculations
      const weight = parseFloat(profileWeight) || 70;
      const height = parseFloat(profileHeight) || 170;
      const age = parseInt(profileAge) || 25;
      const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      let calories = 2500;
      let protein = 160;
      if (profileGoal === "lose") {
        calories = bmr * 1.25 - 400;
        protein = weight * 2.0;
      } else if (profileGoal === "gain") {
        calories = bmr * 1.25 + 400;
        protein = weight * 2.2;
      } else {
        calories = bmr * 1.25;
        protein = weight * 1.6;
      }
      calories = maxNum(roundNum(calories), 1200);
      protein = maxNum(roundNum(protein), 50);
      const fats = maxNum(roundNum((calories * 0.25) / 9), 40);
      const carbs = maxNum(roundNum((calories - (protein * 4) - (fats * 9)) / 4), 100);
      const water_ml = maxNum(roundNum((weight * 35) / 50) * 50, 2000);

      const localTargets = { calories, protein, carbs, fats, water_ml };
      setProfileCalculatedTargets(localTargets);
      
      const presetType = profileGoal === 'lose' ? 'cut' : profileGoal === 'gain' ? 'bulk' : 'balanced';
      localStorage.setItem('muscleki_nutrition_targets', JSON.stringify({
        ...localTargets,
        preset: presetType
      }));
      window.dispatchEvent(new CustomEvent('profile-updated'));

      const toastId = `profile-save-local-${Date.now()}`;
      setToasts(prev => [
        ...prev,
        {
          id: toastId,
          title: "⚡ Bio-Profile Saved (Local Fallback)",
          message: `Daily targets adjusted to ${calories} kcal & ${water_ml} ml.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 5000);
    }
  };

  // Helper helper functions for fallback math
  function roundNum(n: number) { return Math.round(n); }
  function maxNum(a: number, b: number) { return Math.max(a, b); }

  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    const saved = localStorage.getItem('muscleki_workouts');
    return saved ? JSON.parse(saved) : DEFAULT_WORKOUTS;
  });

  const [calendars, setCalendars] = useState<CalendarToken[]>(() => {
    const saved = localStorage.getItem('muscleki_calendars');
    return saved ? JSON.parse(saved) : DEFAULT_CALENDARS;
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('muscleki_reminders');
    return saved ? JSON.parse(saved) : DEFAULT_REMINDERS;
  });

  // Toasts Notification State
  interface ActiveToast {
    id: string;
    title: string;
    message: string;
    workoutTitle?: string;
    timestamp: string;
  }
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  // Resume AudioContext on first user click to bypass browser autoplay policies
  useEffect(() => {
    const resumeAudio = () => {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const tempCtx = new AudioContext();
        if (tempCtx.state === 'suspended') {
          tempCtx.resume();
        }
      }
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);
    return () => {
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses when user is typing in form controls or rich text fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === 'w') {
        e.preventDefault();
        setActiveTab('scheduler');
        
        // Push instant visual toast notification
        const toastId = `shortcut-w-${Date.now()}`;
        setToasts(prev => [
          ...prev,
          {
            id: toastId,
            title: "⌨️ Terminal View Shortcut",
            message: "Viewport transitioned to Workouts Terminal.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        ]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 5000);
      } 
      else if (key === 's') {
        e.preventDefault();
        setActiveTab('nutrition');
        
        // Push instant visual toast notification
        const toastId = `shortcut-s-${Date.now()}`;
        setToasts(prev => [
          ...prev,
          {
            id: toastId,
            title: "⌨️ Nutrition View Shortcut",
            message: "Viewport transitioned to AI Nutrition Scanner.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        ]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 5000);
      } 
      else if (key === 'n') {
        e.preventDefault();
        setActiveTab('scheduler');
        
        // Delay slightly for tab animation to execute, then dispatch form open event
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-workout-form'));
        }, 120);

        // Push instant visual toast notification
        const toastId = `shortcut-n-${Date.now()}`;
        setToasts(prev => [
          ...prev,
          {
            id: toastId,
            title: "⌨️ Schedule Workout Shortcut",
            message: "Opened workout scheduler configuration form.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        ]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 5000);
      } 
      else if (key === 'u') {
        e.preventDefault();
        setActiveTab('nutrition');
        
        // Delay slightly for tab animation, then dispatch nutrition scan event
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('trigger-nutrition-upload'));
        }, 120);

        // Push instant visual toast notification
        const toastId = `shortcut-u-${Date.now()}`;
        setToasts(prev => [
          ...prev,
          {
            id: toastId,
            title: "⌨️ Upload Meal Scan Shortcut",
            message: "Triggered file uploader for AI Vision Scanner.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        ]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toastId));
        }, 5000);
      } 
      else if (key === 'k' || e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Background check for pending reminders that should trigger
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      // Find any pending reminder where trigger_time has been reached
      const triggeredReminders = reminders.filter(r => {
        if (r.status !== 'pending') return false;
        const triggerTime = new Date(r.trigger_time);
        return triggerTime <= now;
      });

      if (triggeredReminders.length > 0) {
        // Play browser-based alert sound
        playBrowserAlertSound();
        
        // Show visual toast for each triggered reminder
        triggeredReminders.forEach(r => {
          const toastId = `toast-${r.id}-${Date.now()}`;
          setToasts(prev => [
            ...prev,
            {
              id: toastId,
              title: "🔔 15-Min Workout Alert!",
              message: `Telephony reminder dispatched to ${r.phone_number}`,
              workoutTitle: r.workout_title,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }
          ]);
          
          // Auto remove toast after 10 seconds
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toastId));
          }, 10000);
        });

        // Update the status of these reminders to 'sent'
        setReminders(prev => prev.map(r => {
          const triggerTime = new Date(r.trigger_time);
          if (r.status === 'pending' && triggerTime <= now) {
            return { ...r, status: 'sent' };
          }
          return r;
        }));
      }
    }, 5000); // Check every 5 seconds for absolute precision

    return () => clearInterval(interval);
  }, [reminders]);

  // Sync back to LocalStorage
  useEffect(() => {
    localStorage.setItem('muscleki_workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('muscleki_calendars', JSON.stringify(calendars));
  }, [calendars]);

  useEffect(() => {
    localStorage.setItem('muscleki_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Workout Handlers
  const handleAddWorkout = (workoutIn: Omit<Workout, 'id'>) => {
    const newWorkout: Workout = {
      ...workoutIn,
      id: workouts.length > 0 ? Math.max(...workouts.map(w => w.id)) + 1 : 1
    };
    setWorkouts([...workouts, newWorkout]);
  };

  const handleUpdateWorkout = (id: number, updated: Partial<Workout>) => {
    setWorkouts(workouts.map(w => {
      if (w.id === id) {
        const result = { ...w, ...updated };
        // If status changed to cancelled or completed, update associated reminders too
        if (updated.status === 'completed' || updated.status === 'cancelled') {
          setReminders(reminders.map(r => r.workout_id === id && r.status === 'pending' ? { ...r, status: updated.status === 'completed' ? 'sent' : 'failed' } : r));
        }
        return result;
      }
      return w;
    }));
  };

  const handleDeleteWorkout = (id: number) => {
    setWorkouts(workouts.filter(w => w.id !== id));
    // Remove related reminders
    setReminders(reminders.filter(r => r.workout_id !== id));
  };

  // Calendar connection toggler
  const handleToggleCalendar = (provider: 'google' | 'outlook') => {
    setCalendars(calendars.map(cal => {
      if (cal.provider === provider) {
        if (cal.connected) {
          return { ...cal, connected: false, access_token: '', expires_at: '' };
        } else {
          return {
            ...cal,
            connected: true,
            access_token: `ya29.mockToken_${provider}_${Math.random().toString(36).substring(7)}`,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          };
        }
      }
      return cal;
    }));
  };

  // Reminder Handlers
  const handleAddReminder = (reminderIn: Omit<Reminder, 'id'>) => {
    const newReminder: Reminder = {
      ...reminderIn,
      id: reminders.length > 0 ? Math.max(...reminders.map(r => r.id)) + 1 : 1
    };
    setReminders([...reminders, newReminder]);
  };

  const handleTriggerReminderStatus = (id: number, status: 'sent' | 'failed') => {
    const targetReminder = reminders.find(r => r.id === id);
    if (status === 'sent') {
      playBrowserAlertSound();
      
      const toastId = `toast-${id}-${Date.now()}`;
      setToasts(prev => [
        ...prev,
        {
          id: toastId,
          title: "🔔 Manual Workout Reminder Dispatch",
          message: `SMS reminder dispatched manually to ${targetReminder?.phone_number || 'target'}`,
          workoutTitle: targetReminder?.workout_title,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      ]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 8000);
    }
    setReminders(reminders.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col antialiased selection:bg-orange-600 selection:text-black">
      {/* High-fidelity glowing ambient grid lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.07),rgba(0,0,0,0))] pointer-events-none" />

      {/* Header component */}
      <Header userEmail={userEmail} />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10 space-y-8">
        
        {/* Core Layout Alert/Information Block */}
        <div className="bg-gradient-to-r from-orange-500/10 via-zinc-950 to-zinc-950 border border-orange-500/20 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
              <Cpu className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h4 className="text-sm font-bold font-mono tracking-tight text-white uppercase">
                Orange & Black Fitness Terminal Active
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Local SQLite sync engines wired directly. Live visual scheduling & reminders telemetry enabled.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
            <Settings className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500">DB SCHEMA:</span>
            <span className="text-orange-500 font-bold">SQLITE_V3_ONLINE</span>
          </div>
        </div>

        {/* Stats Panel Component */}
        <StatsPanel
          workouts={workouts}
          calendars={calendars}
          reminders={reminders}
        />

        {/* Cybernetic Tab Bar Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 gap-4">
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('scheduler')}
              className={`px-4 sm:px-6 py-3.5 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-2.5 border-b-2 ${
                activeTab === 'scheduler'
                  ? 'border-orange-500 text-orange-500 bg-orange-500/[0.02]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              WORKOUTS TERMINAL
            </button>
            <button
              onClick={() => setActiveTab('nutrition')}
              className={`px-4 sm:px-6 py-3.5 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-2.5 border-b-2 ${
                activeTab === 'nutrition'
                  ? 'border-orange-500 text-orange-500 bg-orange-500/[0.02]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Apple className="w-4 h-4" />
              AI NUTRITION SCANNER
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 sm:px-6 py-3.5 font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center gap-2.5 border-b-2 ${
                activeTab === 'profile'
                  ? 'border-orange-500 text-orange-500 bg-orange-500/[0.02]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              PROFILE & GOALS
            </button>
          </div>

          <button
            onClick={() => setShowShortcutsModal(true)}
            className="flex self-start sm:self-center items-center gap-2 px-3 py-1.5 mb-2 sm:mb-0 bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-orange-400 font-mono text-[10px] font-bold rounded-lg transition-all"
            title="Press [K] or [?] on your keyboard"
          >
            <span className="bg-zinc-950 px-1.5 py-0.5 rounded text-orange-500 font-bold border border-zinc-800">K</span>
            ACCESSIBILITY SHORTCUTS
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'scheduler' ? (
            <motion.div
              key="scheduler-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-8"
            >
              {/* Left Column: Workout Scheduler (takes 2/3 on xl screen) */}
              <div className="xl:col-span-2 space-y-8">
                <WorkoutScheduler
                  workouts={workouts}
                  onAddWorkout={handleAddWorkout}
                  onUpdateWorkout={handleUpdateWorkout}
                  onDeleteWorkout={handleDeleteWorkout}
                />

                <IntegrationManager
                  calendars={calendars}
                  onToggleConnection={handleToggleCalendar}
                />
              </div>

              {/* Right Column: Reminder logs & triggers (takes 1/3 on xl screen) */}
              <div className="xl:col-span-1">
                <div className="sticky top-24">
                  <ReminderCenter
                     reminders={reminders}
                     workouts={workouts}
                     onAddReminder={handleAddReminder}
                     onTriggerReminderStatus={handleTriggerReminderStatus}
                     onTestSound={playBrowserAlertSound}
                  />
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'nutrition' ? (
            <motion.div
              key="nutrition-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <NutritionScanner />
            </motion.div>
          ) : (
            <motion.div
              key="profile-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="max-w-2xl mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
              
              <div className="pb-6 mb-6 border-b border-zinc-900 flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold font-mono text-white tracking-tight uppercase flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-500" />
                    USER PROFILE & FITNESS GOALS
                  </h3>
                  <p className="text-xs text-zinc-400">Configure physical parameters for precision biological calculations.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400 uppercase">Weight (kg)</label>
                    <input
                      type="number"
                      value={profileWeight}
                      onChange={(e) => setProfileWeight(e.target.value)}
                      placeholder="70"
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400 uppercase">Height (cm)</label>
                    <input
                      type="number"
                      value={profileHeight}
                      onChange={(e) => setProfileHeight(e.target.value)}
                      placeholder="170"
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400 uppercase">Age (years)</label>
                    <input
                      type="number"
                      value={profileAge}
                      onChange={(e) => setProfileAge(e.target.value)}
                      placeholder="25"
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400 uppercase">Fitness Target Goal</label>
                    <select
                      value={profileGoal}
                      onChange={(e) => setProfileGoal(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500 font-mono"
                    >
                      <option value="lose">Fat Loss Shred (Lose Weight)</option>
                      <option value="maintain">Balanced Maintenance</option>
                      <option value="gain">Muscle Building Bulk (Gain Muscle)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-400 uppercase">Preferred Region</label>
                    <select
                      value={profileRegion}
                      onChange={(e) => setProfileRegion(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500 font-mono"
                    >
                      <option value="IN">India (IN)</option>
                      <option value="US">United States (US)</option>
                      <option value="ASIA">Asia (ASIA)</option>
                      <option value="EU">Europe (EU)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-zinc-900 pt-6 flex justify-end gap-3">
                  <button
                    onClick={handleSaveProfile}
                    className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-500 text-black font-mono font-bold text-xs rounded-xl transition-colors shadow-lg shadow-orange-500/10 cursor-pointer"
                  >
                    SAVE PROFILE & CALCULATE BMR
                  </button>
                </div>

                {profileCalculatedTargets && (
                  <div className="mt-6 p-5 bg-orange-500/[0.02] border border-orange-500/20 rounded-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-zinc-900/50 pb-3">
                      <span className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest">Calculated Bio-Targets</span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Mifflin-St Jeor Formula</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Daily Calories</span>
                        <p className="text-lg font-bold font-mono text-white">{profileCalculatedTargets.calories} <span className="text-xs font-normal text-zinc-400">kcal</span></p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Daily Hydration</span>
                        <p className="text-lg font-bold font-mono text-white">{profileCalculatedTargets.water_ml} <span className="text-xs font-normal text-zinc-400">ml</span></p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Protein Target</span>
                        <p className="text-lg font-bold font-mono text-white">{profileCalculatedTargets.protein} <span className="text-xs font-normal text-zinc-400">g</span></p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">Carbs / Fats</span>
                        <p className="text-lg font-bold font-mono text-white">{profileCalculatedTargets.carbs}g / {profileCalculatedTargets.fats}g</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Floating Animated Notification Toasts */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="pointer-events-auto bg-zinc-950/95 border-2 border-orange-500 rounded-xl p-4 shadow-2xl shadow-orange-500/10 flex items-start gap-3.5 relative overflow-hidden backdrop-blur-md"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
              
              <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-xs font-bold font-mono text-white tracking-tight uppercase">
                    {toast.title}
                  </h5>
                  <span className="text-[9px] font-mono text-zinc-500">{toast.timestamp}</span>
                </div>
                
                {toast.workoutTitle && (
                  <p className="text-xs font-bold text-orange-400 font-sans leading-snug">
                    {toast.workoutTitle}
                  </p>
                )}
                
                <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                  {toast.message}
                </p>

                <div className="flex items-center gap-1.5 pt-1 text-[9px] font-mono text-zinc-500">
                  <Volume2 className="w-3 h-3 text-orange-500" />
                  <span>BROWSER AUDIO CUE FIRED</span>
                </div>
              </div>

              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-900 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Keyboard Shortcuts Accessibility Modal */}
      <AnimatePresence>
        {showShortcutsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
            onClick={() => setShowShortcutsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 relative overflow-hidden shadow-2xl shadow-orange-500/[0.03]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/[0.04] to-transparent pointer-events-none" />
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                    <Settings className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-mono text-white tracking-widest uppercase">System Shortkey Telemetry</h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">SPEED CONFIG & ACCESSIBILITY CONTROLS</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-lg border border-zinc-850 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Shortcuts */}
              <div className="py-4 space-y-3.5">
                <div className="flex items-center justify-between py-1 border-b border-zinc-900/50">
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-sans text-zinc-300 font-bold block">Switch to Workouts</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Navigate straight to workouts terminal</span>
                  </div>
                  <kbd className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-orange-500 font-bold font-mono text-xs shadow">W</kbd>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-zinc-900/50">
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-sans text-zinc-300 font-bold block">Switch to Nutrition</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Navigate straight to AI nutrition scanner</span>
                  </div>
                  <kbd className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-orange-500 font-bold font-mono text-xs shadow">S</kbd>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-zinc-900/50">
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-sans text-zinc-300 font-bold block">Schedule New Workout</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Switch to workouts & open form automatically</span>
                  </div>
                  <kbd className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-orange-500 font-bold font-mono text-xs shadow">N</kbd>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-zinc-900/50">
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-sans text-zinc-300 font-bold block">Trigger Meal Scan</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Switch to scanner & open file picker instantly</span>
                  </div>
                  <kbd className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-orange-500 font-bold font-mono text-xs shadow">U</kbd>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-sans text-zinc-300 font-bold block">Toggle Shortcut Guide</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Show or hide this interactive control map</span>
                  </div>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-orange-500 font-bold font-mono text-xs shadow">K</kbd>
                    <span className="text-zinc-600 font-mono">or</span>
                    <kbd className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-orange-500 font-bold font-mono text-xs shadow">?</kbd>
                  </div>
                </div>
              </div>

              {/* Status/Guidance Alert */}
              <div className="p-3 bg-orange-500/[0.02] border border-orange-500/10 rounded-xl text-left">
                <p className="text-[10px] font-mono text-zinc-400 leading-relaxed">
                  ⚠️ <span className="text-orange-400 font-bold">SMART INHIBIT ACTIVE:</span> Shortcuts are automatically disabled when you are typing inside any input field, text area, or calendar selector to prevent typing interference.
                </p>
              </div>

              {/* Close Action */}
              <div className="pt-2">
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-black font-mono font-bold text-xs rounded-xl transition-colors shadow-lg shadow-orange-500/10"
                >
                  DISMISS CONTROL PANEL
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer area */}
      <footer className="border-t border-zinc-900 bg-black py-6 text-center text-xs font-mono text-zinc-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Muscleki AI System. All scheduled actions processed securely.</p>
          <div className="flex items-center gap-4 text-zinc-500">
            <span className="hover:text-orange-500 cursor-pointer">Security Protocol</span>
            <span>•</span>
            <span className="hover:text-orange-500 cursor-pointer">API Keys</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
