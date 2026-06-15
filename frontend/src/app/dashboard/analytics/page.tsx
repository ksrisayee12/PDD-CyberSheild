"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { analyticsApi } from "@/services/api";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend
} from "recharts";

const COLORS = ["#833AB4", "#C13584", "#E1306C", "#FD1D1D", "#FCAF45", "#A855F7"];

const SEVERITY_COLORS: Record<string, string> = {
  Safe: "#8B5CF6",
  Moderate: "#FCAF45",
  High: "#EC4899",
  Critical: "#FD1D1D",
};

const CustomTooltipStyle = {
  background: "#0B1120",
  border: "1px solid rgba(139, 92, 246, 0.25)",
  borderRadius: 8,
  color: "#fff",
};

export default function AnalyticsPage() {
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.trends()
      .then(r => { setTrends(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categoryData = trends?.category_distribution?.filter((d: any) => d.category !== "safe") || [];
  const severityData = (trends?.severity_distribution || []).map((d: any) => ({
    ...d,
    fill: SEVERITY_COLORS[d.severity] || "#06b6d4",
  }));
  const offenderData = trends?.top_offenders?.slice(0, 8) || [];
  const dailyData = trends?.daily_violations || [];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="page-title">Analytics Intelligence</h1>
          <p className="page-subtitle">Toxicity trends and threat vectors</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg glass-panel p-6 h-72 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="page-title">Analytics Intelligence</h1>
        <p className="page-subtitle">Toxicity trends and threat vectors</p>
      </motion.div>

      {/* Daily Violations Trend — full width, most important signal */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-panel rounded-lg p-5 sm:p-7 relative overflow-hidden"
      >
        <h2 className="text-white font-bold text-lg mb-6 relative z-10 flex items-center gap-2">
          <div className="w-1.5 h-6 brand-gradient rounded-full" /> Daily Violations (14d Trend)
        </h2>
        {dailyData.length === 0 || dailyData.every((d: any) => d.count === 0) ? (
          <p className="text-[hsl(var(--muted-foreground))] text-sm">No violations recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.16)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#b6bfd3", fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)} // MM-DD
              />
              <YAxis tick={{ fill: "#b6bfd3", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={CustomTooltipStyle}
                labelFormatter={(l) => `Date: ${l}`}
                formatter={(v: any) => [v, "Violations"]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#EC4899"
                strokeWidth={2}
                dot={{ r: 3, fill: "#FCAF45" }}
                activeDot={{ r: 5, fill: "#FCAF45" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-lg p-5 sm:p-7">
          <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-2"><div className="w-1.5 h-6 bg-[#A855F7] rounded-full" /> Category Distribution</h2>
          {categoryData.length === 0 ? (
            <p className="text-[hsl(var(--muted-foreground))] text-sm">No flagged content yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.2)" />)}
                </Pie>
                <Tooltip contentStyle={CustomTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Severity Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-lg p-5 sm:p-7">
          <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-2"><div className="w-1.5 h-6 bg-[#FCAF45] rounded-full" /> Severity Vectors</h2>
          {severityData.length === 0 ? (
            <p className="text-[hsl(var(--muted-foreground))] text-sm">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={severityData}>
                <XAxis dataKey="severity" tick={{ fill: "#b6bfd3", fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#b6bfd3", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {severityData.map((entry: any, i: number) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Top Offenders Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel rounded-lg p-5 sm:p-7 lg:col-span-2">
          <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-2"><div className="w-1.5 h-6 bg-[#FD1D1D] rounded-full" /> Top Risk Entities</h2>
          {offenderData.length === 0 ? (
            <p className="text-[hsl(var(--muted-foreground))] text-sm">No violations detected yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={offenderData} layout="vertical">
                <XAxis type="number" tick={{ fill: "#b6bfd3", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="username" type="category" tick={{ fill: "#d8deea", fontSize: 12, fontWeight: 500 }} width={120} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                <Bar dataKey="violations" fill="url(#colorRed)" radius={[0, 6, 6, 0]}>
                  {offenderData.map((_: any, i: number) => <Cell key={i} />)}
                </Bar>
                <defs>
                  <linearGradient id="colorRed" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#833AB4" stopOpacity={0.75}/>
                    <stop offset="100%" stopColor="#E1306C" stopOpacity={1}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}
