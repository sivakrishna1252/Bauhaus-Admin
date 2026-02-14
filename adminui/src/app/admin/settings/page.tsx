"use client";

import { useState, useEffect } from "react";
import {
    Settings,
    Lock,
    Mail,
    User,
    ShieldCheck,
    Loader2,
    CheckCircle2,
    Eye,
    EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAdminProfile } from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";


export default function SettingsPage() {
    const { user } = useAuth();
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (user) setEmail(user.email);
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" });
            return;
        }

        setIsUpdating(true);
        setMessage(null);
        try {
            await updateAdminProfile({
                email,
                ...(newPassword ? { newPassword } : {}),
            });
            setMessage({ type: "success", text: "Profile updated successfully!" });
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Failed to update profile" });
        } finally {
            setIsUpdating(false);
        }
    };


    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-cs-heading dark:text-white">Account Settings</h1>
                <p className="text-cs-text dark:text-zinc-400">Manage your administrative credentials and security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/20 text-cs-primary-200 dark:bg-[#C5A059]/5 dark:border-[#C5A059]/10">
                        <ShieldCheck size={32} className="mb-3" strokeWidth={1.5} />
                        <h3 className="font-bold">Security Tip</h3>
                        <p className="text-sm mt-1 opacity-80 leading-relaxed">
                            Use a strong, unique password to prevent unauthorized access to the client project catalog.
                        </p>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <div className="rounded-2xl border border-cs-border bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            {message && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in zoom-in-95 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <Settings size={18} />}
                                    {message.text}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-cs-heading dark:text-zinc-200">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-cs-text" />
                                        <Input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 h-11 border-cs-border dark:border-zinc-800"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-cs-border dark:border-zinc-800">
                                    <h3 className="text-sm font-bold text-cs-heading mb-4 dark:text-zinc-200 uppercase tracking-widest text-[10px]">Change Password</h3>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-cs-text">New Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-cs-text" />
                                                <Input
                                                    type={showNewPassword ? "text" : "password"}
                                                    placeholder="Leave blank to keep current"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="pl-10 pr-10 h-11 border-cs-border dark:border-zinc-800"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-3.5 text-cs-text hover:text-cs-primary-100 transition-colors dark:hover:text-cs-primary-100"
                                                >
                                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-cs-text">Confirm New Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-cs-text" />
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Repeat new password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="pl-10 pr-10 h-11 border-cs-border dark:border-zinc-800"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-3.5 text-cs-text hover:text-cs-primary-100 transition-colors dark:hover:text-cs-primary-100"
                                                >
                                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="w-full md:w-auto px-8 h-12 bg-cs-primary-100 hover:bg-cs-primary-200 text-white font-bold"
                                >
                                    {isUpdating ? <Loader2 className="animate-spin mr-2" /> : null}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
