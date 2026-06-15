"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { conversationApi } from "@/services/api";
import { MessageSquare, ArrowLeft, Activity, Flame, BarChart2, Clock } from "lucide-react";

const riskColor = (score: number) =>
  score >= 80 ? "text-[#FCAF45]" : score >= 50 ? "text-[#EC4899]" : score >= 30 ? "text-[#FCAF45]" : "text-[#A855F7]";

const escalationStyle: Record<string, { label: string; class: string }> = {
  escalating:       { label: "Escalating",       class: "bg-[#E1306C]/10 text-[#FCAF45] border-[#E1306C]/30" },
  "de-escalating":  { label: "De-escalating",    class: "bg-[#8B5CF6]/10 text-[#A855F7] border-[#8B5CF6]/30" },
  stable:           { label: "Stable",           class: "bg-[#0B1120] text-[hsl(var(--muted-foreground))] border-[#8B5CF6]/20" },
  insufficient_data:{ label: "Insufficient data", class: "bg-[#0B1120] text-[hsl(var(--muted-foreground))] border-[#8B5CF6]/20" },
};

export default function ConversationsPage() {
  const [convs, setConvs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [intelligence, setIntelligence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [intelLoading, setIntelLoading] = useState(false);

  useEffect(() => {
    conversationApi.list()
      .then(r => { setConvs(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openConv = async (id: number) => {
    const r = await conversationApi.detail(id);
    setSelected(r.data.data);
    setIntelligence(null);

    // Fetch intelligence in parallel
    setIntelLoading(true);
    try {
      const ir = await conversationApi.intelligence(id);
      if (ir.data.success) setIntelligence(ir.data.data);
    } catch {}
    setIntelLoading(false);
  };

  const back = () => { setSelected(null); setIntelligence(null); };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="page-title">Conversation Intelligence</h1>
        <p className="page-subtitle">Deep AI analysis of ongoing direct messages</p>
        <p className="detail-copy mt-1">Escalation vectors and risk changes remain visible without visual noise.</p>
      </motion.div>

      <AnimatePresence mode="wait">
      {selected ? (
        <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
          <button onClick={back} className="flex items-center gap-2 text-sm font-semibold text-[#FCAF45] hover:text-[#EC4899] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Return to Conversations
          </button>

          {/* Conversation header + messages */}
          <div className="glass-panel rounded-lg p-5 sm:p-7 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 relative z-10">
              <div>
                <p className="text-[10px] text-[#FCAF45] font-bold uppercase tracking-widest mb-1.5">Thread Participant</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white break-all">@{selected.conversation.participant}</h2>
              </div>
              <div className="sm:text-right">
                <span className={`text-4xl font-black drop-shadow-md ${riskColor(selected.conversation.risk_score)}`}>
                  {selected.conversation.risk_score}%
                </span>
                <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-bold tracking-wider mt-1">Risk Score</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-6 pb-6 border-b border-white/5 relative z-10">
              <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-[#EC4899]" /> {selected.conversation.message_count} messages</span>
              <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-[#FCAF45]" /> {selected.conversation.flagged_count} flagged</span>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2 relative z-10">
              {selected.messages.map((m: any, idx: number) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={m.id} className="p-4 rounded-lg bg-[#050816]/70 border border-[#8B5CF6]/15 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#FCAF45] font-bold break-all">@{m.sender}</span>
                    {m.timestamp && (
                      <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 opacity-70" />{new Date(m.timestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-white text-sm leading-relaxed">{m.content}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Intelligence Panel */}
          <div className="glass-panel rounded-lg p-5 sm:p-7 relative overflow-hidden border-[#EC4899]/30">
            <div className="absolute inset-0 bg-gradient-to-br from-[#833AB4]/[0.04] to-[#E1306C]/[0.04] pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-[#8B5CF6]/10 rounded-lg border border-[#8B5CF6]/25"><Activity className="w-5 h-5 text-[#EC4899]" /></div>
              <h3 className="text-white font-bold text-xl">Deep Intelligence Engine</h3>
              <span className="sm:ml-2 text-[10px] px-2 py-1 uppercase tracking-widest font-black rounded-full bg-[#8B5CF6]/10 text-[#FCAF45] border border-[#8B5CF6]/20">Domain 7 Active</span>
            </div>

            {intelLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-lg bg-[#050816]/70 border border-[#8B5CF6]/15 animate-pulse" />
                ))}
              </div>
            ) : intelligence ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-6">
                  {/* Escalation status */}
                  <div className="rounded-lg bg-[#050816]/70 border border-[#8B5CF6]/15 p-5 shadow-inner col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase font-bold tracking-widest mb-3">Vector Trajectory</p>
                    {(() => {
                      const s = escalationStyle[intelligence.escalation] ?? escalationStyle.insufficient_data;
                      return (
                        <span className={`text-sm font-bold px-3 py-1.5 rounded-full border shadow-sm ${s.class}`}>
                          {s.label}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="rounded-lg bg-[#050816]/70 border border-[#8B5CF6]/15 p-5 shadow-inner">
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase font-bold tracking-widest mb-1.5">Threat Density</p>
                    <p className={`text-3xl font-black ${riskColor(intelligence.threat_density_percent)} drop-shadow-md`}>
                      {intelligence.threat_density_percent}%
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#050816]/70 border border-[#8B5CF6]/15 p-5 shadow-inner">
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase font-bold tracking-widest mb-1.5">Abuse Freq / Day</p>
                    <p className="text-3xl font-black text-white drop-shadow-md">{intelligence.abuse_frequency_per_day}</p>
                  </div>

                  <div className="rounded-lg bg-[#050816]/70 border border-[#8B5CF6]/15 p-5 shadow-inner">
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase font-bold tracking-widest mb-1.5">Compound Risk</p>
                    <p className={`text-3xl font-black ${riskColor(intelligence.risk_score)} drop-shadow-md`}>
                      {intelligence.risk_score}%
                    </p>
                  </div>
                </div>

                {/* Category breakdown */}
                {intelligence.category_breakdown?.length > 0 && (
                  <div className="pt-5 border-t border-white/5">
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-[#EC4899]" /> Category Breakdown
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {intelligence.category_breakdown.map((cb: any) => (
                        <span key={cb.category} className="px-3 py-1.5 rounded-full bg-[#050816]/80 border border-[#8B5CF6]/20 text-xs text-white font-medium flex items-center gap-2 shadow-inner">
                          {cb.category.replace("_", " ")} 
                          <span className="text-[#FCAF45] font-black">{cb.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] bg-[#050816]/70 p-4 rounded-lg border border-[#8B5CF6]/15 inline-block">
                Intelligence Engine requires at least 4 moderated messages in this thread.
              </p>
            )}
          </div>
        </motion.div>

      ) : loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-lg glass-panel animate-pulse" />)}
        </div>
      ) : convs.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-lg p-8 sm:p-16 text-center border-dashed">
          <MessageSquare className="w-12 h-12 text-[hsl(var(--muted-foreground))] opacity-50 mx-auto mb-4" />
          <p className="text-[hsl(var(--muted-foreground))] font-medium text-lg">No conversation streams collected yet.</p>
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden" animate="show" exit="hidden"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          className="space-y-4"
        >
          {convs.map(conv => (
            <motion.button
              variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}
              key={conv.id}
              onClick={() => openConv(conv.id)}
              className="w-full text-left rounded-lg glass-panel p-5 hover:border-[#EC4899]/40 hover:bg-white/[0.03] transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between relative z-10">
                <span className="text-white font-bold text-lg tracking-wide group-hover:text-[#FCAF45] transition-colors break-all">@{conv.participant}</span>
                <span className={`text-2xl font-black drop-shadow-sm ${riskColor(conv.risk_score)}`}>{conv.risk_score}%</span>
              </div>
              <div className="flex gap-5 text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mt-2 relative z-10">
                <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> {conv.message_count} msgs</span>
                <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> {conv.flagged_count} flagged</span>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
