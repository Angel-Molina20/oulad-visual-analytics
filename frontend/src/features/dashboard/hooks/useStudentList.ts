import { useEffect, useState } from "react"
import { apiGet } from "../../../api/client"

export type StudentListRow = {
    user_id: number
    cluster: number
    final_result: string | null
}

type Resp = {
    course_id: string
    students: StudentListRow[]
    note?: string
}

export function useStudentList(courseId: string) {
    const [data, setData] = useState<StudentListRow[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (!courseId) { setData([]); return }
        setLoading(true)
        setError("")
        apiGet<Resp>(`/analytics/courses/${encodeURIComponent(courseId)}/students`)
            .then((r) => setData(r.students ?? []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [courseId])

    return { data, loading, error }
}
