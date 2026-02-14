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

    // Determine which role context we are in
    const [currentRole, setCurrentRole] = useState<"ADMIN" | "CLIENT" | null>(null);

    useEffect(() => {
        // Find which role we have a token for
        const adminToken = localStorage.getItem("admin_token");
        const clientToken = localStorage.getItem("client_token");

        if (pathname.startsWith("/admin")) {
            setCurrentRole("ADMIN");
        } else if (pathname.startsWith("/client")) {
            setCurrentRole("CLIENT");
        } else if (adminToken) {
            setCurrentRole("ADMIN");
        } else if (clientToken) {
            setCurrentRole("CLIENT");
        } else {
            setCurrentRole(null);
        }
    }, [pathname]);

    useEffect(() => {
        if (!currentRole && !pathname.startsWith("/admin") && !pathname.startsWith("/client")) {
            setToken(null);
            setUser(null);
            setIsLoading(false);
            return;
        }

        const role = currentRole || (pathname.startsWith("/admin") ? "ADMIN" : "CLIENT");
        const { tokenKey, userKey } = getStorageKeys(role);
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
            setToken(null);
            setUser(null);
        }
        setIsLoading(false);
    }, [currentRole, pathname]);

    useEffect(() => {
        // Basic route protection
        if (!isLoading) {
            if (pathname.startsWith("/admin") && pathname !== "/admin/login" && (!token || user?.role !== "ADMIN")) {
                router.push("/");
            }
            if (pathname.startsWith("/client") && pathname !== "/client/login" && (!token || user?.role !== "CLIENT")) {
                router.push("/");
            }
        }
    }, [pathname, token, isLoading, router, user]);

    const login = (newToken: string, newUser: any) => {
        if (!newToken) {
            console.error("Login failed: No token provided");
            return;
        }

        const role: "ADMIN" | "CLIENT" = newUser.role || (pathname.startsWith("/admin") ? "ADMIN" : "CLIENT");
        const { tokenKey, userKey } = getStorageKeys(role);

        localStorage.setItem(tokenKey, newToken);
        localStorage.setItem(userKey, JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setCurrentRole(role);

        if (role === "ADMIN") {
            router.push("/admin/dashboard");
        } else {
            router.push("/client/dashboard");
        }
    };

    const logout = () => {
        const role = currentRole || (pathname.startsWith("/admin") ? "ADMIN" : "CLIENT");
        const { tokenKey, userKey } = getStorageKeys(role);
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userKey);
        setToken(null);
        setUser(null);
        setCurrentRole(null);

        router.push("/");
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
