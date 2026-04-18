import { useEffect, useState } from "react"
import { apiGet } from "../../../api/client"
import type { TrajectoryResponse } from "../../../types/api"

export type MultiTrajectoryResult = {
    userId: number
    data: TrajectoryResponse | null
    loading: boolean
    error: string
}

export function useMultiTrajectory(courseId: string, userIds: number[]) {
    const [results, setResults] = useState<MultiTrajectoryResult[]>([])

    useEffect(() => {
        if (!courseId || userIds.length === 0) {
            setResults([])
            return
        }

        // Inicializa estado con loading=true para cada ID
        setResults(
            userIds.map((userId) => ({ userId, data: null, loading: true, error: "" }))
        )

        // Fetch en paralelo
        userIds.forEach((userId) => {
            apiGet<TrajectoryResponse>(
                `/analytics/students/${userId}/trajectory?course_id=${encodeURIComponent(courseId)}`
            )
                .then((data) => {
                    setResults((prev) =>
                        prev.map((r) =>
                            r.userId === userId ? { ...r, data, loading: false } : r
                        )
                    )
                })
                .catch((e) => {
                    setResults((prev) =>
                        prev.map((r) =>
                            r.userId === userId
                                ? { ...r, loading: false, error: e.message }
                                : r
                        )
                    )
                })
        })
    }, [courseId, userIds.join(",")])  // eslint-disable-line react-hooks/exhaustive-deps

    return results
}
