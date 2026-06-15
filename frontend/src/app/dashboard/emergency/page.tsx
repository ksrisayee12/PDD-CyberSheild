"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { alertApi, emergencyApi } from "@/services/api";
import api from "@/services/api";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { AlertTriangle, Mail, Download, ShieldAlert } from "lucide-react";

export default function EmergencyPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      emergencyApi.reports(),
      emergencyApi.emailLogs(),
    ]).then(([r, e]) => {
      setReports(r.data.data);
      setEmailLogs(e.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const downloadPdf = async (id: number) => {
    try {
      const res = await emergencyApi.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Emergency_Report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="page-title">Emergency Operations Center</h1>
        <p className="page-subtitle">Critical incident logs and external notifications</p>
      </motion.div>

      {loading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-lg glass-panel animate-pulse" />)}</div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Incident Reports */}
          <div className="glass-panel rounded-lg p-5 sm:p-7 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-[#E1306C]/10 rounded-lg border border-[#E1306C]/30">
                <ShieldAlert className="w-5 h-5 text-[#FCAF45]" />
              </div>
              <h2 className="text-white font-bold text-xl drop-shadow-md">Generated Incident Reports</h2>
            </div>
            
            {reports.length === 0 ? (
              <div className="text-center p-8 border border-[#8B5CF6]/15 rounded-lg bg-[#050816]/50">
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">No high-risk incidents triggered generation.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                <AnimatePresence>
                  {reports.map((r, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      key={r.id} className="p-5 rounded-lg bg-[#050816]/70 border border-[#8B5CF6]/15 shadow-inner hover:bg-[#050816] transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <SeverityBadge level={r.severity} />
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono text-[hsl(var(--muted-foreground))]">{new Date(r.created_at).toLocaleString()}</span>
                          <button onClick={() => downloadPdf(r.id)} className="text-[#FCAF45] hover:text-[#EC4899] transition-colors p-1.5 rounded-md hover:bg-[#8B5CF6]/10" title="Download PDF Report">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-white font-bold tracking-wide">Threat Score: <span className="text-[#FCAF45]">{r.risk_score}/100</span></p>
                      {r.report_data?.content_preview && (
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2 bg-white/[0.02] p-3 rounded-lg border border-white/[0.02] leading-relaxed line-clamp-2">{r.report_data.content_preview}</p>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Email Logs */}
          <div className="glass-panel rounded-lg p-5 sm:p-7 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-[#8B5CF6]/10 rounded-lg border border-[#8B5CF6]/25">
                <Mail className="w-5 h-5 text-[#EC4899]" />
              </div>
              <h2 className="text-white font-bold text-xl drop-shadow-md">Notification Dispatch Log</h2>
            </div>
            
            {emailLogs.length === 0 ? (
              <div className="text-center p-8 border border-[#8B5CF6]/15 rounded-lg bg-[#050816]/50">
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">No automated emails dispatched.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
                <AnimatePresence>
                  {emailLogs.map((l, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      key={l.id} className="p-4 rounded-lg bg-[#050816]/70 border border-[#8B5CF6]/15 shadow-inner"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-bold text-white drop-shadow-sm break-all">{l.recipient}</span>
                        <span className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border shadow-sm ${l.status === "sent" ? "bg-[#8B5CF6]/10 text-[#A855F7] border-[#8B5CF6]/25" : "bg-[#E1306C]/10 text-[#FCAF45] border-[#E1306C]/25"}`}>{l.status}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs font-mono text-[hsl(var(--muted-foreground))]">
                        <span className="text-[#FCAF45]">{l.incident_type}</span>
                        <span>{new Date(l.sent_at).toLocaleString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
