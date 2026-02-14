const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const headers = new Headers(options.headers);
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    // Handle multipart/form-data: Don't set Content-Type header manually
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        if (response.status === 401) {
            if (typeof window !== "undefined") {
                const currentPath = window.location.pathname;
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                if (currentPath.startsWith("/client")) {
                    window.location.href = "/client/login";
                } else {
                    window.location.href = "/admin/login";
                }
            }
        }
        const errorData = await response.json().catch(() => ({ message: "An error occurred" }));
        throw new Error(errorData.message || "Something went wrong");
    }

    // Handle endpoints that don't return JSON (like some PATCH/DELETE)
    if (response.status === 204) return {} as T;

    return response.json();
}

export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: "GET" }),
    post: <T>(endpoint: string, body: any) =>
        request<T>(endpoint, {
            method: "POST",
            body: body instanceof FormData ? body : JSON.stringify(body),
        }),
    put: <T>(endpoint: string, body: any) =>
        request<T>(endpoint, {
            method: "PUT",
            body: body instanceof FormData ? body : JSON.stringify(body),
        }),
    patch: <T>(endpoint: string, body: any) =>
        request<T>(endpoint, {
            method: "PATCH",
            body: body instanceof FormData ? body : JSON.stringify(body),
        }),
    delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};
