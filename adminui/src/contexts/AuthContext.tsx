"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type User = {
    id: string;
    email: string;
    role: "ADMIN" | "CLIENT";
} | null;

interface AuthContextType {
    user: User;
    token: string | null;
    login: (token: string, user: any) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to determine the storage key prefix based on the current path
const getStorageKeys = (role: "ADMIN" | "CLIENT") => {
    return {
        tokenKey: role === "ADMIN" ? "admin_token" : "client_token",
        userKey: role === "ADMIN" ? "admin_user" : "client_user",
    };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // Determine which role context we are in based on the current pathname
    const currentRole: "ADMIN" | "CLIENT" = pathname.startsWith("/client") ? "CLIENT" : "ADMIN";

    useEffect(() => {
        // Load the correct session based on the current route
        const { tokenKey, userKey } = getStorageKeys(currentRole);
        const savedToken = localStorage.getItem(tokenKey);
        const savedUser = localStorage.getItem(userKey);

        if (savedToken && savedUser && savedUser !== "undefined") {
            try {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
                localStorage.removeItem(userKey);
            }
        } else {
            // Clear state if no valid session for this role
            setToken(null);
            setUser(null);
        }
        setIsLoading(false);
    }, [currentRole]);

    useEffect(() => {
        // Basic route protection
        if (!isLoading) {
            if (pathname.startsWith("/admin") && pathname !== "/admin/login" && (!token || user?.role !== "ADMIN")) {
                router.push("/admin/login");
            }
            if (pathname.startsWith("/client") && pathname !== "/client/login" && (!token || user?.role !== "CLIENT")) {
                router.push("/client/login");
            }
        }
    }, [pathname, token, isLoading, router, user]);

    const login = (newToken: string, newUser: any) => {
        if (!newToken) {
            console.error("Login failed: No token provided");
            return;
        }

        // Handle cases where user data might be flat in the response or missing
        const userData = newUser || { role: pathname.startsWith("/admin") ? "ADMIN" : "CLIENT" };
        const role: "ADMIN" | "CLIENT" = userData.role || (pathname.startsWith("/admin") ? "ADMIN" : "CLIENT");
        const { tokenKey, userKey } = getStorageKeys(role);

        localStorage.setItem(tokenKey, newToken);
        localStorage.setItem(userKey, JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);

        if (role === "ADMIN") {
            router.push("/admin/dashboard");
        } else {
            router.push("/client/dashboard");
        }
    };

    const logout = () => {
        // Only clear the keys for the current role context
        const { tokenKey, userKey } = getStorageKeys(currentRole);
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userKey);
        setToken(null);
        setUser(null);

        if (currentRole === "ADMIN") {
            router.push("/admin/login");
        } else {
            router.push("/client/login");
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
