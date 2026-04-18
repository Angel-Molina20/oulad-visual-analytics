import { useMemo, useState, useEffect } from "react"
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
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material"
import { buildStudentNameMap, getStudentName } from "../../../utils/studentNames"
import { useNavigate, useLocation } from "react-router-dom"
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded"
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded"
import { downloadCsv } from "../../../utils/exportCsv"
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded"
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded"
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded"
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded"
import AddCommentRoundedIcon from "@mui/icons-material/AddCommentRounded"
import SectionCard from "../components/ui/SectionCard"
import InsightCard from "../components/ui/InsightCard"
import AnalysisDialog from "../components/ui/AnalysisDialog"
import { getAlertsRecommendations } from "../utils/recommendations"
import { getAlertsInsights } from "../utils/insights"
import { getAlertsConclusion } from "../utils/conclusions"
import type { AlertsResponse, AlertRow, AlertFeedback } from "../../../types/api"
import RiskBreakdown from "./RiskBreakdown"
import { getClusterMeta } from "../utils/clusterMeta"
import { useClusterLabels } from "../hooks/useClusterLabels"
import { outcomeLabel } from "../utils/outcomes"
import { apiGet, apiPost } from "../../../api/client"

type RiskFilterValue = "all" | "high" | "medium" | "low"
type ClusterFilterValue = "all" | string
type StatusFilterValue = "all" | "open" | "resolved"

type Props = {
    data: AlertsResponse | null
    courseId: string
    selectedCluster: number | null
}

export default function AlertsPanel({ data, courseId, selectedCluster }: Props) {
    const navigate = useNavigate()
    const location = useLocation()

    const [studentFilter, setStudentFilter] = useState("")
    const [riskFilter, setRiskFilter] = useState<RiskFilterValue>("all")
    const [clusterFilter, setClusterFilter] = useState<ClusterFilterValue>("all")
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(8)
    const [analysisOpen, setAnalysisOpen] = useState(false)
    const [caseAnalysisOpen, setCaseAnalysisOpen] = useState(false)
    const [selectedAlert, setSelectedAlert] = useState<AlertRow | null>(null)
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
    const [feedback, setFeedback] = useState<AlertFeedback[]>([])
    const [noteDialogOpen, setNoteDialogOpen] = useState(false)
    const [noteDialogMode, setNoteDialogMode] = useState<"review" | "edit">("review")
    const [noteDialogValue, setNoteDialogValue] = useState("")
    const [noteDialogAlert, setNoteDialogAlert] = useState<AlertRow | null>(null)

    const { data: clusterLabels } = useClusterLabels(courseId)

    const clusterOptions = useMemo(() => {
        if (clusterLabels?.length) {
            return clusterLabels
                .map((c) => ({ value: String(c.cluster), label: `C${c.cluster} · ${c.label}` }))
                .sort((a, b) => Number(a.value) - Number(b.value))
        }
        const unique = new Set<string>()
        data?.alerts.forEach((a) => unique.add(String(a.cluster)))
        return [...unique]
            .sort((a, b) => Number(a) - Number(b))
            .map((value) => ({ value, label: `C${value}` }))
    }, [clusterLabels, data?.alerts])

    useEffect(() => {
        if (clusterFilter === "all") return
        if (!clusterOptions.some((opt) => opt.value === clusterFilter)) {
            setClusterFilter("all")
            setPage(0)
        }
    }, [clusterFilter, clusterOptions])

    const nameMap = useMemo(() => {
        if (!data?.alerts) return new Map<number, string>()
        return buildStudentNameMap(data.alerts.map((a) => a.user_id))
    }, [data?.alerts])

    useEffect(() => {
        if (!data?.course_id) return
        setFeedback([])
        apiGet<AlertFeedback[]>(
            `/ops/alerts/feedback?course_id=${encodeURIComponent(data.course_id)}&week_id=${data.week_id}`
        )
            .then(setFeedback)
            .catch(() => setFeedback([]))
    }, [data?.course_id, data?.week_id])

    const feedbackMap = useMemo(() => {
        const map = new Map<string, AlertFeedback>()
        feedback.forEach((f) => {
            map.set(`${f.course_id}-${f.week_id}-${f.user_id}`, f)
        })
        return map
    }, [feedback])

    const getStatus = (alert: AlertRow) => {
        const key = `${courseId}-${alert.week_id}-${alert.user_id}`
        return feedbackMap.get(key)?.status ?? "open"
    }

    const getNoteValue = (alert: AlertRow) => {
        const key = `${courseId}-${alert.week_id}-${alert.user_id}`
        return feedbackMap.get(key)?.note ?? null
    }

    const saveFeedback = async (alert: AlertRow, updates: Partial<AlertFeedback>) => {
        const noteValue =
            updates.note !== undefined
                ? updates.note
                : getNoteValue(alert)
        const payload = {
            course_id: courseId,
            week_id: alert.week_id,
            user_id: alert.user_id,
            risk_score: alert.risk_score,
            status: updates.status ?? getStatus(alert),
            note: noteValue,
        }
        try {
            const saved = await apiPost<AlertFeedback>("/ops/alerts/feedback", payload)
            setFeedback((prev) => {
                const next = prev.filter((f) => f.id !== saved.id)
                return [...next, saved]
            })
        } catch (err) {
            // Ignore for now; UI still shows draft
        }
    }

    const openReviewDialog = (alert: AlertRow) => {
        if (getStatus(alert) !== "open") return
        setNoteDialogAlert(alert)
        setNoteDialogMode("review")
        setNoteDialogValue(getNoteValue(alert) ?? "")
        setNoteDialogOpen(true)
    }

    const openEditNoteDialog = (alert: AlertRow) => {
        setNoteDialogAlert(alert)
        setNoteDialogMode("edit")
        setNoteDialogValue(getNoteValue(alert) ?? "")
        setNoteDialogOpen(true)
    }

    const closeNoteDialog = () => {
        setNoteDialogOpen(false)
        setNoteDialogAlert(null)
        setNoteDialogValue("")
    }

    const handleSaveReview = async (withNote: boolean) => {
        if (!noteDialogAlert) return
        const note = withNote ? (noteDialogValue.trim() || null) : null
        await saveFeedback(noteDialogAlert, { status: "resolved", note })
        closeNoteDialog()
    }

    const handleSaveEdit = async () => {
        if (!noteDialogAlert) return
        const note = noteDialogValue.trim() || null
        await saveFeedback(noteDialogAlert, { status: getStatus(noteDialogAlert), note })
        closeNoteDialog()
    }

    const filteredRows = useMemo(() => {
        if (!data) return []

        const rows = data.alerts.filter((a) => {
            const query = studentFilter.trim().toLowerCase()
            const matchesStudent =
                !query || getStudentName(a.user_id, nameMap).toLowerCase().includes(query)

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

            const status = getStatus(a)
            const matchesStatus = statusFilter === "all" ? true : status === statusFilter

            return matchesStudent && matchesRisk && matchesCluster && matchesStatus
        })
        const statusRank: Record<string, number> = {
            open: 0,
            resolved: 1,
        }

        rows.sort((a, b) => {
            const statusA = getStatus(a)
            const statusB = getStatus(b)
            const rankDiff = (statusRank[statusA] ?? 9) - (statusRank[statusB] ?? 9)
            if (rankDiff !== 0) return rankDiff
            const riskDiff = b.risk_score - a.risk_score
            if (riskDiff !== 0) return riskDiff
            return a.user_id - b.user_id
        })

        return rows
    }, [data, studentFilter, nameMap, riskFilter, clusterFilter, statusFilter, feedbackMap])

    const paginatedRows = useMemo(() => {
        const start = page * rowsPerPage
        return filteredRows.slice(start, start + rowsPerPage)
    }, [filteredRows, page, rowsPerPage])

    const highRiskCount = filteredRows.filter((r) => r.risk_score >= 0.75).length
    const topRiskStudent = [...filteredRows].sort((a, b) => b.risk_score - a.risk_score)[0]
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
        setStatusFilter("all")
        setPage(0)
    }

    const handleExport = () => {
        const filename = `alertas_${courseId}_semana${data?.week_id ?? ""}_${new Date().toISOString().slice(0, 10)}.csv`
        downloadCsv(filteredRows, [
            { label: "Estudiante",       value: (a) => getStudentName(a.user_id, nameMap) },
            { label: "Semana",           value: (a) => a.week_id },
            { label: "Clicks",           value: (a) => a.clicks_total },
            { label: "Recursos",         value: (a) => a.resources_touched },
            { label: "Eventos",          value: (a) => a.events_count },
            { label: "Cluster",          value: (a) => a.cluster },
            { label: "Resultado",        value: (a) => a.final_result ?? "" },
            { label: "Prediccion ML",    value: (a) => a.pred_label ?? "" },
            { label: "Confianza ML (%)", value: (a) => a.pred_confidence != null ? Math.round(a.pred_confidence * 100) : "" },
            { label: "Riesgo (%)",       value: (a) => Math.round(a.risk_score * 100) },
            { label: "Estado",           value: (a) => getStatus(a) === "resolved" ? "Revisado" : "Pendiente" },
            { label: "Nota",             value: (a) => getNoteValue(a) ?? "" },
        ], filename)
    }

    const openCaseAnalysis = (alert: AlertRow) => {
        setSelectedAlert(alert)
        setCaseAnalysisOpen(true)
    }

    const caseMeta = selectedAlert ? getClusterMeta(selectedAlert.cluster) : null
    const caseInsights = selectedAlert
        ? [
            `Resultado final: ${outcomeLabel(selectedAlert.final_result)}`,
            selectedAlert.pred_label
                ? `Predicción ML: ${selectedAlert.pred_label} (confianza ${Math.round((selectedAlert.pred_confidence ?? 0) * 100)}%)`
                : null,
            `Cluster actual: ${caseMeta?.code} · ${caseMeta?.label}`,
            `Clicks: ${selectedAlert.clicks_total} · Recursos: ${selectedAlert.resources_touched}`,
            `Eventos: ${selectedAlert.events_count} · Riesgo: ${(selectedAlert.risk_score * 100).toFixed(0)}%`,
            selectedAlert.reasons?.length ? `Señales detectadas: ${selectedAlert.reasons.slice(0, 2).join(" / ")}` : "",
        ].filter(Boolean) as string[]
        : []

    const caseRecommendations = selectedAlert
        ? [
            selectedAlert.risk_score >= 0.75
                ? "Prioriza este caso en la revisión semanal y abre su trayectoria completa."
                : "Revisa la tendencia reciente antes de decidir intervención.",
            selectedAlert.resources_touched <= 20
                ? "Actividad baja en recursos. Sugiere revisar si el estudiante accede al material clave."
                : "Actividad de recursos moderada. Verifica si hay cambios recientes en evaluaciones.",
            selectedAlert.final_result === "Withdrawn"
                ? "Contacta con el estudiante para confirmar continuidad y ofrecer apoyo temprano."
                : selectedAlert.final_result === "Fail"
                    ? "Revisa evaluaciones recientes y propone un plan de recuperación."
                    : "Mantén seguimiento y valida si el riesgo es coyuntural.",
        ]
        : []

    useEffect(() => {
        if (selectedCluster === null) {
            setClusterFilter("all")
            return
        }
        setClusterFilter(String(selectedCluster) as ClusterFilterValue)
        setPage(0)
    }, [selectedCluster])

    const statusLabel = (status: StatusFilterValue) => {
        if (status === "resolved") return "Revisado"
        return "Pendiente"
    }

    const statusColor = (status: StatusFilterValue) => {
        if (status === "resolved") return "success"
        return "warning"
    }

    const predColor = (label: string | null | undefined) => {
        if (label === "Distinction") return "success"
        if (label === "Pass") return "primary"
        if (label === "Fail") return "warning"
        if (label === "Withdrawn") return "error"
        return "default"
    }

    const predTooltip = (proba: Record<string, number> | null | undefined) => {
        if (!proba) return "Sin predicción disponible"
        return Object.entries(proba)
            .sort(([, a], [, b]) => b - a)
            .map(([k, v]) => `${k}: ${Math.round(v * 100)}%`)
            .join(" · ")
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
                        color="#ef4444"
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <InsightCard
                        title="Mayor riesgo detectado"
                        value={topRiskStudent ? getStudentName(topRiskStudent.user_id, nameMap) : "-"}
                        description={
                            topRiskStudent
                                ? getClusterMeta(topRiskStudent.cluster).description
                                : "No hay estudiante visible en la tabla."
                        }
                        color="#f59e0b"
                    />
                </Grid>

                <Grid item xs={12} md={4}>
                    <InsightCard
                        title="Promedio de clicks"
                        value={`${avgClicks}`}
                        description="Media de interacciones del grupo visible en la tabla."
                        color="#3b82f6"
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

            <AnalysisDialog
                open={caseAnalysisOpen}
                onClose={() => setCaseAnalysisOpen(false)}
                title={selectedAlert ? `Análisis del caso ${getStudentName(selectedAlert.user_id, nameMap)}` : "Análisis del caso"}
                subtitle={
                    selectedAlert
                        ? `Curso ${courseId} · Semana ${selectedAlert.week_id}`
                        : ""
                }
                conclusion={
                    selectedAlert
                        ? `Riesgo estimado ${Math.round(selectedAlert.risk_score * 100)}%. Este porcentaje resume señales de baja actividad y cambios recientes, y sugiere probabilidad de ${outcomeLabel(selectedAlert.final_result)} si no hay intervención.`
                        : undefined
                }
                insights={caseInsights}
                recommendations={caseRecommendations}
            />

            <Dialog open={noteDialogOpen} onClose={closeNoteDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {noteDialogMode === "review" ? "Marcar revisado" : "Editar nota"}
                </DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {noteDialogMode === "review"
                            ? "¿Quieres agregar una nota antes de marcar el caso como revisado?"
                            : "Actualiza la nota del caso."
                        }
                    </Typography>
                    <TextField
                        multiline
                        minRows={3}
                        label="Nota del docente"
                        placeholder="Escribe una observación breve"
                        value={noteDialogValue}
                        onChange={(e) => setNoteDialogValue(e.target.value)}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeNoteDialog}>Cancelar</Button>
                    {noteDialogMode === "review" ? (
                        <>
                            <Button
                                variant="outlined"
                                onClick={() => handleSaveReview(false)}
                            >
                                Sin nota
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => handleSaveReview(true)}
                            >
                                Guardar y revisar
                            </Button>
                        </>
                    ) : (
                        <Button variant="contained" onClick={handleSaveEdit}>
                            Guardar nota
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Stack spacing={2}>
                <Grid container spacing={2} alignItems="stretch">
                    <Grid item xs={12} md={4}>
                        <TextField
                            label="Estudiante"
                            placeholder="Ej. Demo Test 5"
                            value={studentFilter}
                            onChange={(e) => {
                                setStudentFilter(e.target.value)
                                setPage(0)
                            }}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={12} md={2}>
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

                    <Grid item xs={12} md={2}>
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
                            {clusterOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <TextField
                            select
                            label="Estado"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as StatusFilterValue)
                                setPage(0)
                            }}
                            fullWidth
                        >
                            <MenuItem value="all">Todos</MenuItem>
                            <MenuItem value="open">Abiertas</MenuItem>
                            <MenuItem value="resolved">Resueltas</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={6} md={1}>
                        <Button
                            variant="outlined"
                            onClick={handleReset}
                            fullWidth
                            sx={{ height: "100%" }}
                        >
                            Limpiar
                        </Button>
                    </Grid>

                    <Grid item xs={6} md={1}>
                        <Tooltip title={`Exportar ${filteredRows.length} filas a CSV`}>
                            <span style={{ display: "block", height: "100%" }}>
                                <Button
                                    variant="outlined"
                                    color="success"
                                    startIcon={<DownloadRoundedIcon />}
                                    onClick={handleExport}
                                    disabled={filteredRows.length === 0}
                                    fullWidth
                                    sx={{ height: "100%" }}
                                >
                                    CSV
                                </Button>
                            </span>
                        </Tooltip>
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
                            <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                <TableCell sx={{ fontWeight: 700, width: "11%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Estudiante</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, width: "7%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>
                                    Clicks
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, width: "7%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>
                                    Recursos
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, width: "7%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>
                                    Eventos
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, width: "12%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Cluster</TableCell>
                                <TableCell sx={{ fontWeight: 700, width: "9%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Resultado</TableCell>
                                <TableCell sx={{ fontWeight: 700, width: "11%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Pred. ML</TableCell>
                                <TableCell sx={{ fontWeight: 700, width: "11%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Riesgo</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, width: "9%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>
                                    Estado
                                </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, width: "16%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>
                                    Acción
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {paginatedRows.map((a) => {
                                const meta = getClusterMeta(a.cluster)
                                const status = getStatus(a)
                                const riskBorderColor = a.risk_score >= 0.75 ? "#ef4444" : a.risk_score >= 0.45 ? "#f59e0b" : "#22c55e"
                                return (
                                    <TableRow
                                        key={`${a.user_id}-${a.week_id}`}
                                        hover
                                        sx={{
                                            borderLeft: `3px solid ${riskBorderColor}`,
                                            opacity: status === "resolved" ? 0.6 : 1,
                                        }}
                                    >
                                        <TableCell>{getStudentName(a.user_id, nameMap)}</TableCell>
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
                                                            : meta.tone === "error"
                                                                ? "error"
                                                                : "default"
                                                }
                                                variant="outlined"
                                            />
                                        </TableCell>

                                        <TableCell>{outcomeLabel(a.final_result)}</TableCell>

                                        <TableCell>
                                            {a.pred_label ? (
                                                <Tooltip title={predTooltip(a.pred_proba)} arrow placement="top">
                                                    <Chip
                                                        size="small"
                                                        label={`${a.pred_label} ${Math.round((a.pred_confidence ?? 0) * 100)}%`}
                                                        color={predColor(a.pred_label) as "success" | "primary" | "warning" | "error" | "default"}
                                                        variant="outlined"
                                                    />
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="caption" color="text.disabled">—</Typography>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <RiskBreakdown a={a} />
                                        </TableCell>

                                        <TableCell align="center">
                                            <Chip
                                                size="small"
                                                label={statusLabel(status)}
                                                color={statusColor(status)}
                                                variant="outlined"
                                            />
                                        </TableCell>

                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                {status !== "resolved" && (
                                                     <Tooltip title="Marcar revisado">
                                                         <IconButton
                                                             size="small"
                                                             color="warning"
                                                             aria-label="Marcar revisado"
                                                             onClick={() => openReviewDialog(a)}
                                                         >
                                                             <CheckCircleRoundedIcon />
                                                         </IconButton>
                                                     </Tooltip>
                                                )}
                                                {getNoteValue(a) ? (
                                                    <Tooltip title="Editar comentario">
                                                        <IconButton
                                                            color="default"
                                                            size="small"
                                                            aria-label="Editar comentario"
                                                            onClick={() => openEditNoteDialog(a)}
                                                        >
                                                            <EditNoteRoundedIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip title="Agregar comentario">
                                                        <IconButton
                                                            color="primary"
                                                            size="small"
                                                            aria-label="Agregar comentario"
                                                            onClick={() => openEditNoteDialog(a)}
                                                        >
                                                            <AddCommentRoundedIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Ver trayectoria">
                                                    <IconButton
                                                        color="primary"
                                                        size="small"
                                                        aria-label="Ver trayectoria"
                                                        onClick={() => {
                                                            apiPost("/ops/audit-events", {
                                                                action: "view_trajectory",
                                                                payload: {
                                                                    course_id: courseId,
                                                                    user_id: a.user_id,
                                                                    week_id: a.week_id,
                                                                },
                                                            }).catch(() => null)
                                                            const from = encodeURIComponent(location.pathname)
                                                            const studentName = encodeURIComponent(getStudentName(a.user_id, nameMap))
                                                            navigate(
                                                                `/trajectory/${courseId}/${a.user_id}?week=${a.week_id}&from=${from}&name=${studentName}`
                                                            )
                                                        }}
                                                    >
                                                        <VisibilityRoundedIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Ver análisis del caso">
                                                    <IconButton
                                                        color="secondary"
                                                        size="small"
                                                        aria-label="Ver análisis del caso"
                                                        onClick={() => openCaseAnalysis(a)}
                                                    >
                                                        <AssessmentRoundedIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>

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
                </TableContainer>
            </Stack>
        </SectionCard>
    )
}
