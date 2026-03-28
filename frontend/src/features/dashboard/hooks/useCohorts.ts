import { useEffect, useState } from "react"
import { apiGet } from "../../../api/client"
import type { CohortsResponse } from "../../../types/api"

export function useCohorts(courseId: string, metric: string, weekMin: number | null, weekMax: number | null) {
    const [data, setData] = useState<CohortsResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!courseId) return
        setLoading(true)
        setError("")

        const params = new URLSearchParams()
        params.set("metric", metric)
        if (weekMin !== null) params.set("week_min", String(weekMin))
        if (weekMax !== null) params.set("week_max", String(weekMax))

        apiGet<CohortsResponse>(`/analytics/courses/${encodeURIComponent(courseId)}/cohorts?${params.toString()}`)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [courseId, metric, weekMin, weekMax])

    return { data, loading, error }
}