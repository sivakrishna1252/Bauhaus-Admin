"use client";

import { useState } from "react";
import {
  MoveRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Loader2,
  User,
  KeyRound,
  UserCircle,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { unifiedLogin } from "@/services/authService";
import Image from "next/image";
import logo from "../assests/logo.png";

export default function UnifiedLoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await unifiedLogin(identifier, secret);
      login(result.token, result);
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7] dark:bg-zinc-950 p-6 font-jakarta">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src={logo}
            alt="Bauhaus Spaces"
            width={240}
            height={80}
            className="h-auto w-auto max-w-[200px] mx-auto mb-8 invert dark:invert-0"
            priority
          />
          <h1 className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.4em] mb-2">Authenticated Access</h1>
          <p className="text-4xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Login Portal</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-10 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#C5A059]"></div>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-zinc-900 text-[#C5A059] text-[10px] font-bold uppercase tracking-widest rounded-xl animate-in fade-in duration-500 text-center">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <User size={12} className="text-[#C5A059]" /> Email or Username
              </label>
              <Input
                className="h-12 border-zinc-100 rounded-xl focus:ring-1 focus:ring-[#C5A059] font-bold tracking-widest bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700"
                placeholder="Enter your credentials"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoCapitalize="none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Lock size={12} className="text-[#C5A059]" /> Password or PIN
              </label>
              <div className="relative">
                <Input
                  type={showSecret ? "text" : "password"}
                  className="h-12 border-zinc-100 rounded-xl focus:ring-1 focus:ring-[#C5A059] font-bold bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 pr-12 tracking-widest"
                  placeholder="••••••••"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#C5A059] transition-colors"
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-zinc-900 hover:bg-[#C5A059] text-white font-bold uppercase tracking-widest text-[10px] transition-all rounded-xl shadow-lg flex items-center justify-center gap-3 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  <span>Enter System</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
          <div className="mt-10 pt-8 border-t border-zinc-50 dark:border-zinc-800 text-center">
            <p className="text-[9px] text-zinc-300 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
              <ShieldCheck size={12} className="text-[#C5A059]" />
              Secure Architectural Gateway
            </p>
          </div>
        </div>

        <p className="text-center mt-10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          &copy; 2025 BAUHAUS SPACES &bull; INTERIOR MANAGEMENT
        </p>
      </div>
    </div>
  );
}
