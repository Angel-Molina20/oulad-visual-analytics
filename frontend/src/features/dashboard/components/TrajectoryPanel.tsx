import Plot from "react-plotly.js"
import {
    Grid,
    Table,
    Chip,
    Button,
    Stack,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Typography,
} from "@mui/material"
import SectionCard from "../components/ui/SectionCard"
import InsightCard from "../components/ui/InsightCard"
import AnalysisDialog from "../components/ui/AnalysisDialog"
import { getTrajectoryRecommendations } from "../utils/recommendations"
import { getTrajectoryInsights } from "../utils/insights"
import { getTrajectoryConclusion } from "../utils/conclusions"
import { getClusterMeta } from "../utils/clusterMeta"
import { ToggleButton, ToggleButtonGroup } from "@mui/material"
import { useBaseline } from "../hooks/useBaseline"
import type { TrajectoryResponse } from "../../../types/api"
import {useState, useEffect, useRef} from "react";

export default function TrajectoryPanel({ data, courseId, selectedWeek }: { data: TrajectoryResponse | null, courseId: string, selectedWeek: number | null }) {
    if (!data) return null

    const [baselineMode, setBaselineMode] = useState<"course" | "cluster">("course")

    const studentCluster =
        data?.trajectory?.length ? data.trajectory[data.trajectory.length - 1].cluster : null

    const baseline = useBaseline(courseId, baselineMode === "course" ? null : studentCluster)

    const bWeeks = baseline.data?.baseline?.map((b) => b.week_id) ?? []
    const bClicks = baseline.data?.baseline?.map((b) => b.clicks_mean) ?? []
    const bResources = baseline.data?.baseline?.map((b) => b.resources_mean) ?? []

    const weeks = data.trajectory.map((t) => t.week_id)
    const clicks = data.trajectory.map((t) => t.clicks_total)
    const resources = data.trajectory.map((t) => t.resources_touched)
    const [analysisOpen, setAnalysisOpen] = useState(false)
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const peakClicks = Math.max(...clicks)
    const peakWeek = data.trajectory.find((t) => t.clicks_total === peakClicks)?.week_id ?? "-"
    const avgClicks = Math.round(clicks.reduce((acc, val) => acc + val, 0) / clicks.length)

    const clustersCount = data.trajectory.reduce<Record<string, number>>((acc, item) => {
        const code = getClusterMeta(item.cluster).code
        acc[code] = (acc[code] || 0) + 1
        return acc
    }, {})

    const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({})

    useEffect(() => {
        if (selectedWeek === null) return
        const el = rowRefs.current[selectedWeek]
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
    }, [selectedWeek])

    const shapes =
        selectedWeek === null
            ? []
            : [
                {
                    type: "line",
                    x0: selectedWeek,
                    x1: selectedWeek,
                    y0: 0,
                    y1: 1,
                    yref: "paper",
                    line: { width: 2 },
                },
            ]

    const dominantCluster = Object.keys(clustersCount).reduce(
        (best, key) => (clustersCount[key] > (clustersCount[best] || 0) ? key : best),
        Object.keys(clustersCount)[0] ?? "-"
    )

    const dominantClusterMeta = getClusterMeta(dominantCluster.replace("C", ""))
    const trajectoryNarrative = getTrajectoryInsights(data)
    const trajectoryRecommendations = getTrajectoryRecommendations(data)
    const trajectoryConclusion = getTrajectoryConclusion(data)

    const firstClicks = clicks[0] ?? 0
    const lastClicks = clicks[clicks.length - 1] ?? 0
    const clickChange =
        firstClicks > 0 ? (((lastClicks - firstClicks) / firstClicks) * 100).toFixed(1) : "0.0"

    const paginatedRows = data.trajectory.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    )

    return (
        <SectionCard
            subtitle="Lectura temporal de la actividad semanal del estudiante."
        >
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <InsightCard
                        title="Pico de actividad"
                        value={`Semana ${peakWeek}`}
                        description={`Máximo de ${peakClicks} clicks registrados.`}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <InsightCard
                        title="Promedio de clicks"
                        value={`${avgClicks}`}
                        description="Media semanal de interacciones del estudiante."
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <InsightCard
                        title="Cluster dominante"
                        value={`${dominantClusterMeta.code}, ${dominantClusterMeta.label}`}
                        description={dominantClusterMeta.description}
                    />
                </Grid>

                <Grid item xs={12} md={3}>
                    <InsightCard
                        title="Cambio de actividad"
                        value={`${clickChange}%`}
                        description="Variación entre la primera y la última semana registrada."
                    />
                </Grid>
            </Grid>

            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
            >
                <Typography variant="body2" color="text.secondary">
                    Observa picos, caídas prolongadas y cambios de cluster para entender la evolución del estudiante.
                </Typography>

                <ToggleButtonGroup
                    size="small"
                    value={baselineMode}
                    exclusive
                    onChange={(_, v) => v && setBaselineMode(v)}
                >
                    <ToggleButton value="course">Referencia curso</ToggleButton>
                    <ToggleButton value="cluster">Referencia perfil</ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <AnalysisDialog
                open={analysisOpen}
                onClose={() => setAnalysisOpen(false)}
                title={`Análisis del estudiante ${data.user_id}`}
                subtitle="Lectura interpretativa de la trayectoria semanal."
                conclusion={trajectoryConclusion}
                insights={trajectoryNarrative}
                recommendations={trajectoryRecommendations}
            />

            <Plot
                data={[
                    { type: "scatter", mode: "lines+markers", name: "Clicks (estudiante)", x: weeks, y: clicks },
                    {
                        type: "scatter",
                        mode: "lines",
                        name: baselineMode === "course" ? "Clicks (prom. curso)" : "Clicks (prom. perfil)",
                        x: bWeeks,
                        y: bClicks,
                    },
                    { type: "scatter", mode: "lines+markers", name: "Recursos (estudiante)", x: weeks, y: resources },
                    {
                        type: "scatter",
                        mode: "lines",
                        name: baselineMode === "course" ? "Recursos (prom. curso)" : "Recursos (prom. perfil)",
                        x: bWeeks,
                        y: bResources,
                    },
                ]}
                layout={{
                    height: 340,
                    margin: { l: 50, r: 20, t: 10, b: 40 },
                    legend: { orientation: "h", y: 1.18 },
                    shapes,
                }}
                style={{ width: "100%" }}
                config={{ responsive: true, displayModeBar: false }}
            />

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell align="right">Semana</TableCell>
                            <TableCell align="right">Clicks</TableCell>
                            <TableCell align="right">Recursos</TableCell>
                            <TableCell align="right">Tipos</TableCell>
                            <TableCell align="right">Eventos</TableCell>
                            <TableCell align="right">Cluster</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {paginatedRows.map((t) => {
                            const metaRow = getClusterMeta(t.cluster)

                            return (
                                <TableRow
                                    key={t.week_id}
                                    hover
                                    ref={(el) => {
                                        rowRefs.current[t.week_id] = el
                                    }}
                                    sx={{
                                        backgroundColor: selectedWeek === t.week_id ? "rgba(25, 118, 210, 0.08)" : undefined,
                                    }}
                                >
                                    <TableCell align="right">{t.week_id}</TableCell>
                                    <TableCell align="right">{t.clicks_total}</TableCell>
                                    <TableCell align="right">{t.resources_touched}</TableCell>
                                    <TableCell align="right">{t.resource_types_touched}</TableCell>
                                    <TableCell align="right">{t.events_count}</TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            size="small"
                                            label={`${metaRow.code} · ${metaRow.label}`}
                                            color={
                                                metaRow.tone === "success"
                                                    ? "success"
                                                    : metaRow.tone === "warning"
                                                        ? "warning"
                                                        : metaRow.tone === "error"
                                                            ? "error"
                                                            : "default"
                                            }
                                            variant="outlined"
                                        />
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>

                <TablePagination
                    component="div"
                    count={data.trajectory.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(Number(e.target.value))
                        setPage(0)
                    }}
                    rowsPerPageOptions={[5, 10, 20, 50]}
                    labelRowsPerPage="Filas por página"
                    sx={{
                        ".MuiTablePagination-toolbar": {
                            minHeight: 48,
                            px: 0,
                        },
                    }}
                />
            </TableContainer>
        </SectionCard>
    )
}