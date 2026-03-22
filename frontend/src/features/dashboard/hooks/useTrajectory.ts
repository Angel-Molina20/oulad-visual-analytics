import { useEffect, useMemo, useState } from "react"
import { apiGet } from "../../../api/client"
import type { TrajectoryResponse } from "../../../types/api"

export function useTrajectory(courseId: string, userId: number) {
    const [data, setData] = useState<TrajectoryResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!courseId || !userId) return
        setLoading(true)
        setError("")
        apiGet<TrajectoryResponse>(
            `/analytics/students/${userId}/trajectory?course_id=${encodeURIComponent(courseId)}`
        )
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [courseId, userId])

    const maxWeek = useMemo(() => {
        if (!data?.trajectory?.length) return 1
        return Math.max(...data.trajectory.map((x) => x.week_id))
    }, [data])

    return { data, loading, error, maxWeek }
}