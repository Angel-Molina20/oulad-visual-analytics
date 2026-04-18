import { useEffect, useState } from "react"
import { apiGet } from "../../../api/client"

export type ClassifierMeta = {
    available: boolean
    model_type?: string
    features?: string[]
    classes?: string[]
    n_samples?: number
    cv_accuracy?: number
    cv_f1_weighted?: number
    cv_accuracy_per_fold?: number[]
    cv_f1_per_fold?: number[]
    class_distribution?: Record<string, number>
    feature_importances?: Record<string, number>
    full_data_report?: Record<string, unknown>
    note?: string
}

export function useClassifierMeta() {
    const [data, setData] = useState<ClassifierMeta | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        setLoading(true)
        setError("")
        apiGet<ClassifierMeta>("/analytics/classifier/meta")
            .then(setData)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    return { data, loading, error }
}
