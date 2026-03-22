import { useMemo, useState } from "react"
import {
    Button,
    Grid,
    Chip,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded"
import SectionCard from "../components/ui/SectionCard"
import InsightCard from "../components/ui/InsightCard"
import AnalysisDialog from "../components/ui/AnalysisDialog"
import { getAlertsRecommendations } from "../utils/recommendations"
import { getAlertsInsights } from "../utils/insights"
import { getAlertsConclusion } from "../utils/conclusions"
import type { AlertsResponse } from "../../../types/api"
import RiskChip from "./RiskChip"
import { getClusterMeta } from "../utils/clusterMeta"

type RiskFilterValue = "all" | "high" | "medium" | "low"
type ClusterFilterValue = "all" | "0" | "1" | "2"

type Props = {
    data: AlertsResponse | null
    courseId: string
}

export default function AlertsPanel({ data, courseId }: Props) {
    const navigate = useNavigate()

    const [studentFilter, setStudentFilter] = useState("")
    const [riskFilter, setRiskFilter] = useState<RiskFilterValue>("all")
    const [clusterFilter, setClusterFilter] = useState<ClusterFilterValue>("all")
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(8)
    const [analysisOpen, setAnalysisOpen] = useState(false)

    const filteredRows = useMemo(() => {
        if (!data) return []

        return data.alerts.filter((a) => {
            const matchesStudent =
                !studentFilter.trim() || String(a.user_id).includes(studentFilter.trim())

            const matchesRisk =
                riskFilter === "all"
                    ? true
                    : riskFilter === "high"
                        ? a.risk_score >= 0.75
                        : riskFilter === "medium"
                            ? a.risk_score >= 0.45 && a.risk_score < 0.75
                            : a.risk_score < 0.45

            const matchesCluster =
                clusterFilter === "all" ? true : String(a.cluster) === clusterFilter

            return matchesStudent && matchesRisk && matchesCluster
        })
    }, [data, studentFilter, riskFilter, clusterFilter])

    const paginatedRows = useMemo(() => {
        const start = page * rowsPerPage
        return filteredRows.slice(start, start + rowsPerPage)
    }, [filteredRows, page, rowsPerPage])

    const highRiskCount = filteredRows.filter((r) => r.risk_score >= 0.75).length
    const topRiskStudent = filteredRows[0]
    const avgClicks =
        filteredRows.length > 0
            ? Math.round(
                filteredRows.reduce((acc, item) => acc + item.clicks_total, 0) / filteredRows.length
            )
            : 0

    const alertNarrative = getAlertsInsights(data)
    const alertRecommendations = getAlertsRecommendations(data)
    const alertConclusion = getAlertsConclusion(data)

    const handleReset = () => {
        setStudentFilter("")
        setRiskFilter("all")
        setClusterFilter("all")
        setPage(0)
    }

    if (!data) return null

    return (
        <SectionCard
            title="Alertas semanales"
            subtitle="Lista priorizada de estudiantes que requieren revisión más cercana."
        >
            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <InsightCard
                        title="Casos de riesgo alto"
                        value={`${highRiskCount}`}
                        description="Estudiantes filtrados con prioridad alta de seguimiento."
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <InsightCard
                        title="Mayor riesgo detectado"
                        value={topRiskStudent ? `${topRiskStudent.user_id}` : "-"}
                        description={
                            topRiskStudent
                                ? getClusterMeta(topRiskStudent.cluster).description
                                : "No hay estudiante visible en la tabla."
                        }
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <InsightCard
                        title="Promedio de clicks"
                        value={`${avgClicks}`}
                        description="Media de interacciones del grupo visible en la tabla."
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
                    Usa este bloque para priorizar revisión. El objetivo es identificar primero los casos más urgentes.
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
                title="Análisis de alertas"
                subtitle="Hallazgos y recomendaciones sobre la lista priorizada de estudiantes."
                conclusion={alertConclusion}
                insights={alertNarrative}
                recommendations={alertRecommendations}
            />

            <Stack spacing={2}>
                <Grid container spacing={2} alignItems="stretch">
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Estudiante"
                            placeholder="Ej. 11391"
                            value={studentFilter}
                            onChange={(e) => {
                                setStudentFilter(e.target.value)
                                setPage(0)
                            }}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            label="Riesgo"
                            value={riskFilter}
                            onChange={(e) => {
                                setRiskFilter(e.target.value as RiskFilterValue)
                                setPage(0)
                            }}
                            fullWidth
                        >
                            <MenuItem value="all">Todos</MenuItem>
                            <MenuItem value="high">Alto</MenuItem>
                            <MenuItem value="medium">Medio</MenuItem>
                            <MenuItem value="low">Bajo</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            select
                            label="Cluster"
                            value={clusterFilter}
                            onChange={(e) => {
                                setClusterFilter(e.target.value as ClusterFilterValue)
                                setPage(0)
                            }}
                            fullWidth
                        >
                            <MenuItem value="all">Todos</MenuItem>
                            <MenuItem value="0">C0 · Alta participación</MenuItem>
                            <MenuItem value="1">C1 · Baja participación</MenuItem>
                            <MenuItem value="2">C2 · Participación media</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <Button
                            variant="outlined"
                            onClick={handleReset}
                            fullWidth
                            sx={{ height: "100%" }}
                        >
                            Limpiar
                        </Button>
                    </Grid>
                </Grid>

                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Semana analizada: {data.week_id}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        Resultados visibles: {filteredRows.length}
                    </Typography>
                </Stack>

                <TableContainer
                    sx={{
                        border: "1px solid rgba(15, 23, 42, 0.06)",
                        borderRadius: 2,
                    }}
                >
                    <Table size="medium">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, width: "12%" }}>Estudiante</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, width: "10%" }}>
                                    Clicks
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, width: "10%" }}>
                                    Recursos
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, width: "10%" }}>
                                    Eventos
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, width: "12%" }}>Cluster</TableCell>
                                <TableCell sx={{ fontWeight: 700, width: "12%" }}>Resultado</TableCell>
                                <TableCell sx={{ fontWeight: 700, width: "12%" }}>Riesgo</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, width: "16%" }}>
                                    Acción
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {paginatedRows.map((a) => {
                                const meta = getClusterMeta(a.cluster)
                                return (
                                    <TableRow key={`${a.user_id}-${a.week_id}`} hover>
                                        <TableCell>{a.user_id}</TableCell>
                                        <TableCell align="right">{a.clicks_total}</TableCell>
                                        <TableCell align="right">{a.resources_touched}</TableCell>
                                        <TableCell align="right">{a.events_count}</TableCell>

                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={`${meta.code} · ${meta.label}`}
                                                color={
                                                    meta.tone === "success"
                                                        ? "success"
                                                        : meta.tone === "warning"
                                                            ? "warning"
                                                            : "default"
                                                }
                                                variant="outlined"
                                            />
                                        </TableCell>

                                        <TableCell>{a.final_result ?? "-"}</TableCell>
                                        <TableCell>
                                            <RiskChip score={a.risk_score} />
                                        </TableCell>

                                        <TableCell align="center">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => navigate(`/trajectory/${courseId}/${a.user_id}`)}
                                            >
                                                Ver trayectoria
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={filteredRows.length}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(Number(e.target.value))
                        setPage(0)
                    }}
                    rowsPerPageOptions={[5, 8, 10, 20]}
                    labelRowsPerPage="Filas por página"
                    sx={{
                        ".MuiTablePagination-toolbar": {
                            minHeight: 48,
                            px: 0,
                        },
                    }}
                />
            </Stack>
        </SectionCard>
    )
}