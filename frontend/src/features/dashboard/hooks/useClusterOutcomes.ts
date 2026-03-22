import { useEffect, useState } from "react"
import { apiGet } from "../../../api/client"

export type ClusterOutcomeRow = {
    cluster: number
    final_result: string
    students: number
    total_students: number
    rate: number
}

type Resp = {
    course_id: string
    clusters: ClusterOutcomeRow[]
}

export function useClusterOutcomes(courseId: string) {
    const [data, setData] = useState<ClusterOutcomeRow[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!courseId) return
        setLoading(true)
        setError("")
        apiGet<Resp>(`/analytics/courses/${encodeURIComponent(courseId)}/cluster-outcomes`)
            .then((r) => setData(r.clusters || []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [courseId])

    return { data, loading, error }
}