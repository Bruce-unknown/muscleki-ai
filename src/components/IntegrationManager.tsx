import React from 'react';
import { motion } from 'motion/react';
import { CalendarToken } from '../types';
import { Calendar, CheckCircle2, AlertCircle, RefreshCw, Radio } from 'lucide-react';

interface IntegrationManagerProps {
  calendars: CalendarToken[];
  onToggleConnection: (provider: 'google' | 'outlook') => void;
}

export default function IntegrationManager({ calendars, onToggleConnection }: IntegrationManagerProps) {
  const getCal = (provider: 'google' | 'outlook') => {
    return calendars.find(c => c.provider === provider) || {
      provider,
      connected: false,
      expires_at: '',
      access_token: '',
    };
  };

  const integrations = [
    {
      id: "google-calendar-integration",
      provider: 'google' as const,
      name: "Google Calendar API",
      icon: "https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png", // fallback or render generic icon
      logoBg: "bg-white",
      description: "Auto-synchronize workout schedules, active session alerts, and trigger notification blocks directly to your primary Google Calendar timeline.",
      scopes: ["https://www.googleapis.com/auth/calendar.events", "profile", "email"],
    },
    {
      id: "outlook-calendar-integration",
      provider: 'outlook' as const,
      name: "Microsoft Outlook Calendar",
      icon: "https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg",
      logoBg: "bg-zinc-900/30",
      description: "Push telemetry milestones and scheduling updates seamlessly to Outlook.com, Microsoft 365, or Exchange server timelines.",
      scopes: ["Calendars.ReadWrite", "offline_access", "User.Read"],
    },
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-xl shadow-black relative overflow-hidden" id="integration-manager-panel">
      {/* Background radial highlight */}
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/5 to-transparent rounded-tr-full pointer-events-none" />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
            <Calendar className="w-5 h-5 text-orange-500" />
            CALENDAR INTEGRATIONS
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Authorize cloud calendar updates for seamless cross-device syncing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((integration, index) => {
          const calState = getCal(integration.provider);
          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -15 : 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all duration-300 ${
                calState.connected
                  ? 'border-orange-500/30 bg-orange-500/[0.01]'
                  : 'border-zinc-800 bg-zinc-900/10 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center p-2 border border-zinc-800 ${integration.logoBg}`}>
                      {integration.provider === 'google' ? (
                        <div className="w-6 h-6 bg-orange-500/10 rounded flex items-center justify-center text-orange-500 font-bold text-sm font-mono">G</div>
                      ) : (
                        <div className="w-6 h-6 bg-blue-500/10 rounded flex items-center justify-center text-blue-500 font-bold text-sm font-mono">O</div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono tracking-tight">{integration.name}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {calState.connected ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-emerald-400 font-bold font-mono">AUTHORIZED</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                            <span className="text-[10px] text-zinc-500 font-mono">NOT CONNECTED</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleConnection(integration.provider)}
                    className={`text-xs font-mono font-bold px-3 py-1.5 rounded-md transition-all duration-200 transform active:scale-95 border ${
                      calState.connected
                        ? 'bg-zinc-950 hover:bg-zinc-900 text-orange-500 border-orange-500/20 hover:border-orange-500/40'
                        : 'bg-orange-600 hover:bg-orange-500 text-black border-transparent'
                    }`}
                    id={`connect-btn-${integration.provider}`}
                  >
                    {calState.connected ? 'REVOKE' : 'CONNECT'}
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {integration.description}
                </p>

                {/* Scopes & Technical Info */}
                <div className="space-y-2 border-t border-zinc-800/80 pt-3">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">API SCOPES:</span>
                    <span className="text-zinc-400 max-w-[180px] truncate" title={integration.scopes.join(', ')}>
                      {integration.scopes.slice(0, 2).join(', ')}...
                    </span>
                  </div>

                  {calState.connected && (
                    <>
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-zinc-500">EXPIRES AT:</span>
                        <span className="text-orange-500/80">
                          {new Date(calState.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (24h roll)
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-zinc-500">ACCESS TOKEN:</span>
                        <span className="text-zinc-400 font-mono tracking-tighter">
                          {calState.access_token.substring(0, 18)}...
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Connected Footer Telemetry */}
              {calState.connected && (
                <div className="mt-4 bg-orange-500/5 border border-orange-500/10 rounded-lg p-2.5 flex items-center gap-2.5 text-[11px] font-mono">
                  <Radio className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span className="text-zinc-400">
                    Live endpoint syncing active. Events propagate automatically on modification.
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
