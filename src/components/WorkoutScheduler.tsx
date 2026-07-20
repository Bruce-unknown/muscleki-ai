import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Workout } from '../types';
import { Plus, Trash2, Calendar, FileText, CheckCircle2, Flame, Play, Check, X, Edit2, Mic, MicOff, Sparkles, RotateCcw } from 'lucide-react';

interface WorkoutSchedulerProps {
  workouts: Workout[];
  onAddWorkout: (workout: Omit<Workout, 'id'>) => void;
  onUpdateWorkout: (id: number, updated: Partial<Workout>) => void;
  onDeleteWorkout: (id: number) => void;
}

export default function WorkoutScheduler({
  workouts,
  onAddWorkout,
  onUpdateWorkout,
  onDeleteWorkout
}: WorkoutSchedulerProps) {
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [status, setStatus] = useState<'scheduled' | 'active' | 'completed' | 'cancelled'>('scheduled');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Keyboard shortcut listener to auto-open workout creation form
  React.useEffect(() => {
    const handleOpenForm = () => {
      setIsFormOpen(true);
      setTimeout(() => {
        const titleInput = document.getElementById('workout-title-input');
        if (titleInput) {
          titleInput.focus();
        }
      }, 150);
    };

    window.addEventListener('open-workout-form', handleOpenForm);
    return () => {
      window.removeEventListener('open-workout-form', handleOpenForm);
    };
  }, []);

  // Dictation States
  const [isDictating, setIsDictating] = useState(false);
  const [dictationTranscript, setDictationTranscript] = useState('');
  const [dictationError, setDictationError] = useState('');
  const [showDictationWorkspace, setShowDictationWorkspace] = useState(false);
  const [parsedVoiceData, setParsedVoiceData] = useState<{ title: string; description: string } | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Voice dictation text parsing
  const parseDictatedText = (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return { title: '', description: '' };

    // Common keywords to split title and description
    const splitKeywords = [
      ' description ',
      ' details ',
      ' focus on ',
      ' focusing on ',
      ' with ',
      ' notes ',
      ' instruct ',
      ' instruction ',
      ' instructions ',
      ' details include '
    ];

    let bestIndex = -1;
    let matchedKeyword = '';

    for (const kw of splitKeywords) {
      const idx = cleanText.toLowerCase().indexOf(kw);
      if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
        bestIndex = idx;
        matchedKeyword = kw;
      }
    }

    let titlePart = '';
    let descPart = '';

    if (bestIndex !== -1) {
      titlePart = cleanText.substring(0, bestIndex).trim();
      descPart = cleanText.substring(bestIndex + matchedKeyword.length).trim();
    } else {
      // Split by first punctuation or sentence
      const punctuationMatch = cleanText.match(/[.,\/#!$%\^&\*;:{}=\-_`~()]/);
      if (punctuationMatch && punctuationMatch.index && punctuationMatch.index > 5) {
        titlePart = cleanText.substring(0, punctuationMatch.index).trim();
        descPart = cleanText.substring(punctuationMatch.index + 1).trim();
      } else {
        // Split by first 5 words if too long
        const words = cleanText.split(' ');
        if (words.length > 5) {
          titlePart = words.slice(0, 4).join(' ');
          descPart = words.slice(4).join(' ');
        } else {
          titlePart = cleanText;
          descPart = '';
        }
      }
    }

    // Format fields beautifully
    if (titlePart) {
      titlePart = titlePart.charAt(0).toUpperCase() + titlePart.slice(1);
    }
    if (descPart) {
      descPart = descPart.charAt(0).toUpperCase() + descPart.slice(1);
    }

    return { title: titlePart, description: descPart };
  };

  const startDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setDictationError('Web Speech API is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsDictating(true);
        setDictationError('');
        setDictationTranscript('');
        setParsedVoiceData(null);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        if (event.error === 'not-allowed') {
          setDictationError('Microphone access is denied. Please enable microphone permissions.');
        } else {
          setDictationError(`Audio capture issue: ${event.error}`);
        }
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setDictationTranscript(currentTranscript);
      };

      recognition.start();
      setRecognitionInstance(recognition);
    } catch (err: any) {
      setDictationError(`Failed to initialize microphone: ${err.message || err}`);
    }
  };

  const stopDictation = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    setIsDictating(false);

    // Parse the transcript
    if (dictationTranscript.trim()) {
      const parsed = parseDictatedText(dictationTranscript);
      setParsedVoiceData(parsed);
    }
  };

  const applyParsedVoiceData = () => {
    if (parsedVoiceData) {
      setTitle(parsedVoiceData.title);
      setDescription(parsedVoiceData.description);
    }
    setShowDictationWorkspace(false);
    setParsedVoiceData(null);
    setDictationTranscript('');
  };

  // Sorting State
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'completed'>('date-desc');

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
        // fallback to newest date first if status is equal
        return new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime();
      });
    }
    return list;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduledTime) return;

    if (editingId !== null) {
      onUpdateWorkout(editingId, {
        title,
        description,
        scheduled_time: scheduledTime,
        status,
      });
      setEditingId(null);
    } else {
      onAddWorkout({
        user_id: 1, // Mock default user
        title,
        description,
        scheduled_time: scheduledTime,
        status,
      });
    }

    // Reset Form
    setTitle('');
    setDescription('');
    setScheduledTime('');
    setStatus('scheduled');
    setIsFormOpen(false);
  };

  const startEdit = (workout: Workout) => {
    setEditingId(workout.id);
    setTitle(workout.title);
    setDescription(workout.description);
    // Format timestamp for datetime-local input
    const formattedDate = new Date(workout.scheduled_time).toISOString().slice(0, 16);
    setScheduledTime(formattedDate);
    setStatus(workout.status);
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setScheduledTime('');
    setStatus('scheduled');
    setIsFormOpen(false);
  };

  const getStatusBadge = (status: Workout['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold font-mono bg-orange-500/10 text-orange-400 border border-orange-500/30 animate-pulse">
            <Flame className="w-3 h-3 fill-orange-400" /> ACTIVE
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> COMPLETED
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold font-mono bg-zinc-900 text-zinc-500 border border-zinc-800 line-through">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold font-mono bg-zinc-900 text-orange-500/80 border border-orange-500/10">
            <Calendar className="w-3 h-3" /> SCHEDULED
          </span>
        );
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl shadow-black relative overflow-hidden" id="workout-scheduler-panel">
      {/* Subtle brand background elements */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-500/5 to-transparent rounded-bl-full pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
            <Flame className="w-5 h-5 text-orange-500" />
            WORKOUT SCHEDULER
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Plan your fitness routines and track execution state</p>
        </div>

        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-black font-bold font-mono text-xs px-4 py-2.5 rounded-lg transition-all duration-300 transform active:scale-95 shadow-md shadow-orange-500/15"
            id="add-workout-btn"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            SCHEDULE WORKOUT
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6 bg-zinc-900/60 border border-zinc-800 rounded-xl p-5"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800/85 mb-2 gap-2">
                <h3 className="text-sm font-bold font-mono text-orange-500 uppercase tracking-wider">
                  {editingId !== null ? '⚡ Edit Workout Routine' : '🔥 Schedule New Session'}
                </h3>
                
                {editingId === null && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDictationWorkspace(!showDictationWorkspace);
                      if (isDictating) stopDictation();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all duration-300 ${
                      showDictationWorkspace 
                        ? 'bg-zinc-950 border-orange-500/40 text-orange-400 hover:border-orange-500 hover:text-orange-300' 
                        : 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/40'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    {showDictationWorkspace ? 'HIDE VOICE ASSISTANT' : 'DICTATE WITH VOICE'}
                  </button>
                )}
              </div>

              {/* Dynamic Voice Dictation Workspace */}
              <AnimatePresence>
                {showDictationWorkspace && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-zinc-950/80 border border-orange-500/20 rounded-xl p-4 space-y-4 mb-4 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 pointer-events-none">
                      <Sparkles className="w-5 h-5 text-orange-500/20 animate-pulse" />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-900">
                      <div>
                        <h4 className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                          VOICE ENTRY HANDLER
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          DICTATE YOUR WORKOUT TITLE AND EXERCISES IN A SINGLE SENTENCE
                        </p>
                      </div>

                      {/* Microphone Toggle Button */}
                      <button
                        type="button"
                        onClick={isDictating ? stopDictation : startDictation}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                          isDictating
                            ? 'bg-orange-600 border-orange-500 text-black hover:bg-orange-500 animate-pulse shadow-lg shadow-orange-500/20'
                            : 'bg-zinc-900 border-zinc-800 text-orange-500 hover:bg-zinc-850 hover:border-orange-500/30'
                        }`}
                      >
                        {isDictating ? (
                          <>
                            <MicOff className="w-4 h-4 text-black animate-bounce" />
                            STOP LISTENING
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4 text-orange-500" />
                            START DICTATION
                          </>
                        )}
                      </button>
                    </div>

                    {dictationError && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-[11px] text-red-400 font-mono">
                        ⚠️ {dictationError}
                      </div>
                    )}

                    {/* Live Dictation Display */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">SPEECH RECOGNITION TRANSLATION</span>
                        {isDictating && <span className="text-[10px] font-mono text-orange-500 animate-pulse">MIC ACTIVE...</span>}
                      </div>
                      <div className="bg-zinc-900/60 border border-zinc-850 rounded-xl p-3 min-h-[60px] text-xs leading-relaxed text-zinc-300">
                        {dictationTranscript ? (
                          <span className="text-white italic">"{dictationTranscript}"</span>
                        ) : (
                          <span className="text-zinc-600 font-mono">
                            Click 'START DICTATION' and speak into your microphone. Say what workout you want to plan and describe the sets/reps.
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-zinc-500 italic">
                        💡 Tip: Say something like: "Incline Chest Day focus on incline bench press 4 sets of 8 and lateral raises 4 sets of 12"
                      </p>
                    </div>

                    {/* Parsed Output Preview */}
                    <AnimatePresence>
                      {parsedVoiceData && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3.5 space-y-3"
                        >
                          <div className="flex items-center gap-1.5 text-xs font-mono text-orange-500 font-bold">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            PARSED TELEMETRY PREVIEW
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-zinc-500">IDENTIFIED TITLE</span>
                              <input
                                type="text"
                                value={parsedVoiceData.title}
                                onChange={(e) => setParsedVoiceData({ ...parsedVoiceData, title: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-orange-500 font-bold"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-zinc-500">IDENTIFIED DESCRIPTION</span>
                              <textarea
                                value={parsedVoiceData.description}
                                onChange={(e) => setParsedVoiceData({ ...parsedVoiceData, description: e.target.value })}
                                rows={2}
                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg p-2 text-xs focus:outline-none focus:border-orange-500 resize-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setParsedVoiceData(null);
                                setDictationTranscript('');
                              }}
                              className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-400 transition-colors"
                            >
                              DISCARD
                            </button>
                            <button
                              type="button"
                              onClick={applyParsedVoiceData}
                              className="flex items-center gap-1 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-bold font-mono rounded-lg text-[11px] transition-colors shadow-md shadow-orange-500/15"
                            >
                              <Check className="w-3.5 h-3.5" />
                              APPLY TO FORM
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-zinc-400">Workout Title *</label>
                  <input
                    type="text"
                    id="workout-title-input"
                    required
                    placeholder="e.g. Hypertrophy Push A, Powerlifting Squat, Yoga Flow"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-zinc-400">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-zinc-400">Target Routine / Description</label>
                <textarea
                  placeholder="Set details, target reps, weights, or dynamic notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="bg-zinc-950 border border-zinc-800 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
                />
              </div>

              {editingId !== null && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-zinc-400">Status State</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['scheduled', 'active', 'completed', 'cancelled'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`py-2 px-1 rounded text-[11px] font-mono font-bold uppercase border transition-all duration-200 ${
                          status === s
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500'
                            : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={editingId !== null ? cancelEdit : () => setIsFormOpen(false)}
                  className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-xs font-bold rounded-lg transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-black font-mono text-xs font-bold rounded-lg transition-colors shadow-md shadow-orange-500/10"
                >
                  {editingId !== null ? 'UPDATE SCHEDULE' : 'CONFIRM ROUTINE'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workouts List */}
      <div className="space-y-3">
        {workouts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
            <Calendar className="w-10 h-10 text-zinc-600 mx-auto mb-2.5" />
            <p className="text-sm font-mono text-zinc-400">No scheduled workouts found.</p>
            <p className="text-xs text-zinc-500 mt-1">Get started by creating your first session above!</p>
          </div>
        ) : (
          <>
            {/* Sorting Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-900/40 border border-zinc-800/60 px-4 py-2.5 rounded-xl mb-4 text-xs font-mono gap-2">
              <span className="text-zinc-500 uppercase tracking-wider font-semibold">ROUTINES CONTROL</span>
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="text-zinc-400">SORT BY:</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-850 text-orange-500 hover:text-orange-400 font-bold px-2 py-1.5 rounded-lg focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="completed">Completion Status First</option>
                </select>
              </div>
            </div>

            <AnimatePresence>
              {getSortedWorkouts().map((workout) => (
              <motion.div
                key={workout.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`group border rounded-xl p-4 transition-all duration-300 bg-zinc-900/40 relative overflow-hidden ${
                  workout.status === 'active'
                    ? 'border-orange-500/50 shadow-md shadow-orange-500/5 bg-gradient-to-r from-orange-500/5 via-zinc-900/40 to-transparent'
                    : 'border-zinc-800/80 hover:border-orange-500/30'
                }`}
              >
                {/* Active left indicator */}
                {workout.status === 'active' && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-orange-500" />
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors font-mono tracking-tight">
                        {workout.title}
                      </h3>
                      {getStatusBadge(workout.status)}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" />
                      <span>
                        {new Date(workout.scheduled_time).toLocaleString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {workout.description && (
                      <p className="text-xs text-zinc-400 font-sans mt-2 max-w-2xl leading-relaxed bg-black/40 p-2 rounded border border-zinc-800/60 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                        <span>{workout.description}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {/* Quick status cycle buttons */}
                    {workout.status === 'scheduled' && (
                      <button
                        onClick={() => onUpdateWorkout(workout.id, { status: 'active' })}
                        title="Start Workout"
                        className="p-2 bg-zinc-900 border border-zinc-800 text-orange-500 hover:text-orange-400 hover:border-orange-500/30 rounded-lg transition-colors"
                      >
                        <Play className="w-4 h-4 fill-orange-500/25" />
                      </button>
                    )}

                    {workout.status === 'active' && (
                      <button
                        onClick={() => onUpdateWorkout(workout.id, { status: 'completed' })}
                        title="Complete Workout"
                        className="p-2 bg-orange-500 text-black hover:bg-orange-400 rounded-lg font-bold transition-colors"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    )}

                    <button
                      onClick={() => startEdit(workout)}
                      title="Edit Session"
                      className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteWorkout(workout.id)}
                      title="Delete Session"
                      className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-500 hover:border-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
