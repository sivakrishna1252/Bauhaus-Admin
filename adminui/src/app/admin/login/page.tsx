"use client";

import { useState } from "react";
import { MoveRight, Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { adminLogin } from "@/services/authService";
import Link from "next/link";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await adminLogin(email, password);
            login(result.token, { email, role: result.role });
        } catch (err: any) {
            setError(err.message || "Invalid credentials. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7] dark:bg-zinc-950 p-6 font-jakarta">
            <div className="w-full max-w-md">
                <div className="text-center mb-12">
                    <img
                        src="/assests/logo.png"
                        alt="Logo"
                        className="h-14 w-auto object-contain mx-auto mb-8 brightness-0 dark:brightness-0 dark:invert"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <h1 className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.4em]">Administrative Access</h1>
                    <p className="text-4xl font-bold text-zinc-900 dark:text-white mt-4 uppercase tracking-tight">Admin Portal</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-10 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#C5A059]"></div>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <div className="p-4 bg-zinc-900 text-[#C5A059] text-[10px] font-bold uppercase tracking-widest rounded-xl animate-in fade-in duration-500">
                                {error}
                            </div>
                        )}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                <Mail size={12} className="text-[#C5A059]" /> Email Address
                            </label>
                            <Input
                                className="h-12 border-zinc-100 rounded-xl focus:ring-1 focus:ring-[#C5A059] font-bold tracking-widest bg-zinc-50"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                    <Lock size={12} className="text-[#C5A059]" /> Password
                                </label>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    className="h-12 border-zinc-100 rounded-xl focus:ring-1 focus:ring-[#C5A059] font-bold tracking-widest bg-zinc-50 pr-12"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#C5A059] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                    <div className="mt-10 pt-8 border-t border-zinc-50 text-center">
                        <p className="text-[9px] text-zinc-300 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
                            <ShieldCheck size={12} className="text-[#C5A059]" /> Secure Administrative Environment
                        </p>
                    </div>
                </div>

                <p className="text-center mt-10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    <Link href="/" className="text-zinc-400 hover:text-[#C5A059] transition-all flex items-center justify-center gap-2">
                        ← Turn Back
                    </Link>
                </p>
            </div>
        </div>
    );
}
