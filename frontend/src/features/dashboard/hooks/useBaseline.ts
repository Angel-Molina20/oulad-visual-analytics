import { useEffect, useMemo, useState } from "react"
import { apiGet } from "../../../api/client"
import type { BaselineResponse, BaselineRow } from "../../../types/api"

export function useBaseline(courseId: string, cluster: number | null) {
    const [data, setData] = useState<BaselineResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const byWeek = useMemo(() => {
        const map = new Map<number, BaselineRow>()
        if (!data?.baseline) return map
        data.baseline.forEach((row) => {
            map.set(row.week_id, row)
        })
        return map
    }, [data])

    useEffect(() => {
        if (!courseId) return
        setLoading(true)
        setError("")

        const q = cluster === null ? "" : `?cluster=${cluster}`
        apiGet<BaselineResponse>(`/analytics/courses/${encodeURIComponent(courseId)}/baseline${q}`)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [courseId, cluster])

    return { data, loading, error, byWeek }
}