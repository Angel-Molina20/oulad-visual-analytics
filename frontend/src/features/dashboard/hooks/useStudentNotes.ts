import { useEffect, useMemo, useState } from "react"
import { apiGet } from "../../../api/client"
import type { AlertFeedback } from "../../../types/api"

type NotesFilters = {
    courseId?: string
    userId?: number
    status?: "open" | "in_review" | "resolved"
}

export function useStudentNotes(filters: NotesFilters) {
    const [data, setData] = useState<AlertFeedback[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const query = useMemo(() => {
        const params = new URLSearchParams({ note_only: "true" })
        if (filters.courseId) params.set("course_id", filters.courseId)
        if (filters.userId !== undefined) params.set("user_id", String(filters.userId))
        if (filters.status) params.set("status", filters.status)
        return params.toString()
    }, [filters.courseId, filters.userId, filters.status])

    useEffect(() => {
        setLoading(true)
        setError("")
        apiGet<AlertFeedback[]>(`/ops/alerts/feedback?${query}`)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [query])

    return { data, loading, error }
}

