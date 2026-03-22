import { useEffect, useState } from "react"
import { apiGet } from "../../../api/client"

export type ClusterLabel = {
    cluster: number
    label: string
    description: string
    total_students: number
    clicks_mean: number
    resources_mean: number
    events_mean: number
    clicks_std_mean: number
    rate_pass: number
    rate_fail: number
    rate_withdrawn: number
    rate_distinction: number
}

type Resp = { clusters: ClusterLabel[]; note?: string }

export function useClusterLabels() {
    const [data, setData] = useState<ClusterLabel[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        setLoading(true)
        apiGet<Resp>("/meta/cluster-labels")
            .then((r) => setData(r.clusters || []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [])

    return { data, loading, error }
}