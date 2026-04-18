import { useEffect, useState } from "react"
import { apiGet } from "../../../api/client"

export type OverviewKpis = {
    total_students: number
    total_weeks: number
    week_min: number
    week_max: number
    avg_clicks_per_student_week: number
    at_risk_count: number
    most_active_week: number | null
    most_active_week_clicks: number
}

export type ResultDistRow = {
    final_result: string
    students: number
}

export type ClusterDistRow = {
    cluster: number
    students: number
}

export type WeeklyActivityRow = {
    week_id: number
    clicks_total: number
    events_total: number
    active_students: number
}

export type OverviewData = {
    course_id: string
    kpis: OverviewKpis
    results_dist: ResultDistRow[]
    cluster_dist: ClusterDistRow[]
    weekly_activity: WeeklyActivityRow[]
}

export function useOverview(courseId: string) {
    const [data, setData] = useState<OverviewData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!courseId) return
        setLoading(true)
        setError("")
        apiGet<OverviewData>(`/analytics/courses/${encodeURIComponent(courseId)}/overview`)
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [courseId])

    return { data, loading, error }
}
