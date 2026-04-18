import { useMemo } from "react"
import {
    Alert,
    Autocomplete,
    Box,
    Chip,
    CircularProgress,
    Container,
    Grid,
    Stack,
    TextField,
    Typography,
} from "@mui/material"
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded"
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded"
import MouseRoundedIcon from "@mui/icons-material/MouseRounded"
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded"
import Plot from "react-plotly.js"
import AppShell from "../components/layout/AppShell"
import MetricCard from "../components/ui/MetricCard"
import SectionCard from "../components/ui/SectionCard"
import { useOverview } from "../hooks/useOverview"
import { useDashboardFilters } from "../context/DashboardFiltersContext"
import { getClusterMeta } from "../utils/clusterMeta"

// ── Colores por resultado final ──────────────────────────────────────────────
const RESULT_COLORS: Record<string, string> = {
    Pass:          "#22c55e",
    Distinction:   "#3b82f6",
    Fail:          "#f59e0b",
    Withdrawn:     "#ef4444",
}

const PLOT_CONFIG = { displayModeBar: false, responsive: true }
const PLOT_STYLE  = { width: "100%", height: "100%" }

// ── Colores de cluster (hasta 8) ─────────────────────────────────────────────
const CLUSTER_COLORS = [
    "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
    "#14b8a6", "#a855f7", "#ec4899", "#64748b",
]

export default function OverviewPage() {
    const { courses, coursesError, courseId, setCourseId } = useDashboardFilters()
    const { data, loading, error } = useOverview(courseId)

    const courseOptions = useMemo(
        () => courses.map((c) => ({ label: c, value: c })),
        [courses]
    )
    const selectedCourse = useMemo(
        () => courseOptions.find((o) => o.value === courseId) ?? (courseOptions[0] ?? null),
        [courseOptions, courseId]
    )

    const kpis = data?.kpis
    const atRiskPct = kpis && kpis.total_students > 0
        ? Math.round((kpis.at_risk_count / kpis.total_students) * 100)
        : 0

    // ── Plotly: distribución de resultados (barras horizontales) ─────────────
    const resultTrace = useMemo(() => {
        if (!data?.results_dist.length) return null
        const sorted = [...data.results_dist].sort((a, b) => b.students - a.students)
        return {
            x: sorted.map((r) => r.students),
            y: sorted.map((r) => r.final_result),
            type: "bar" as const,
            orientation: "h" as const,
            marker: { color: sorted.map((r) => RESULT_COLORS[r.final_result] ?? "#94a3b8") },
            text: sorted.map((r) => String(r.students)),
            textposition: "outside" as const,
            hovertemplate: "<b>%{y}</b><br>%{x} estudiantes<extra></extra>",
        }
    }, [data?.results_dist])

    // ── Plotly: distribución de clusters (barras horizontales) ───────────────
    const clusterTrace = useMemo(() => {
        if (!data?.cluster_dist.length) return null
        const sorted = [...data.cluster_dist].sort((a, b) => b.students - a.students)
        return {
            x: sorted.map((r) => r.students),
            y: sorted.map((r) => getClusterMeta(r.cluster).label),
            type: "bar" as const,
            orientation: "h" as const,
            marker: { color: sorted.map((_, i) => CLUSTER_COLORS[i % CLUSTER_COLORS.length]) },
            text: sorted.map((r) => String(r.students)),
            textposition: "outside" as const,
            hovertemplate: "<b>%{y}</b><br>%{x} estudiantes<extra></extra>",
        }
    }, [data?.cluster_dist])

    // ── Plotly: actividad semanal (líneas) ───────────────────────────────────
    const weeklyTraces = useMemo(() => {
        if (!data?.weekly_activity.length) return []
        const weeks = data.weekly_activity.map((w) => w.week_id)
        return [
            {
                x: weeks,
                y: data.weekly_activity.map((w) => w.clicks_total),
                type: "scatter" as const,
                mode: "lines+markers" as const,
                name: "Clicks totales",
                line: { color: "#3b82f6", width: 2 },
                marker: { size: 5 },
            },
            {
                x: weeks,
                y: data.weekly_activity.map((w) => w.active_students),
                type: "scatter" as const,
                mode: "lines+markers" as const,
                name: "Estudiantes activos",
                yaxis: "y2",
                line: { color: "#22c55e", width: 2, dash: "dot" as const },
                marker: { size: 5 },
            },
        ]
    }, [data?.weekly_activity])

    const anyError = coursesError || error

    const atRiskColor = atRiskPct >= 40 ? "#ef4444" : atRiskPct >= 20 ? "#f59e0b" : "#22c55e"

    return (
        <AppShell>
            <Container maxWidth={false} disableGutters sx={{ width: "100%" }}>
                <Stack spacing={2.5}>

                    {/* Filtro de curso */}
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: "1px solid rgba(15,23,42,0.07)",
                            bgcolor: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <Autocomplete
                            options={courseOptions}
                            value={selectedCourse}
                            isOptionEqualToValue={(o, v) => o.value === v.value}
                            getOptionLabel={(o) => o.label}
                            onChange={(_, v) => v && setCourseId(v.value)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Curso"
                                    sx={{
                                        bgcolor: "transparent",
                                        "& .MuiInputBase-root": { height: 44 },
                                        "& .MuiInputLabel-root": { fontSize: 14 },
                                    }}
                                    fullWidth
                                />
                            )}
                            disableClearable
                            noOptionsText="Sin cursos"
                            sx={{ width: 320 }}
                        />
                        {loading && <CircularProgress size={18} />}
                    </Box>

                    {anyError && <Alert severity="error">{anyError}</Alert>}

                    {/* KPI cards */}
                    <Grid container spacing={2} alignItems="stretch">
                        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                            <MetricCard
                                label="Total estudiantes"
                                value={kpis ? kpis.total_students.toLocaleString("es-ES") : "—"}
                                helper={kpis ? `Semanas ${kpis.week_min} – ${kpis.week_max}` : "Sin datos"}
                                color="#3b82f6"
                                icon={<SchoolRoundedIcon sx={{ fontSize: 18 }} />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                            <MetricCard
                                label="Semanas activas"
                                value={kpis ? String(kpis.total_weeks) : "—"}
                                helper={kpis ? `Semana más activa: ${kpis.most_active_week ?? "—"}` : "Sin datos"}
                                color="#6366f1"
                                icon={<DateRangeRoundedIcon sx={{ fontSize: 18 }} />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                            <MetricCard
                                label="Clicks / est. / semana"
                                value={kpis ? new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(kpis.avg_clicks_per_student_week) : "—"}
                                helper="Promedio del curso"
                                color="#14b8a6"
                                icon={<MouseRoundedIcon sx={{ fontSize: 18 }} />}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                            <MetricCard
                                label="Abandonan o suspenden"
                                value={kpis ? `${atRiskPct}%` : "—"}
                                helper={kpis ? `${kpis.at_risk_count} de ${kpis.total_students} estudiantes` : "Sin datos"}
                                color={atRiskColor}
                                icon={<WarningAmberRoundedIcon sx={{ fontSize: 18 }} />}
                            />
                        </Grid>
                    </Grid>

                    {/* Actividad semanal */}
                    <SectionCard
                        title="Actividad semanal"
                        subtitle="Clicks totales y estudiantes activos por semana en el curso"
                    >
                        <Box sx={{ height: 260, minHeight: 200 }}>
                            {weeklyTraces.length > 0 ? (
                                <Plot
                                    data={weeklyTraces}
                                    layout={{
                                        margin: { t: 10, r: 60, b: 40, l: 50 },
                                        xaxis: { title: "Semana", tickfont: { size: 11 } },
                                        yaxis: { title: "Clicks", tickfont: { size: 11 } },
                                        yaxis2: {
                                            title: "Estudiantes activos",
                                            overlaying: "y",
                                            side: "right",
                                            tickfont: { size: 11 },
                                            showgrid: false,
                                        },
                                        legend: { orientation: "h", y: 1.12, x: 0 },
                                        paper_bgcolor: "transparent",
                                        plot_bgcolor: "transparent",
                                        font: { size: 12 },
                                    }}
                                    config={PLOT_CONFIG}
                                    style={PLOT_STYLE}
                                    useResizeHandler
                                />
                            ) : (
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Sin datos
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </SectionCard>

                    {/* Distribuciones */}
                    <Grid container spacing={2} alignItems="stretch">
                        {/* Resultados finales */}
                        <Grid item xs={12} md={6} sx={{ display: "flex" }}>
                            <SectionCard
                                title="Distribución de resultados finales"
                                subtitle="Por número de estudiantes únicos"
                            >
                                <Box sx={{ height: 220, overflow: "hidden" }}>
                                    {resultTrace ? (
                                        <Plot
                                            data={[resultTrace]}
                                            layout={{
                                                margin: { t: 10, r: 60, b: 30, l: 90 },
                                                xaxis: { tickfont: { size: 11 } },
                                                yaxis: { tickfont: { size: 11 }, automargin: true },
                                                paper_bgcolor: "transparent",
                                                plot_bgcolor: "transparent",
                                                showlegend: false,
                                            }}
                                            config={PLOT_CONFIG}
                                            style={PLOT_STYLE}
                                            useResizeHandler
                                        />
                                    ) : (
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                            <Typography variant="body2" color="text.secondary">Sin datos</Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Leyenda de colores */}
                                {data?.results_dist && data.results_dist.length > 0 && (
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {data.results_dist.map((r) => (
                                            <Chip
                                                key={r.final_result}
                                                label={`${r.final_result} · ${r.students}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: RESULT_COLORS[r.final_result] ?? "#94a3b8",
                                                    color: "#fff",
                                                    fontWeight: 600,
                                                    fontSize: 11,
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                )}
                            </SectionCard>
                        </Grid>

                        {/* Distribución de clusters */}
                        <Grid item xs={12} md={6} sx={{ display: "flex" }}>
                            <SectionCard
                                title="Distribución de perfiles (clusters)"
                                subtitle="Número de estudiantes por perfil de aprendizaje"
                            >
                                <Box sx={{ height: 220, overflow: "hidden" }}>
                                    {clusterTrace ? (
                                        <Plot
                                            data={[clusterTrace]}
                                            layout={{
                                                margin: { t: 10, r: 60, b: 30, l: 10 },
                                                xaxis: { tickfont: { size: 11 } },
                                                yaxis: { tickfont: { size: 11 }, automargin: true },
                                                paper_bgcolor: "transparent",
                                                plot_bgcolor: "transparent",
                                                showlegend: false,
                                            }}
                                            config={PLOT_CONFIG}
                                            style={PLOT_STYLE}
                                            useResizeHandler
                                        />
                                    ) : (
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                            <Typography variant="body2" color="text.secondary">Sin datos</Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Leyenda */}
                                {data?.cluster_dist && data.cluster_dist.length > 0 && (
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                        {[...data.cluster_dist]
                                            .sort((a, b) => b.students - a.students)
                                            .map((c, i) => (
                                                <Chip
                                                    key={c.cluster}
                                                    label={`${getClusterMeta(c.cluster).label} · ${c.students}`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                                                        color: "#fff",
                                                        fontWeight: 600,
                                                        fontSize: 11,
                                                    }}
                                                />
                                            ))}
                                    </Stack>
                                )}
                            </SectionCard>
                        </Grid>
                    </Grid>
                </Stack>
            </Container>
        </AppShell>
    )
}
