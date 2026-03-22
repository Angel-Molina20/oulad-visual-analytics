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
}

export type AlertsResponse = {
    course_id: string
    week_id: number
    alerts: AlertRow[]
    note?: string
}