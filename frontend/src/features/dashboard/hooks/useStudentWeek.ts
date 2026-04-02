import { useState } from "react"
import { apiGet } from "../../../api/client"
import type { StudentWeekResponse } from "../../../types/api"

export function useStudentWeek(courseId: string) {
    const [data, setData] = useState<StudentWeekResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function search(weekId: number, userId: number) {
        if (!courseId || weekId === null || weekId === undefined || !userId) return
        setLoading(true)
        setError("")
        try {
            const r = await apiGet<StudentWeekResponse>(
                `/analytics/courses/${encodeURIComponent(courseId)}/student-week?week_id=${weekId}&user_id=${userId}`
            )
            setData(r)
        } catch (e: any) {
            setError(e.message || "Error")
        } finally {
            setLoading(false)
        }
    }

    function clear() {
        setData(null)
        setError("")
    }

    return { data, loading, error, search, clear }
}