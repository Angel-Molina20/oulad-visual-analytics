import Plot from "react-plotly.js"
import {
    Typography,
    Grid,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Divider,
    Chip,
    Stack,
    TableContainer,
} from "@mui/material"
import type { ProfilesResponse } from "../../../types/api"
import { getClusterMeta } from "../utils/clusterMeta"
import { outcomeLabel, OUTCOME_ORDER } from "../utils/outcomes"
import SectionCard from "./ui/SectionCard"

type ClusterOutcomeRow = {
    cluster: number
    final_result: string
    students: number
    total_students: number
    rate: number // 0..1
}

type Props = {
    data: ProfilesResponse | null
    clusterOutcomes?: ClusterOutcomeRow[] | null
    selectedCluster?: number | null
}

const ORDER = OUTCOME_ORDER

function pct(n: number) {
    return `${(n * 100).toFixed(1)}%`
}

function chipColor(tone: "default" | "success" | "warning" | "error") {
    if (tone === "success") return "success"
    if (tone === "warning") return "warning"
    if (tone === "error") return "error"
    return "default"
}

export default function ProfilesPanel({ data, clusterOutcomes, selectedCluster }: Props) {
    if (!data) return null

    // ====== Distribución de clusters ======
    const clusterIds = data.profiles.map((r) => r.cluster)
    const xCodes = clusterIds.map((c) => getClusterMeta(c).code)
    const yStudents = data.profiles.map((r) => r.students)

    // ====== Matriz de outcomes por cluster (rate) ======
    const byCluster: Record<number, Record<string, number>> = {}
    const totals: Record<number, number> = {}

    ;(clusterOutcomes || []).forEach((r) => {
        byCluster[r.cluster] = byCluster[r.cluster] || {}
        byCluster[r.cluster][r.final_result] = r.rate
        totals[r.cluster] = r.total_students
    })

    // ====== Tabla resumen outcomes ======
    const rows = clusterIds.map((c) => {
        const meta = getClusterMeta(c)
        return {
            cluster: c,
            code: meta.code,
            label: meta.label,
            tone: meta.tone,
            total: totals[c] ?? 0,
            pass: byCluster[c]?.Pass ?? 0,
            dist: byCluster[c]?.Distinction ?? 0,
            fail: byCluster[c]?.Fail ?? 0,
            withd: byCluster[c]?.Withdrawn ?? 0,
        }
    })

    // ====== Treemap data (Curso -> Cluster -> Resultado) ======
    const treemapIds: string[] = []
    const treemapLabels: string[] = []
    const treemapParents: string[] = []
    const treemapValues: number[] = []
    const treemapText: string[] = []
    const selectedMeta = selectedCluster !== null && selectedCluster !== undefined ? getClusterMeta(selectedCluster) : null
    const treemapLevel = selectedMeta ? `cluster-${selectedMeta.code}` : undefined

    // Root
    treemapIds.push("root")
    treemapLabels.push("Curso")
    treemapParents.push("")
    treemapValues.push(clusterIds.length * 100)
    treemapText.push("")

    function normalizeTo100(values: number[]) {
        const sum = values.reduce((a, b) => a + b, 0)
        if (sum <= 0) return values
        const scaled = values.map((v) => (v * 100) / sum)
        // Ajuste final para que sume exacto 100
        const fixed = scaled.map((v) => Number(v.toFixed(2)))
        const diff = 100 - fixed.reduce((a, b) => a + b, 0)
        fixed[0] = Number((fixed[0] + diff).toFixed(2))
        return fixed
    }
    // Cluster nodes
    clusterIds.forEach((c) => {
        const meta = getClusterMeta(c)
        const cid = `cluster-${meta.code}`

        treemapIds.push(cid)
        treemapLabels.push(meta.code)
        treemapParents.push("root")
        treemapValues.push(100)
        treemapText.push(meta.label)
    })

    // Outcome nodes (values = %)
    clusterIds.forEach((c) => {
        const meta = getClusterMeta(c)
        const parentId = `cluster-${meta.code}`

        const raw = ORDER.map((k) => (byCluster[c]?.[k] ?? 0) * 100)
        const vals = normalizeTo100(raw)

        ORDER.forEach((k, i) => {
            treemapIds.push(`${parentId}-${k}`)
            treemapLabels.push(outcomeLabel(k))
            treemapParents.push(parentId)
            treemapValues.push(vals[i])
            treemapText.push(`${meta.label}<br>${outcomeLabel(k)}: ${vals[i].toFixed(1)}%`)
        })
    })

    const TH_SX = { fontWeight: 700, bgcolor: "#f8fafc", borderBottom: "2px solid rgba(15,23,42,0.08)" }

    return (
        <Grid container spacing={2}>
            {/* Izquierda: distribución */}
            <Grid item xs={12}>
                <SectionCard title="Distribución de clusters" subtitle="Número de estudiantes por perfil">
                    <Plot
                        data={[
                            {
                                type: "bar",
                                x: xCodes,
                                y: yStudents,
                                marker: {
                                    color: clusterIds.map((c) => (selectedCluster === c ? "rgba(25,118,210,0.9)" : "rgba(25,118,210,0.35)")),
                                },
                                hovertemplate: "%{x}<br>Estudiantes: %{y}<extra></extra>",
                            },
                        ]}
                        layout={{
                            height: 180,
                            margin: { l: 40, r: 10, t: 10, b: 40 },
                            yaxis: { title: "Estudiantes" },
                            paper_bgcolor: "transparent",
                            plot_bgcolor: "transparent",
                            font: { family: "inherit", size: 12 },
                        }}
                        style={{ width: "100%" }}
                        config={{ displayModeBar: false, responsive: true }}
                        useResizeHandler
                    />

                    <TableContainer sx={{ border: "1px solid rgba(15,23,42,0.06)", borderRadius: 1.5 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={TH_SX}>Cluster</TableCell>
                                    <TableCell sx={TH_SX}>Perfil</TableCell>
                                    <TableCell align="right" sx={TH_SX}>Estudiantes</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.profiles.map((r) => {
                                    const meta = getClusterMeta(r.cluster)
                                    return (
                                        <TableRow
                                            key={r.cluster}
                                            sx={{ bgcolor: selectedCluster === r.cluster ? "rgba(25,118,210,0.06)" : undefined }}
                                        >
                                            <TableCell>{meta.code}</TableCell>
                                            <TableCell>
                                                <Chip size="small" label={meta.label} color={chipColor(meta.tone)} variant="outlined" />
                                            </TableCell>
                                            <TableCell align="right">{r.students}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </SectionCard>
            </Grid>

            {/* Derecha: outcomes */}
            <Grid item xs={12}>
                <SectionCard
                    title="Resultados por cluster"
                    subtitle="Treemap por cluster y resultado. El tamaño representa porcentaje."
                >
                    <Plot
                        data={[
                            {
                                type: "treemap",
                                ids: treemapIds,
                                labels: treemapLabels,
                                parents: treemapParents,
                                values: treemapValues,
                                text: treemapText,
                                textinfo: "label+value",
                                valuesuffix: "%",
                                hovertemplate: "%{text}<extra></extra>",
                                branchvalues: "total",
                                level: treemapLevel,
                            } as any,
                        ]}
                        layout={{
                            height: 260,
                            margin: { l: 10, r: 10, t: 10, b: 10 },
                            paper_bgcolor: "transparent",
                            font: { family: "inherit", size: 12 },
                        }}
                        style={{ width: "100%" }}
                        config={{ displayModeBar: false, responsive: true }}
                        useResizeHandler
                    />

                    <Divider />

                    <Stack spacing={0.5}>
                        <Typography variant="subtitle2" fontWeight={700}>
                            Tabla resumen
                        </Typography>
                        <TableContainer sx={{ border: "1px solid rgba(15,23,42,0.06)", borderRadius: 1.5 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={TH_SX}>Cluster</TableCell>
                                        <TableCell sx={TH_SX}>Perfil</TableCell>
                                        <TableCell align="right" sx={TH_SX}>Total</TableCell>
                                        <TableCell align="right" sx={TH_SX}>Aprobado</TableCell>
                                        <TableCell align="right" sx={TH_SX}>Distinción</TableCell>
                                        <TableCell align="right" sx={TH_SX}>Reprobado</TableCell>
                                        <TableCell align="right" sx={TH_SX}>Retirado</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((r) => (
                                        <TableRow
                                            key={r.cluster}
                                            sx={{ bgcolor: selectedCluster === r.cluster ? "rgba(25,118,210,0.06)" : undefined }}
                                        >
                                            <TableCell>{r.code}</TableCell>
                                            <TableCell>
                                                <Chip size="small" label={r.label} color={chipColor(r.tone)} variant="outlined" />
                                            </TableCell>
                                            <TableCell align="right">{r.total || "-"}</TableCell>
                                            <TableCell align="right">{pct(r.pass)}</TableCell>
                                            <TableCell align="right">{pct(r.dist)}</TableCell>
                                            <TableCell align="right">{pct(r.fail)}</TableCell>
                                            <TableCell align="right">{pct(r.withd)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Typography variant="caption" color="text.secondary">
                            Porcentajes calculados por estudiante-curso, no por semana.
                        </Typography>
                    </Stack>
                </SectionCard>
            </Grid>
        </Grid>
    )
}