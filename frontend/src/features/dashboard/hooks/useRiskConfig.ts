import { useCallback, useEffect, useState } from "react"
import { apiGet, apiPost } from "../../../api/client"

export type RiskConfig = {
    id?: number
    name: string
    w_drop_clicks: number
    w_low_clicks: number
    w_low_events: number
    w_low_resources: number
    drop_threshold: number
    active?: boolean
    created_at?: string
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
    name: "default",
    w_drop_clicks: 0.55,
    w_low_clicks: 0.20,
    w_low_events: 0.15,
    w_low_resources: 0.10,
    drop_threshold: 0.30,
}

export function useRiskConfig() {
    const [active, setActive] = useState<RiskConfig | null>(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [saved, setSaved] = useState(false)

    const fetch = useCallback(() => {
        setLoading(true)
        setError("")
        apiGet<RiskConfig | null>("/ops/risk-config/active")
            .then((r) => setActive(r ?? null))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        fetch()
    }, [fetch])

    const save = useCallback(async (cfg: RiskConfig) => {
        setSaving(true)
        setError("")
        setSaved(false)
        try {
            const result = await apiPost<RiskConfig>("/ops/risk-config", cfg)
            setActive(result)
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Error al guardar")
        } finally {
            setSaving(false)
        }
    }, [])

    return { active, loading, saving, error, saved, save, reload: fetch }
}
