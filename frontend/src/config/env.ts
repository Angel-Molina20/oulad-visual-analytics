// frontend/src/config/env.ts
function read(name: string, fallback: string) {
    const v = (import.meta.env as any)[name]
    return (typeof v === "string" && v.trim().length > 0) ? v : fallback
}

export const ENV = {
    API_URL: read("VITE_API_URL", "http://localhost:8000"),
}