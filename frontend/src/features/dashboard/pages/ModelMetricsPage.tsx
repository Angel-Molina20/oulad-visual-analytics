import { useMemo } from "react"
import Plot from "react-plotly.js"
import {
    Alert,
    Box,
    CircularProgress,
    Container,
    Grid,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material"
import PercentRoundedIcon from "@mui/icons-material/PercentRounded"
import BalanceRoundedIcon from "@mui/icons-material/BalanceRounded"
import DatasetRoundedIcon from "@mui/icons-material/DatasetRounded"
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded"
import AppShell from "../components/layout/AppShell"
import MetricCard from "../components/ui/MetricCard"
import SectionCard from "../components/ui/SectionCard"
import { useClassifierMeta } from "../hooks/useClassifierMeta"

const OUTCOME_COLORS: Record<string, string> = {
    Distinction: "#2e7d32",
    Pass:        "#1565c0",
    Fail:        "#f9a825",
    Withdrawn:   "#c62828",
}

const FEATURE_LABELS: Record<string, string> = {
    clicks_total:              "Clicks totales",
    resources_touched:         "Recursos visitados",
    resource_types_touched:    "Tipos de recursos",
    events_count:              "Eventos totales",
    assessment_events:         "Eventos de evaluación",
    has_submission_week:       "Sem. con entrega",
    weeks_active_ratio:        "Ratio semanas activas",
    clicks_delta_prev_week:    "Δ Clicks sem. anterior",
    resource_diversity_delta:  "Δ Diversidad recursos",
    cluster:                   "Cluster asignado",
    week_id:                   "Semana del curso",
}

const PLOT_CONFIG = { displayModeBar: false, responsive: true }
const PLOT_STYLE  = { width: "100%" }
const PAPER_SX    = {
    p: 2.5,
    borderRadius: 3,
    border: "1px solid rgba(15,23,42,0.08)",
    overflow: "hidden",
}

export default function ModelMetricsPage() {
    const { data, loading, error } = useClassifierMeta()

    const featureChart = useMemo(() => {
        if (!data?.feature_importances) return null
        const entries = Object.entries(data.feature_importances).sort(([, a], [, b]) => a - b)
        const vals = entries.map(([, v]) => v)
        const max  = Math.max(...vals)
        return {
            x: vals,
            y: entries.map(([k]) => FEATURE_LABELS[k] ?? k),
            colors: vals.map((v) =>
                v >= max * 0.6 ? "#1565c0" : v >= max * 0.3 ? "#42a5f5" : "#90caf9"
            ),
        }
    }, [data?.feature_importances])

    const cvChart = useMemo(() => {
        if (!data?.cv_accuracy_per_fold || !data?.cv_f1_per_fold) return null
        return {
            folds:    data.cv_accuracy_per_fold.map((_, i) => `Fold ${i + 1}`),
            accuracy: data.cv_accuracy_per_fold,
            f1:       data.cv_f1_per_fold,
        }
    }, [data])

    const distChart = useMemo(() => {
        if (!data?.class_distribution) return null
        const entries = Object.entries(data.class_distribution).sort(([, a], [, b]) => b - a)
        return {
            labels: entries.map(([k]) => k),
            values: entries.map(([, v]) => v),
            colors: entries.map(([k]) => OUTCOME_COLORS[k] ?? "#90a4ae"),
        }
    }, [data?.class_distribution])

    const reportRows = useMemo(() => {
        if (!data?.full_data_report || !data.classes) return []
        const report = data.full_data_report as Record<string, Record<string, number>>
        return data.classes.map((cls) => {
            const r = report[cls] ?? {}
            return {
                cls,
                precision: r.precision   ?? 0,
                recall:    r.recall      ?? 0,
                f1:        r["f1-score"] ?? 0,
                support:   r.support     ?? 0,
            }
        })
    }, [data])

    return (
        <AppShell>
            <Container maxWidth={false} disableGutters sx={{ width: "100%" }}>
                <Stack spacing={3}>

                    {loading && (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {error && <Alert severity="error">{error}</Alert>}

                    {!loading && data && !data.available && (
                        <Alert severity="warning">
                            {data.note ?? "El modelo aún no ha sido entrenado. Ejecuta el job 08 del pipeline."}
                        </Alert>
                    )}

                    {!loading && data?.available && (
                        <Stack spacing={3}>

                            {/* Fila de métricas principales */}
                            <Grid container spacing={2} alignItems="stretch">
                                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                                    <MetricCard
                                        label="Accuracy CV (5-fold)"
                                        value={`${((data.cv_accuracy ?? 0) * 100).toFixed(1)}%`}
                                        helper="Media sobre 5 particiones"
                                        color="#3b82f6"
                                        icon={<PercentRoundedIcon sx={{ fontSize: 18 }} />}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                                    <MetricCard
                                        label="F1-Weighted CV"
                                        value={`${((data.cv_f1_weighted ?? 0) * 100).toFixed(1)}%`}
                                        helper="Ponderado por soporte de clase"
                                        color="#6366f1"
                                        icon={<BalanceRoundedIcon sx={{ fontSize: 18 }} />}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                                    <MetricCard
                                        label="Muestras entrenamiento"
                                        value={(data.n_samples ?? 0).toLocaleString()}
                                        helper="Registros semanales con outcome"
                                        color="#14b8a6"
                                        icon={<DatasetRoundedIcon sx={{ fontSize: 18 }} />}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
                                    <MetricCard
                                        label="Tipo de modelo"
                                        value="Gradient Boosting"
                                        helper="200 árboles · profundidad 4"
                                        color="#f59e0b"
                                        icon={<AccountTreeRoundedIcon sx={{ fontSize: 18 }} />}
                                    />
                                </Grid>
                            </Grid>

                            {/* Fila principal: importancias + CV folds + distribución */}
                            <Grid container spacing={2} alignItems="stretch">

                                {/* Importancia de variables */}
                                <Grid item xs={12} md={7}>
                                    <Paper elevation={0} sx={{ ...PAPER_SX, height: "100%" }}>
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                            Importancia de variables
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                            Contribución relativa de cada variable a las predicciones del modelo.
                                        </Typography>
                                        {featureChart && (
                                            <Plot
                                                data={[{
                                                    type: "bar",
                                                    orientation: "h",
                                                    x: featureChart.x,
                                                    y: featureChart.y,
                                                    marker: { color: featureChart.colors },
                                                    hovertemplate: "<b>%{y}</b><br>Importancia: %{x:.4f}<extra></extra>",
                                                }]}
                                                layout={{
                                                    height: 340,
                                                    margin: { l: 8, r: 16, t: 8, b: 40 },
                                                    xaxis: {
                                                        title: { text: "Importancia", standoff: 8 },
                                                        tickformat: ".3f",
                                                        automargin: true,
                                                    },
                                                    yaxis: {
                                                        automargin: true,
                                                        tickfont: { size: 12 },
                                                    },
                                                    paper_bgcolor: "transparent",
                                                    plot_bgcolor:  "transparent",
                                                    font: { family: "inherit", size: 12 },
                                                }}
                                                config={PLOT_CONFIG}
                                                useResizeHandler
                                                style={PLOT_STYLE}
                                            />
                                        )}
                                    </Paper>
                                </Grid>

                                {/* Columna derecha */}
                                <Grid item xs={12} md={5}>
                                    <Stack spacing={2} sx={{ height: "100%" }}>

                                        {/* CV por fold */}
                                        <Paper elevation={0} sx={PAPER_SX}>
                                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                                Métricas por fold
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                                Validación cruzada estratificada 5-fold.
                                            </Typography>
                                            {cvChart && (
                                                <Plot
                                                    data={[
                                                        {
                                                            type: "bar",
                                                            name: "Accuracy",
                                                            x: cvChart.folds,
                                                            y: cvChart.accuracy,
                                                            marker: { color: "#1565c0" },
                                                            hovertemplate: "%{x}: %{y:.3f}<extra>Accuracy</extra>",
                                                        },
                                                        {
                                                            type: "bar",
                                                            name: "F1-Weighted",
                                                            x: cvChart.folds,
                                                            y: cvChart.f1,
                                                            marker: { color: "#7b1fa2" },
                                                            hovertemplate: "%{x}: %{y:.3f}<extra>F1</extra>",
                                                        },
                                                    ]}
                                                    layout={{
                                                        height: 200,
                                                        margin: { l: 40, r: 8, t: 8, b: 32 },
                                                        barmode: "group",
                                                        yaxis: {
                                                            range: [0, 1],
                                                            tickformat: ".2f",
                                                            automargin: true,
                                                        },
                                                        xaxis: { automargin: true },
                                                        legend: {
                                                            orientation: "h",
                                                            x: 0,
                                                            y: 1.15,
                                                            xanchor: "left",
                                                        },
                                                        paper_bgcolor: "transparent",
                                                        plot_bgcolor:  "transparent",
                                                        font: { family: "inherit", size: 12 },
                                                    }}
                                                    config={PLOT_CONFIG}
                                                    useResizeHandler
                                                    style={PLOT_STYLE}
                                                />
                                            )}
                                        </Paper>

                                        {/* Distribución de clases */}
                                        <Paper elevation={0} sx={PAPER_SX}>
                                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                                Distribución de clases
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                                Registros en el conjunto de entrenamiento por resultado final.
                                            </Typography>
                                            {distChart && (
                                                <Plot
                                                    data={[{
                                                        type: "bar",
                                                        orientation: "h",
                                                        x: distChart.values,
                                                        y: distChart.labels,
                                                        marker: { color: distChart.colors },
                                                        hovertemplate: "<b>%{y}</b>: %{x:,}<extra></extra>",
                                                        text: distChart.values.map((v) => v.toLocaleString()),
                                                        textposition: "outside",
                                                        cliponaxis: false,
                                                    }]}
                                                    layout={{
                                                        height: 180,
                                                        margin: { l: 8, r: 60, t: 8, b: 24 },
                                                        xaxis: {
                                                            showticklabels: false,
                                                            showgrid: false,
                                                            zeroline: false,
                                                            automargin: true,
                                                        },
                                                        yaxis: {
                                                            automargin: true,
                                                            tickfont: { size: 13 },
                                                        },
                                                        paper_bgcolor: "transparent",
                                                        plot_bgcolor:  "transparent",
                                                        font: { family: "inherit", size: 12 },
                                                    }}
                                                    config={PLOT_CONFIG}
                                                    useResizeHandler
                                                    style={PLOT_STYLE}
                                                />
                                            )}
                                        </Paper>

                                    </Stack>
                                </Grid>
                            </Grid>

                            {/* Tabla reporte por clase */}
                            {reportRows.length > 0 && (
                                <SectionCard
                                    title="Reporte por clase"
                                    subtitle="Precisión, recall y F1 sobre datos completos de entrenamiento. Las métricas de generalización son las del CV de arriba."
                                >
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                                    <TableCell sx={{ fontWeight: 700, borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Resultado</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700, borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Precisión</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700, borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Recall</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700, borderBottom: "2px solid rgba(15,23,42,0.08)" }}>F1-Score</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 700, borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Muestras</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {reportRows.map((row) => (
                                                    <TableRow key={row.cls} hover>
                                                        <TableCell>
                                                            <Box
                                                                component="span"
                                                                sx={{
                                                                    display: "inline-block",
                                                                    px: 1.5,
                                                                    py: 0.3,
                                                                    borderRadius: 2,
                                                                    border: `1.5px solid ${OUTCOME_COLORS[row.cls] ?? "#90a4ae"}`,
                                                                    color: OUTCOME_COLORS[row.cls] ?? "text.primary",
                                                                    fontWeight: 700,
                                                                    fontSize: 13,
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                {row.cls}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="right">{(row.precision * 100).toFixed(1)}%</TableCell>
                                                        <TableCell align="right">{(row.recall    * 100).toFixed(1)}%</TableCell>
                                                        <TableCell align="right">{(row.f1        * 100).toFixed(1)}%</TableCell>
                                                        <TableCell align="right">{row.support.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </SectionCard>
                            )}

                        </Stack>
                    )}
                </Stack>
            </Container>
        </AppShell>
    )
}
