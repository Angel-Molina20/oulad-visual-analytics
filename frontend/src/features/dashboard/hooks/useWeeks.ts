import { useEffect, useState } from "react"
import { apiGet } from "../../../api/client"
import type { WeeksResponse } from "../../../types/api"

export function useWeeks(courseId: string) {
    const [data, setData] = useState<WeeksResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!courseId) return
        setLoading(true)
        setError("")
        apiGet<WeeksResponse>(`/analytics/courses/${encodeURIComponent(courseId)}/weeks`)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [courseId])

    return { data, loading, error }
}

