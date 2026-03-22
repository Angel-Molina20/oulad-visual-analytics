import { useEffect, useState } from "react"
import { apiGet } from "../../../api/client"
import type { CoursesResponse } from "../../../types/api"

export function useCourses() {
    const [courses, setCourses] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        apiGet<CoursesResponse>("/courses")
            .then((r) => setCourses(r.courses))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    return { courses, loading, error }
}