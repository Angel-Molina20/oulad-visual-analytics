import { useEffect, useState } from "react"
import { apiGet } from "../../../api/client"
import type { ProfilesResponse } from "../../../types/api"

export function useProfiles(courseId: string) {
    const [data, setData] = useState<ProfilesResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!courseId) return
        setLoading(true)
        setError("")
        apiGet<ProfilesResponse>(`/analytics/courses/${encodeURIComponent(courseId)}/profiles`)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [courseId])

    return { data, loading, error }
}