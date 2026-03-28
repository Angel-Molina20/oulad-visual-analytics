export type CoursesResponse = { courses: string[]; count: number }

export type ProfileCount = { cluster: number; students: number }
export type OutcomeCount = { cluster: number; final_result: string; students: number }

export type ProfilesResponse = {
    course_id: string
    profiles: ProfileCount[]
    outcomes: OutcomeCount[]
    note?: string
}

export type TrajectoryRow = {
    week_id: number
    clicks_total: number
    resources_touched: number
    resource_types_touched: number
    events_count: number
    cluster: number
    final_result: string | null
}

export type TrajectoryResponse = {
    course_id: string
    user_id: number
    trajectory: TrajectoryRow[]
    note?: string
}

export type AlertRow = {
    user_id: number
    week_id: number
    clicks_total: number
    resources_touched: number
    events_count: number
    cluster: number
    final_result: string | null
    risk_score: number
    reasons?: string[]
    drop_clicks_pct?: number
    prev_clicks?: number
    prev_events?: number
    prev_resources?: number
    p25_clicks?: number
    p25_events?: number
    p25_resources?: number
    low_clicks?: number
    low_events?: number
    low_resources?: number
    has_prev?: number
}

export type AlertFeedback = {
    id: number
    course_id: string
    week_id: number
    user_id: number
    risk_score: number | null
    status: "open" | "in_review" | "resolved"
    note: string | null
    created_at: string
    updated_at?: string | null
}

export type CohortPoint = {
    week_id: number
    cluster: number
    value: number
    n: number
}

export type CohortsResponse = {
    course_id: string
    metric: string
    series: CohortPoint[]
    note?: string
}

export type BaselineRow = {
    week_id: number
    clicks_mean: number
    resources_mean: number
    events_mean: number
}

export type BaselineResponse = {
    course_id: string
    cluster: number | null
    baseline: BaselineRow[]
    note?: string
}

export type StudentWeekRow = {
    user_id: number
    week_id: number
    clicks_total: number
    resources_touched: number
    events_count: number
    cluster: number
    final_result: string | null
    risk_score?: number
    reasons?: string[]
}

export type StudentWeekResponse = {
    course_id: string
    week_id: number
    user_id: number
    row: StudentWeekRow | null
}

export type AlertsResponse = {
    course_id: string
    week_id: number
    alerts: AlertRow[]
    note?: string
}