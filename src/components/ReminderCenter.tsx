import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Reminder, Workout } from '../types';
import { Phone, MessageSquare, Plus, RefreshCw, Send, CheckCircle2, Clock, XCircle, AlertCircle, Volume2 } from 'lucide-react';

interface ReminderCenterProps {
  reminders: Reminder[];
  workouts: Workout[];
  onAddReminder: (reminder: Omit<Reminder, 'id'>) => void;
  onTriggerReminderStatus: (id: number, status: 'sent' | 'failed') => void;
  onTestSound?: () => void;
}

export default function ReminderCenter({
  reminders,
  workouts,
  onAddReminder,
  onTriggerReminderStatus,
  onTestSound
}: ReminderCenterProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('');
  const [triggerOffset, setTriggerOffset] = useState<string>('15'); // default 15 mins before
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !selectedWorkoutId) return;

    setIsSubmitting(true);
    const workout = workouts.find(w => w.id === Number(selectedWorkoutId));
    if (!workout) return;

    // Calculate dynamic trigger time based on workout time minus offset
    const workoutTime = new Date(workout.scheduled_time);
    const triggerTime = new Date(workoutTime.getTime() - Number(triggerOffset) * 60000);

    onAddReminder({
      workout_id: Number(selectedWorkoutId),
      workout_title: workout.title,
      phone_number: phoneNumber,
      trigger_time: triggerTime.toISOString(),
      status: 'pending'
    });

    setPhoneNumber('');
    setSelectedWorkoutId('');
    setIsSubmitting(false);
  };

  const getStatusIcon = (status: Reminder['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-orange-400 animate-pulse" />;
    }
  };

  const getStatusClass = (status: Reminder['status']) => {
    switch (status) {
      case 'sent':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl shadow-black relative overflow-hidden" id="reminder-center-panel">
      {/* Subtle orange background glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
            <Phone className="w-5 h-5 text-orange-500" />
            TELEPHONY & SMS REMINDERS
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Configure cellular alerts and dispatch voice/SMS summaries</p>
        </div>
        {onTestSound && (
          <button
            type="button"
            onClick={onTestSound}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/40 text-xs font-mono font-bold transition-all duration-300 shadow-md shadow-orange-500/5 hover:shadow-orange-500/10 shrink-0"
            title="Play Test Browser Alert Sound"
          >
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            TEST CHIME
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduler Form */}
        <div className="lg:col-span-1 bg-zinc-900/30 border border-zinc-850 rounded-xl p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-bold font-mono text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Queue Alert
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-zinc-400">Target Workout *</label>
              <select
                required
                value={selectedWorkoutId}
                onChange={(e) => setSelectedWorkoutId(e.target.value)}
                className="bg-zinc-950 border border-zinc-850 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors w-full"
              >
                <option value="">-- Select Scheduled Workout --</option>
                {workouts
                  .filter(w => w.status === 'scheduled' || w.status === 'active')
                  .map(w => (
                    <option key={w.id} value={w.id}>
                      {w.title} ({new Date(w.scheduled_time).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-zinc-400">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+1 (555) 019-2834"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-zinc-950 border border-zinc-850 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-zinc-400">Trigger Time Offset</label>
              <select
                value={triggerOffset}
                onChange={(e) => setTriggerOffset(e.target.value)}
                className="bg-zinc-950 border border-zinc-850 text-white rounded-lg p-2.5 text-sm focus:outline-none focus:border-orange-500 transition-colors w-full"
              >
                <option value="0">At scheduled workout time</option>
                <option value="5">5 minutes before workout</option>
                <option value="15">15 minutes before workout</option>
                <option value="30">30 minutes before workout</option>
                <option value="60">1 hour before workout</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || workouts.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-850 disabled:cursor-not-allowed text-black font-bold font-mono text-xs py-3 rounded-lg transition-all duration-300 transform active:scale-95 shadow-md shadow-orange-500/10"
              id="queue-alert-btn"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              QUEUE TELEPHONY ALERT
            </button>
          </form>
        </div>

        {/* Reminders Dispatch Queue Log */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            <h3 className="text-xs font-bold font-mono text-zinc-500 uppercase tracking-widest mb-2">
              DISPATCH QUEUE LOG
            </h3>

            {reminders.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-850 rounded-xl">
                <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs font-mono text-zinc-500">No active SMS alerts queued.</p>
              </div>
            ) : (
              <AnimatePresence>
                {[...reminders].reverse().map((reminder) => (
                  <motion.div
                    key={reminder.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="border border-zinc-850 bg-zinc-900/10 rounded-xl p-3.5 flex items-center justify-between gap-4 hover:border-zinc-700 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-orange-500 mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-white">{reminder.phone_number}</span>
                          <span className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded border ${getStatusClass(reminder.status)}`}>
                            {reminder.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1 font-sans">
                          Routine Alert: <span className="text-orange-500/90 font-mono font-medium">{reminder.workout_title || 'Workout Schedule'}</span>
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Trigger: {new Date(reminder.trigger_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Simulation Controller */}
                    {reminder.status === 'pending' && (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => onTriggerReminderStatus(reminder.id, 'sent')}
                          title="Simulate SMS Success"
                          className="p-1.5 bg-zinc-900 border border-zinc-800 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30 rounded-md transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onTriggerReminderStatus(reminder.id, 'failed')}
                          title="Simulate Delivery Failure"
                          className="p-1.5 bg-zinc-900 border border-zinc-800 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 rounded-md transition-colors"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {reminder.status !== 'pending' && (
                      <div className="p-1.5 shrink-0">
                        {getStatusIcon(reminder.status)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="mt-4 border-t border-zinc-850/60 pt-3 text-[10px] text-zinc-500 font-mono flex items-center gap-2 bg-black/30 p-2.5 rounded-lg border border-zinc-850">
            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
            <span>
              Real-time telephony binds with twilio or standard cellular routes. Status updates reflect simulated gateway pings.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
