import React from 'react';
import { motion } from 'motion/react';
import { Workout, CalendarToken, Reminder } from '../types';
import { Calendar, Phone, Activity, Trophy } from 'lucide-react';

interface StatsPanelProps {
  workouts: Workout[];
  calendars: CalendarToken[];
  reminders: Reminder[];
}

export default function StatsPanel({ workouts, calendars, reminders }: StatsPanelProps) {
  const activeWorkouts = workouts.filter(w => w.status === 'scheduled' || w.status === 'active').length;
  const completedWorkouts = workouts.filter(w => w.status === 'completed').length;
  const connectedCals = calendars.filter(c => c.connected).length;
  const activeReminders = reminders.filter(r => r.status === 'pending').length;

  const stats = [
    {
      id: "stat-active-workouts",
      title: "Active Routines",
      value: activeWorkouts,
      desc: "Scheduled or in progress",
      icon: Activity,
      color: "from-orange-500 to-amber-600",
    },
    {
      id: "stat-completed-workouts",
      title: "Completed",
      value: completedWorkouts,
      desc: "Workouts successfully logged",
      icon: Trophy,
      color: "from-amber-500 to-yellow-600",
    },
    {
      id: "stat-calendars",
      title: "Calendars Connected",
      value: `${connectedCals}/2`,
      desc: "Google & Outlook API status",
      icon: Calendar,
      color: "from-orange-600 to-zinc-800",
    },
    {
      id: "stat-reminders",
      title: "SMS Queued",
      value: activeReminders,
      desc: "Pending active phone alerts",
      icon: Phone,
      color: "from-orange-500 to-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-5 hover:border-orange-500/40 transition-all duration-300 group shadow-lg shadow-black"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all duration-300" />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{stat.title}</p>
                <h3 className="text-3xl font-bold text-white mt-1 font-mono tracking-tight">
                  {stat.value}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-1">{stat.desc}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-orange-500 group-hover:border-orange-500/30 group-hover:text-orange-400 transition-all duration-300">
                <Icon className="w-5 h-5" id={`stat-icon-${stat.id}`} />
              </div>
            </div>
            {/* Bottom Accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent group-hover:via-orange-500/60 transition-all duration-300" />
          </motion.div>
        );
      })}
    </div>
  );
}
