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
    Typography,
} from "@mui/material"
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded"
import SectionCard from "../components/ui/SectionCard"
import InsightCard from "../components/ui/InsightCard"
import AnalysisDialog from "../components/ui/AnalysisDialog"
import { getTrajectoryRecommendations } from "../utils/recommendations"
import { getTrajectoryInsights } from "../utils/insights"
import { getTrajectoryConclusion } from "../utils/conclusions"
import { getClusterMeta } from "../utils/clusterMeta"
import type { TrajectoryResponse } from "../../../types/api"
import {useState} from "react";

export default function TrajectoryPanel({ data }: { data: TrajectoryResponse | null }) {
    if (!data) return null

    const weeks = data.trajectory.map((t) => t.week_id)
    const clicks = data.trajectory.map((t) => t.clicks_total)
    const resources = data.trajectory.map((t) => t.resources_touched)
    const [analysisOpen, setAnalysisOpen] = useState(false)

    const peakClicks = Math.max(...clicks)
    const peakWeek = data.trajectory.find((t) => t.clicks_total === peakClicks)?.week_id ?? "-"
    const avgClicks = Math.round(clicks.reduce((acc, val) => acc + val, 0) / clicks.length)

    const clustersCount = data.trajectory.reduce<Record<string, number>>((acc, item) => {
        const code = getClusterMeta(item.cluster).code
        acc[code] = (acc[code] || 0) + 1
        return acc
    }, {})


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

    return (
        <SectionCard
            title={`Trayectoria del estudiante ${data.user_id}`}
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

                <Button
                    variant="outlined"
                    startIcon={<AutoAwesomeRoundedIcon />}
                    onClick={() => setAnalysisOpen(true)}
                >
                    Ver análisis
                </Button>
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
                    {
                        type: "scatter",
                        mode: "lines+markers",
                        name: "Clicks",
                        x: weeks,
                        y: clicks,
                    },
                    {
                        type: "scatter",
                        mode: "lines+markers",
                        name: "Recursos",
                        x: weeks,
                        y: resources,
                    },
                ]}
                layout={{
                    height: 320,
                    margin: { l: 50, r: 20, t: 10, b: 40 },
                    paper_bgcolor: "white",
                    plot_bgcolor: "white",
                    legend: { orientation: "h", y: 1.15 },
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
                        {data.trajectory.slice(0, 20).map((t) => {
                            const metaRow = getClusterMeta(t.cluster)

                            return (
                                <TableRow key={t.week_id} hover>
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
            </TableContainer>
        </SectionCard>
    )
}