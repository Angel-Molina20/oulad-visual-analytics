export type ClusterMeta = {
    code: string
    label: string
    description: string
    tone: "default" | "success" | "warning" | "error"
}

// Estado interno actualizable
let CLUSTER_META: Record<string, ClusterMeta> = {
    "0": {
        code: "C0",
        label: "Cluster 0",
        description: "Perfil sin descripción disponible.",
        tone: "default",
    },
    "1": {
        code: "C1",
        label: "Cluster 1",
        description: "Perfil sin descripción disponible.",
        tone: "default",
    },
    "2": {
        code: "C2",
        label: "Cluster 2",
        description: "Perfil sin descripción disponible.",
        tone: "default",
    },
}

export function getClusterMeta(cluster: string | number): ClusterMeta {
    const key = String(cluster)
    return (
        CLUSTER_META[key] ?? {
            code: `C${key}`,
            label: `Cluster ${key}`,
            description: "Perfil sin descripción disponible.",
            tone: "default",
        }
    )
}

// Ajusta el tono en base a withdraw o fail
function toneFromRates(rate_withdrawn: number, rate_fail: number): ClusterMeta["tone"] {
    if (rate_withdrawn >= 0.20 || rate_fail >= 0.20) return "success"
    if (rate_withdrawn <= 0.10 && rate_fail <= 0.10) return "error"
    return "warning"
}

function toneFromLabel(label: string): ClusterMeta["tone"] | null {
    const l = label.toLowerCase()
    if (l.includes("alta")) return "success"
    if (l.includes("baja")) return "error"
    if (l.includes("media")) return "warning"
    return null
}

type ClusterLabelApi = {
    cluster: number
    label: string
    description: string
    rate_withdrawn?: number
    rate_fail?: number
}

// Carga desde backend y actualiza el mapa
export async function loadClusterMeta(apiUrl: string) {
    const res = await fetch(`${apiUrl}/meta/cluster-labels`)
    if (!res.ok) return

    const json = (await res.json()) as { clusters?: ClusterLabelApi[] }
    const clusters = json.clusters || []

    const next: Record<string, ClusterMeta> = {}
    for (const c of clusters) {
        const key = String(c.cluster)
        const label = c.label || `Cluster ${key}`
        const tone = toneFromLabel(label) ?? toneFromRates(c.rate_withdrawn ?? 0, c.rate_fail ?? 0)

        next[key] = {
            code: `C${key}`,
            label,
            description: c.description || "Perfil sin descripción disponible.",
            tone,
        }
    }

    // Solo reemplaza si llegó algo
    if (Object.keys(next).length) CLUSTER_META = next
}