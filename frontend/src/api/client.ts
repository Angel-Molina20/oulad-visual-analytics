import { ENV } from "../config/env"

export async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${ENV.API_URL}${path}`)
    if (!res.ok) throw new Error(`API ${res.status}`)
    return res.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${ENV.API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    return res.json() as Promise<T>
}
