import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Calendar as CalendarIcon, 
  Clock, 
  Phone, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Activity, 
  Lock, 
  UserPlus, 
  Send,
  Workflow,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function App() {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('trainer@muscleki.ai');
  const [password, setPassword] = useState('password123');
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Application Data States
  const [workouts, setWorkouts] = useState([
    {
      id: 1,
      title: "Chest & Shoulders Power A",
      description: "Incline Bench: 4x6, Overhead Press: 3x8, Lateral Raises: 4x12, Cable Flyes: 3x15.",
      scheduled_time: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(), // 10h from now
      status: "scheduled"
    },
    {
      id: 2,
      title: "Leg Press & Quad Hypertrophy B",
      description: "Hack Squat: 3x8, Leg Press: 3x12, Quad Extensions: 4x15, Calf Raises: 4x20.",
      scheduled_time: new Date(Date.now() + 34 * 60 * 60 * 1000).toISOString(), // 34h from now
      status: "scheduled"
    },
    {
      id: 3,
      title: "Active Recovery & Core Flexibility",
      description: "Dead Hangs: 3xMax, Hanging Leg Raises: 4x12, Cat-Cow stretching & foam rolling.",
      scheduled_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
      status: "completed"
    }
  ]);

  const [reminders, setReminders] = useState([
    {
      id: 1,
      workout_title: "Chest & Shoulders Power A",
      phone_number: "+1 (555) 019-2834",
      trigger_time: new Date(Date.now() + 9.75 * 60 * 60 * 1000).toISOString(),
      status: "pending"
    }
  ]);

  // Integration States
  const [integrations, setIntegrations] = useState({
    google: true,
    outlook: false,
    telephony: true
  });

  // Scheduling Form States
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newPhone, setNewPhone] = useState('+1 (555) 019-2834');
  const [newOffset, setNewOffset] = useState('15');
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  // Weekly calendar helper setup
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  // Sorting State
  const [sortBy, setSortBy] = useState('date-desc');

  const getSortedWorkouts = () => {
    const list = [...workouts];
    if (sortBy === 'date-desc') {
      return list.sort((a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime());
    }
    if (sortBy === 'date-asc') {
      return list.sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());
    }
    if (sortBy === 'completed') {
      const statusOrder = { completed: 0, active: 1, scheduled: 2, cancelled: 3 };
      return list.sort((a, b) => {
        const orderA = statusOrder[a.status] ?? 4;
        const orderB = statusOrder[b.status] ?? 4;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime();
      });
    }
    return list;
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in all credentials.');
      return;
    }
    setIsLoading(true);
    setAuthError('');

    // Simulate API authorization request
    setTimeout(() => {
      setIsLoading(false);
      setIsLoggedIn(true);
      setUser({ email, id: 99 });
    }, 800);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleAddWorkout = (e) => {
    e.preventDefault();
    if (!newTitle || !newTime) return;

    const workoutId = workouts.length + 1;
    const newWorkoutItem = {
      id: workoutId,
      title: newTitle,
      description: newDescription,
      scheduled_time: new Date(newTime).toISOString(),
      status: 'scheduled'
    };

    setWorkouts([...workouts, newWorkoutItem]);

    // Automatically queue reminder if phone number is provided
    if (newPhone) {
      const workoutTime = new Date(newTime);
      const reminderTime = new Date(workoutTime.getTime() - Number(newOffset) * 60000);
      setReminders(prev => [
        ...prev,
        {
          id: prev.length + 1,
          workout_title: newTitle,
          phone_number: newPhone,
          trigger_time: reminderTime.toISOString(),
          status: 'pending'
        }
      ]);
    }

    setScheduleSuccess('Workout routine and SMS alert scheduled successfully!');
    setNewTitle('');
    setNewDescription('');
    setNewTime('');
    
    setTimeout(() => setScheduleSuccess(''), 4000);
  };

  const handleDeleteWorkout = (id) => {
    setWorkouts(workouts.filter(w => w.id !== id));
  };

  const toggleIntegration = (provider) => {
    setIntegrations(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  // Generate 7 days for the weekly calendar view
  const getWeekDates = () => {
    const dates = [];
    const start = new Date(currentWeekStart);
    // Find monday
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      dates.push(nextDay);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-orange-500 selection:text-black relative overflow-hidden">
      {/* Decorative cyber grid lines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(249,115,22,0.08),rgba(0,0,0,0))] pointer-events-none" />

      {/* --- NOT LOGGED IN: AUTH VIEW --- */}
      {!isLoggedIn ? (
        <div className="flex-grow flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
            
            <div className="text-center mb-8">
              <div className="inline-flex p-3 bg-orange-500/10 rounded-xl mb-3 border border-orange-500/20">
                <Dumbbell className="w-8 h-8 text-orange-500" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
                MUSCLEKI <span className="text-orange-500">AI</span>
              </h1>
              <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-mono">
                Autonomous Physical Scheduling Core
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-mono text-zinc-400">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="name@muscleki-ai.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-zinc-400">SECURITY PASSWORD</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-3 pl-10 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 text-black font-bold font-mono py-3.5 rounded-xl transition-all duration-200 transform active:scale-[0.98] mt-2 shadow-lg shadow-orange-500/10"
              >
                {isLoading ? 'ESTABLISHING HANDSHAKE...' : authMode === 'login' ? 'ACCESS ENGINE' : 'REGISTER TERMINAL'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-900 text-center text-xs text-zinc-500 font-mono">
              {authMode === 'login' ? (
                <p>
                  New to Muscleki AI?{' '}
                  <span onClick={() => setAuthMode('register')} className="text-orange-500 hover:underline cursor-pointer">
                    Register Terminal
                  </span>
                </p>
              ) : (
                <p>
                  Have authorization key?{' '}
                  <span onClick={() => setAuthMode('login')} className="text-orange-500 hover:underline cursor-pointer">
                    Log In
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        // --- LOGGED IN: MAIN CORE DASHBOARD ---
        <>
          {/* Header */}
          <header className="border-b border-orange-500/20 bg-black text-white px-6 py-4 sticky top-0 z-50 shadow-md">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-lg font-bold font-mono tracking-tight text-white">
                    MUSCLEKI <span className="text-orange-500">AI</span>
                  </h1>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                    AUTONOMOUS WORKOUT ENGINE
                  </p>
                </div>
              </div>

              {/* User badge and logout */}
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
                  <span className="text-zinc-300 hidden sm:inline">USER:</span>
                  <span className="text-orange-500 font-bold">{user?.email}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-lg transition-colors"
                  title="Disconnect session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10 space-y-8">
            
            {/* System Status and Quick Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-lg">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-[11px] font-mono text-zinc-500 uppercase">AUTONOMOUS STATUS</h4>
                  <p className="text-sm font-bold text-white font-mono flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    LIVE TELEMETRY
                  </p>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-lg">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-mono text-zinc-500 uppercase">ACTIVE ROUTINES</h4>
                  <p className="text-sm font-bold text-white font-mono mt-0.5">
                    {workouts.filter(w => w.status === 'scheduled').length} SCHEDULED
                  </p>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-lg">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-mono text-zinc-500 uppercase">TELEPHONY SYSTEM</h4>
                  <p className="text-sm font-bold text-white font-mono mt-0.5">
                    {reminders.filter(r => r.status === 'pending').length} SMS QUEUED
                  </p>
                </div>
              </div>
            </div>

            {/* Weekly Calendar Overview */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl shadow-black">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-orange-500" />
                  <h2 className="text-md font-bold text-white font-mono tracking-tight uppercase">
                    WEEKLY ROUTINE MATRIX
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      const prev = new Date(currentWeekStart);
                      prev.setDate(prev.getDate() - 7);
                      setCurrentWeekStart(prev);
                    }}
                    className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-orange-500/20 rounded-md text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      const next = new Date(currentWeekStart);
                      next.setDate(next.getDate() + 7);
                      setCurrentWeekStart(next);
                    }}
                    className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-orange-500/20 rounded-md text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {weekDates.map((date, idx) => {
                  const dayWorkouts = workouts.filter(w => {
                    const wDate = new Date(w.scheduled_time);
                    return wDate.toDateString() === date.toDateString();
                  });

                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <div 
                      key={idx} 
                      className={`rounded-xl p-3 border transition-all duration-200 flex flex-col justify-between min-h-[140px] ${
                        isToday 
                          ? 'bg-orange-500/5 border-orange-500/40 shadow-sm shadow-orange-500/5' 
                          : 'bg-zinc-900/20 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-mono font-semibold text-zinc-500 uppercase">
                            {date.toLocaleDateString([], { weekday: 'short' })}
                          </span>
                          <span className={`text-xs font-mono font-bold ${isToday ? 'text-orange-500' : 'text-zinc-300'}`}>
                            {date.getDate()}
                          </span>
                        </div>

                        {/* Workouts in this day */}
                        <div className="space-y-1.5">
                          {dayWorkouts.map(w => (
                            <div 
                              key={w.id} 
                              className={`text-[11px] p-1.5 rounded border leading-tight ${
                                w.status === 'completed' 
                                  ? 'bg-zinc-900/80 border-zinc-850 text-zinc-500 line-through' 
                                  : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                              }`}
                            >
                              <p className="font-semibold truncate">{w.title}</p>
                              <p className="text-[9px] text-zinc-500 mt-0.5">
                                {new Date(w.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          ))}
                          {dayWorkouts.length === 0 && (
                            <p className="text-[10px] text-zinc-600 font-mono italic mt-4 text-center">Rest Day</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Split Operations: Schedule Form & Log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form Input Area */}
              <div className="lg:col-span-1 bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl shadow-black h-fit">
                <div className="pb-4 mb-4 border-b border-zinc-900">
                  <h3 className="text-md font-bold text-white font-mono flex items-center gap-2">
                    <Plus className="w-5 h-5 text-orange-500" />
                    SCHEDULE WORKOUT
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Push new parameters to physical schedule stack</p>
                </div>

                <form onSubmit={handleAddWorkout} className="space-y-4">
                  {scheduleSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{scheduleSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-zinc-400">ROUTINE TITLE *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Posterior Hypertrophy"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-2.5 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-zinc-400">SCHEDULE DATE & TIME *</label>
                    <input
                      type="datetime-local"
                      required
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-2.5 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-zinc-400">REPS & ROUTINE INSTRUCTIONS</label>
                    <textarea
                      placeholder="Sets, reps, targets..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-2.5 text-sm focus:outline-none focus:border-orange-500 resize-none"
                    />
                  </div>

                  <div className="border-t border-zinc-900 pt-3 mt-4 space-y-3">
                    <h4 className="text-xs font-bold font-mono text-orange-500 tracking-wider">SMS TELEPHONY ALERTS</h4>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-mono text-zinc-500">PHONE NUMBER</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 019-2834"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-2.5 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-mono text-zinc-500">DISPATCH LEAD OFFSET</label>
                      <select
                        value={newOffset}
                        onChange={(e) => setNewOffset(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-2.5 text-sm focus:outline-none focus:border-orange-500"
                      >
                        <option value="5">5 minutes before</option>
                        <option value="15">15 minutes before</option>
                        <option value="30">30 minutes before</option>
                        <option value="60">1 hour before</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-500 text-black font-bold font-mono py-3 rounded-xl transition-all duration-200 shadow-md shadow-orange-500/15"
                  >
                    DEPLOY SCHEDULE & REMINDER
                  </button>
                </form>
              </div>

              {/* Workouts Log & Reminders Queue */}
              <div className="lg:col-span-2 space-y-8">
                {/* Workout list */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl shadow-black">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-2 border-b border-zinc-900">
                    <h3 className="text-sm font-bold font-mono text-zinc-400 uppercase tracking-widest">
                      Active Scheduled Workouts
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <label htmlFor="sort-select-sub" className="text-zinc-500">SORT BY:</label>
                      <select
                        id="sort-select-sub"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-orange-500 font-bold px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-orange-500 cursor-pointer"
                      >
                        <option value="date-desc">Date (Newest First)</option>
                        <option value="date-asc">Date (Oldest First)</option>
                        <option value="completed">Completed Status First</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {getSortedWorkouts().map(w => (
                      <div key={w.id} className="border border-zinc-850 bg-zinc-900/10 hover:border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4 transition-all">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white font-mono">{w.title}</span>
                            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                              w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                            }`}>
                              {w.status.toUpperCase()}
                            </span>
                          </div>
                          {w.description && <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">{w.description}</p>}
                          <p className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-orange-500" />
                            {new Date(w.scheduled_time).toLocaleString()}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleDeleteWorkout(w.id)}
                          className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-red-500/30 rounded-lg text-zinc-500 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* API Integration Settings Toggles */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl shadow-black">
                  <div className="pb-3 mb-4 border-b border-zinc-900">
                    <h3 className="text-sm font-bold font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-orange-500" />
                      API TIMELINE GATEWAYS
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono">Google Calendar API</h4>
                        <p className="text-[11px] text-zinc-400 mt-1">Direct calendar entry syncing on routine deployments.</p>
                      </div>
                      <button
                        onClick={() => toggleIntegration('google')}
                        className={`w-full py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                          integrations.google 
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        {integrations.google ? 'GATEWAY: ON' : 'GATEWAY: OFF'}
                      </button>
                    </div>

                    <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono">Outlook.com API</h4>
                        <p className="text-[11px] text-zinc-400 mt-1">Connect corporate calendar streams automatically.</p>
                      </div>
                      <button
                        onClick={() => toggleIntegration('outlook')}
                        className={`w-full py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                          integrations.outlook 
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        {integrations.outlook ? 'GATEWAY: ON' : 'GATEWAY: OFF'}
                      </button>
                    </div>

                    <div className="bg-zinc-900/20 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-white font-mono">SMS Telephony Server</h4>
                        <p className="text-[11px] text-zinc-400 mt-1">Deliver scheduled SMS updates before sessions.</p>
                      </div>
                      <button
                        onClick={() => toggleIntegration('telephony')}
                        className={`w-full py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                          integrations.telephony 
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        {integrations.telephony ? 'GATEWAY: ON' : 'GATEWAY: OFF'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </main>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-6 text-center text-xs font-mono text-zinc-600 mt-12">
        <p>© 2026 Muscleki AI System. Operating terminal under fully authorized user session.</p>
      </footer>
    </div>
  );
}
