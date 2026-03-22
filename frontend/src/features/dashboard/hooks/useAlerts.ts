import { useEffect, useState } from "react"
import { apiGet } from "../../../api/client"
import type { AlertsResponse } from "../../../types/api"

export function useAlerts(courseId: string, weekId: number, top = 15) {
    const [data, setData] = useState<AlertsResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!courseId) return
        setLoading(true)
        setError("")
        apiGet<AlertsResponse>(
            `/analytics/courses/${encodeURIComponent(courseId)}/alerts?week_id=${weekId}&top=${top}`
        )
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [courseId, weekId, top])

    return { data, loading, error }
}