import { useEffect, useState } from "react"
import { apiGet } from "../../../api/client"

export type ClusterLabel = {
    cluster: number
    label: string
    description: string
    reasons?: string[]
    total_students: number
    clicks_mean: number
    resources_mean: number
    resource_types_mean?: number
    events_mean: number
    clicks_std_mean: number
    trend_ratio?: number
    rate_pass: number
    rate_fail: number
    rate_withdrawn: number
    rate_distinction: number

    // nuevos campos por curso (opcionales)
    course_id?: string
    total_students_course?: number
    clicks_mean_course?: number
    resources_mean_course?: number
    resource_types_mean_course?: number
    events_mean_course?: number
    rate_pass_course?: number
    rate_fail_course?: number
    rate_withdrawn_course?: number
    rate_distinction_course?: number
}

type Resp = { clusters: ClusterLabel[]; note?: string }

export function useClusterLabels(courseId?: string) {
    const [data, setData] = useState<ClusterLabel[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        setLoading(true)
        setError("")
        const q = courseId ? `?course_id=${encodeURIComponent(courseId)}` : ""
        apiGet<Resp>(`/meta/cluster-labels${q}`)
            .then((r) => setData(r.clusters || []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [courseId])

    return { data, loading, error }
}