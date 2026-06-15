"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/api";
import Cookies from "js-cookie";
import Link from "next/link";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await authApi.login(form);
      Cookies.set("token", res.data.data.access_token, { expires: 1 });
      router.replace("/dashboard/overview");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4 py-8">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-lg border border-[#8B5CF6]/20 bg-[#0B1120] shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg brand-gradient">
            <Shield className="text-white w-6 h-6" />
          </div>
          <span className="font-scotch text-white font-bold text-2xl">CyberShield AI</span>
        </div>
        <h1 className="page-title mb-1">Sign in</h1>
        <p className="page-subtitle mb-6">Step into a calmer command room</p>
        {error && <p className="text-[#FCAF45] text-sm mb-4 bg-[#E1306C]/10 border border-[#E1306C]/20 px-3 py-2 rounded-lg">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-[hsl(var(--muted-foreground))] mb-1.5 block">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full bg-[#050816] border border-[hsl(var(--border))] text-white rounded-lg px-4 py-2.5 text-sm brand-focus"
              required />
          </div>
          <div>
            <label className="text-sm text-[hsl(var(--muted-foreground))] mb-1.5 block">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              className="w-full bg-[#050816] border border-[hsl(var(--border))] text-white rounded-lg px-4 py-2.5 text-sm brand-focus"
              required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full brand-button py-2.5 text-sm">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-[hsl(var(--muted-foreground))] text-sm text-center mt-6">
          No account? <Link href="/auth/register" className="text-[#FCAF45] hover:text-[#EC4899]">Register</Link>
        </p>
      </div>
    </div>
  );
}
