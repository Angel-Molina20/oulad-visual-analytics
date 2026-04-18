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
    Tooltip,
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
import { useMemo, useState, useEffect, useRef } from "react"

export default function TrajectoryPanel({ data, courseId, selectedWeek }: { data: TrajectoryResponse | null, courseId: string, selectedWeek: number | null }) {
    if (!data) return null

    const [baselineMode, setBaselineMode] = useState<"course" | "cluster">("course")

    const studentCluster =
        data?.trajectory?.length ? data.trajectory[data.trajectory.length - 1].cluster : null

    const baseline = useBaseline(courseId, baselineMode === "course" ? null : studentCluster)
    const courseBaseline = useBaseline(courseId, null)

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

    const courseBaselineMap = courseBaseline.byWeek
    const courseBaselineRows = courseBaseline.data?.baseline ?? []

    const alertDetails = useMemo(() => {
        const details = new Map<number, string[]>()
        data.trajectory.forEach((t) => {
            const reasons: string[] = []
            const baselineRow = courseBaselineMap.get(t.week_id)
            if (baselineRow) {
                if (t.clicks_total <= baselineRow.clicks_mean * 0.6) {
                    reasons.push("Clicks muy bajos vs promedio del curso")
                }
                if (t.resources_touched <= baselineRow.resources_mean * 0.6) {
                    reasons.push("Recursos por debajo del promedio del curso")
                }
            }
            if ((t.clicks_delta_prev_week ?? 0) < 0) {
                reasons.push("Caida de clicks frente a la semana previa")
            }
            if ((t.resource_diversity_delta ?? 0) < 0) {
                reasons.push("Menor diversidad de recursos")
            }
            if ((t.assessment_events ?? 0) === 0) {
                reasons.push("Sin actividad de evaluacion esta semana")
            }
            if (reasons.length) details.set(t.week_id, reasons)
        })
        return details
    }, [data.trajectory, courseBaselineMap])

    const alertWeeks = useMemo(() => Array.from(alertDetails.keys()).sort((a, b) => a - b), [alertDetails])
    const alertClicks = alertWeeks.map((week) => {
        const row = data.trajectory.find((t) => t.week_id === week)
        return row?.clicks_total ?? 0
    })

    const submissionWeeks = useMemo(() => {
        return data.trajectory
            .filter((t) => (t.has_submission_week ?? 0) > 0)
            .map((t) => t.week_id)
            .sort((a, b) => a - b)
    }, [data.trajectory])

    const submissionClicks = submissionWeeks.map((week) => {
        const row = data.trajectory.find((t) => t.week_id === week)
        return row?.clicks_total ?? 0
    })

    const clusterChangeWeeks = useMemo(() => {
        const changes = new Set<number>()
        for (let i = 1; i < data.trajectory.length; i += 1) {
            const prev = data.trajectory[i - 1]
            const cur = data.trajectory[i]
            if (prev.cluster !== cur.cluster) changes.add(cur.week_id)
        }
        return Array.from(changes).sort((a, b) => a - b)
    }, [data.trajectory])

    const changeClicks = clusterChangeWeeks.map((week) => {
        const row = data.trajectory.find((t) => t.week_id === week)
        return row?.clicks_total ?? 0
    })

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

    const avgCourseResources = courseBaselineRows.length
        ? courseBaselineRows.reduce((acc, row) => acc + row.resources_mean, 0) / courseBaselineRows.length
        : 0
    const avgStudentResources = resources.length
        ? resources.reduce((acc, val) => acc + val, 0) / resources.length
        : 0

    const lastRow = data.trajectory[data.trajectory.length - 1]
    const lastActiveWeek = data.trajectory
        .slice()
        .reverse()
        .find((row) => row.events_count > 0)?.week_id
    const weeksActiveRatio = lastRow?.weeks_active_ratio ?? null
    const submissionsCount = submissionWeeks.length
    const recentTrend = data.trajectory
        .slice(-3)
        .map((row) => row.clicks_delta_prev_week ?? 0)
        .reduce((acc, val) => acc + val, 0)

    const narrativeLines = useMemo(() => {
        const lines: string[] = []
        if (!data.trajectory.length) return lines
        const firstWeek = data.trajectory[0].week_id
        const firstAlertWeek = alertWeeks[0]
        if (firstAlertWeek !== undefined && firstAlertWeek > firstWeek) {
            lines.push(`Actividad estable hasta semana ${firstAlertWeek - 1}.`)
            lines.push(`Caida marcada desde semana ${firstAlertWeek}.`)
        }
        if (avgCourseResources > 0 && avgStudentResources / avgCourseResources < 0.7) {
            lines.push("Uso de recursos por debajo del promedio del curso.")
        }
        if (submissionWeeks.length > 0) {
            lines.push(`Semanas con entrega: ${submissionWeeks.join(", ")}.`)
        }
        if (clusterChangeWeeks.length > 0) {
            lines.push(`Cambios de cluster en semanas ${clusterChangeWeeks.join(", ")}.`)
        }
        if (recentTrend < 0) {
            lines.push("Tendencia reciente de clicks a la baja.")
        }
        const lastCluster = data.trajectory[data.trajectory.length - 1]?.cluster
        if (lastCluster !== undefined) {
            const meta = getClusterMeta(lastCluster)
            lines.push(`Perfil final: ${meta.label}.`)
        }
        if (!lines.length) {
            lines.push("Trayectoria estable sin senales criticas destacadas.")
        }
        return lines
    }, [data.trajectory, alertWeeks, avgCourseResources, avgStudentResources, clusterChangeWeeks, submissionWeeks, recentTrend])

    return (
        <SectionCard
            title="Análisis de trayectoria"
            subtitle="Lectura temporal de la actividad semanal del estudiante."
        >
            <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                    <InsightCard
                        title="Pico de actividad"
                        value={`Semana ${peakWeek}`}
                        description={`Maximo de ${peakClicks} clicks registrados.`}
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
                        description="Variacion entre la primera y la ultima semana registrada."
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <InsightCard
                        title="Regularidad"
                        value={weeksActiveRatio !== null ? `${Math.round(weeksActiveRatio * 100)}%` : "-"}
                        description="Ratio de semanas activas sobre las semanas transcurridas."
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <InsightCard
                        title="Semanas con entrega"
                        value={`${submissionsCount}`}
                        description={
                            submissionsCount > 0
                                ? `Ultima semana activa: ${lastActiveWeek ?? "-"}`
                                : "Sin entregas registradas."
                        }
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <InsightCard
                        title="Tendencia reciente"
                        value={`${recentTrend >= 0 ? "+" : ""}${Math.round(recentTrend)}`}
                        description="Suma de cambios en clicks de las ultimas 3 semanas."
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

            <Stack spacing={0.5} sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Lectura breve del caso</Typography>
                {narrativeLines.map((line) => (
                    <Typography key={line} variant="body2" color="text.secondary">
                        {line}
                    </Typography>
                ))}
            </Stack>

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
                    {
                        type: "scatter",
                        mode: "markers",
                        name: "Semanas con alerta",
                        x: alertWeeks,
                        y: alertClicks,
                        marker: { color: "#d32f2f", size: 10, symbol: "triangle-up" },
                    },
                    {
                        type: "scatter",
                        mode: "markers",
                        name: "Semana con entrega",
                        x: submissionWeeks,
                        y: submissionClicks,
                        marker: { color: "#2e7d32", size: 9, symbol: "circle" },
                    },
                    {
                        type: "scatter",
                        mode: "markers",
                        name: "Cambio de cluster",
                        x: clusterChangeWeeks,
                        y: changeClicks,
                        marker: { color: "#f9a825", size: 9, symbol: "diamond" },
                    },
                ]}
                layout={{
                    height: 360,
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
                            <TableCell align="right">Delta semana</TableCell>
                            <TableCell align="right">Recursos</TableCell>
                            <TableCell align="right">Delta diversidad</TableCell>
                            <TableCell align="right">Tipos</TableCell>
                            <TableCell align="right">Eventos</TableCell>
                            <TableCell align="right">Entrega</TableCell>
                            <TableCell align="right">Cluster</TableCell>
                            <TableCell align="center">Senal</TableCell>
                            <TableCell align="center">Cambio</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {paginatedRows.map((t) => {
                            const metaRow = getClusterMeta(t.cluster)
                            const alertReasons = alertDetails.get(t.week_id)
                            const hasAlert = Boolean(alertReasons?.length)
                            const hasChange = clusterChangeWeeks.includes(t.week_id)

                            return (
                                <TableRow
                                    key={t.week_id}
                                    hover
                                    ref={(el) => {
                                        rowRefs.current[t.week_id] = el
                                    }}
                                    sx={{
                                        backgroundColor: selectedWeek === t.week_id
                                            ? "rgba(25, 118, 210, 0.08)"
                                            : hasAlert
                                                ? "rgba(211, 47, 47, 0.06)"
                                                : undefined,
                                    }}
                                >
                                    <TableCell align="right">{t.week_id}</TableCell>
                                    <TableCell align="right">{t.clicks_total}</TableCell>
                                    <TableCell align="right">
                                        <Typography variant="caption" color="text.secondary">
                                            {(t.clicks_delta_prev_week ?? 0) >= 0 ? "+" : ""}
                                            {Math.round(t.clicks_delta_prev_week ?? 0)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">{t.resources_touched}</TableCell>
                                    <TableCell align="right">
                                        <Typography variant="caption" color="text.secondary">
                                            {(t.resource_diversity_delta ?? 0) >= 0 ? "+" : ""}
                                            {Math.round(t.resource_diversity_delta ?? 0)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">{t.resource_types_touched}</TableCell>
                                    <TableCell align="right">{t.events_count}</TableCell>
                                    <TableCell align="right">
                                        {t.has_submission_week ? "Si" : "No"}
                                    </TableCell>
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
                                    <TableCell align="center">
                                        {hasAlert ? (
                                            <Tooltip title={alertReasons?.join(" · ") ?? ""}>
                                                <Chip size="small" color="error" label="Alerta" variant="outlined" />
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">-</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        {hasChange ? (
                                            <Chip size="small" color="warning" label="Cambio" variant="outlined" />
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">-</Typography>
                                        )}
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
                    rowsPerPageOptions={[5, 10, 20]}
                    labelRowsPerPage="Filas por pagina"
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

