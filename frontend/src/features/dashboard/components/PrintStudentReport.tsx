import { Box, Chip, Stack, Typography } from "@mui/material"
import type { TrajectoryResponse } from "../../../types/api"
import type { AlertFeedback } from "../../../types/api"
import { getClusterMeta } from "../utils/clusterMeta"

type Props = {
    studentName: string
    courseId: string
    data: TrajectoryResponse
    notes: AlertFeedback[]
}

const RESULT_COLORS: Record<string, string> = {
    Pass: "#16a34a",
    Distinction: "#2563eb",
    Fail: "#d97706",
    Withdrawn: "#dc2626",
}

export default function PrintStudentReport({ studentName, courseId, data, notes }: Props) {
    const traj = data.trajectory
    if (!traj.length) return null

    const clicks    = traj.map((t) => t.clicks_total)
    const events    = traj.map((t) => t.events_count)
    const resources = traj.map((t) => t.resources_touched)

    const totalClicks    = clicks.reduce((a, b) => a + b, 0)
    const avgClicks      = Math.round(totalClicks / clicks.length)
    const peakClicks     = Math.max(...clicks)
    const peakWeek       = traj[clicks.indexOf(peakClicks)]?.week_id ?? "—"
    const lastRow        = traj[traj.length - 1]
    const finalResult    = lastRow?.final_result ?? "—"
    const dominantCluster = (() => {
        const freq: Record<number, number> = {}
        traj.forEach((r) => { freq[r.cluster] = (freq[r.cluster] ?? 0) + 1 })
        return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0)
    })()
    const clusterMeta = getClusterMeta(dominantCluster)

    const generatedAt = new Date().toLocaleString("es-ES", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    })

    return (
        <Box
            data-print-only
            sx={{
                display: "none",
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                color: "#0f172a",
                fontSize: 11,
            }}
        >
            {/* ── Encabezado ────────────────────────────────────────────────── */}
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                sx={{ mb: 2, pb: 1.5, borderBottom: "2px solid #0f172a" }}
            >
                <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                        Informe de trayectoria académica
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        OULAD Visual Analytics · Sistema de analítica de aprendizaje
                    </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2" color="text.secondary">Generado el</Typography>
                    <Typography variant="body2" fontWeight={600}>{generatedAt}</Typography>
                </Box>
            </Stack>

            {/* ── Datos del estudiante ──────────────────────────────────────── */}
            <Box
                sx={{
                    mb: 2.5,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                }}
            >
                <Stack direction="row" spacing={4} flexWrap="wrap">
                    <Box>
                        <Typography variant="caption" color="text.secondary">Estudiante</Typography>
                        <Typography variant="body1" fontWeight={700}>{studentName}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Curso</Typography>
                        <Typography variant="body1" fontWeight={700}>{courseId}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Semanas registradas</Typography>
                        <Typography variant="body1" fontWeight={700}>{traj.length}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Rango de semanas</Typography>
                        <Typography variant="body1" fontWeight={700}>
                            {traj[0].week_id} – {lastRow.week_id}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Resultado final</Typography>
                        <Typography
                            variant="body1"
                            fontWeight={700}
                            sx={{ color: RESULT_COLORS[finalResult] ?? "#64748b" }}
                        >
                            {finalResult}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Perfil predominante</Typography>
                        <Typography variant="body1" fontWeight={700}>{clusterMeta.label}</Typography>
                    </Box>
                </Stack>
            </Box>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                Resumen de actividad
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2.5 }} flexWrap="wrap">
                {[
                    { label: "Clicks totales",         value: totalClicks.toLocaleString("es-ES") },
                    { label: "Clicks promedio/semana",  value: avgClicks.toLocaleString("es-ES") },
                    { label: "Semana más activa",       value: `Semana ${peakWeek} (${peakClicks.toLocaleString("es-ES")} clicks)` },
                    { label: "Recursos últ. semana",    value: resources[resources.length - 1] },
                    { label: "Eventos últ. semana",     value: events[events.length - 1] },
                ].map((kpi) => (
                    <Box
                        key={kpi.label}
                        sx={{
                            p: 1.5,
                            borderRadius: 1,
                            border: "1px solid #e2e8f0",
                            minWidth: 130,
                            flex: "1 1 130px",
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" display="block">
                            {kpi.label}
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>{kpi.value}</Typography>
                    </Box>
                ))}
            </Stack>

            {/* ── Tabla de trayectoria ─────────────────────────────────────── */}
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                Actividad semanal
            </Typography>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                        {["Semana", "Clicks", "Eventos", "Recursos", "Diversidad recursos", "Ratio actividad", "Perfil"].map((h) => (
                            <th key={h} style={{ padding: "5px 8px", textAlign: "left", fontSize: 9, fontWeight: 700, border: "1px solid #cbd5e1" }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {traj.map((row, i) => (
                        <tr key={row.week_id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                            <td style={{ padding: "4px 8px", fontSize: 9, border: "1px solid #e2e8f0", fontWeight: 600 }}>
                                {row.week_id}
                            </td>
                            <td style={{ padding: "4px 8px", fontSize: 9, border: "1px solid #e2e8f0" }}>
                                {row.clicks_total.toLocaleString("es-ES")}
                            </td>
                            <td style={{ padding: "4px 8px", fontSize: 9, border: "1px solid #e2e8f0" }}>
                                {row.events_count}
                            </td>
                            <td style={{ padding: "4px 8px", fontSize: 9, border: "1px solid #e2e8f0" }}>
                                {row.resources_touched}
                            </td>
                            <td style={{ padding: "4px 8px", fontSize: 9, border: "1px solid #e2e8f0" }}>
                                {row.resource_types_touched}
                            </td>
                            <td style={{ padding: "4px 8px", fontSize: 9, border: "1px solid #e2e8f0" }}>
                                {row.weeks_active_ratio !== undefined
                                    ? `${(row.weeks_active_ratio * 100).toFixed(0)}%`
                                    : "—"}
                            </td>
                            <td style={{ padding: "4px 8px", fontSize: 9, border: "1px solid #e2e8f0" }}>
                                {getClusterMeta(row.cluster).label}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ── Notas del docente ─────────────────────────────────────────── */}
            {notes.length > 0 && (
                <>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                        Notas del docente ({notes.length})
                    </Typography>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                        <thead>
                            <tr style={{ background: "#f1f5f9" }}>
                                {["Semana", "Estado", "Riesgo", "Comentario", "Fecha"].map((h) => (
                                    <th key={h} style={{ padding: "5px 8px", textAlign: "left", fontSize: 9, fontWeight: 700, border: "1px solid #cbd5e1" }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {notes.map((note) => (
                                <tr key={note.id}>
                                    <td style={{ padding: "4px 8px", fontSize: 9, border: "1px solid #e2e8f0" }}>{note.week_id}</td>
                                    <td style={{ padding: "4px 8px", fontSize: 9, border: "1px solid #e2e8f0" }}>
                                        {note.status === "resolved" ? "Revisado" : "Pendiente"}
                                    </td>
                                    <td style={{ padding: "4px 8px", fontSize: 9, border: "1px solid #e2e8f0" }}>
                                        {note.risk_score != null ? `${Math.round(note.risk_score * 100)}%` : "—"}
                                    </td>
                                    <td style={{ padding: "4px 8px", fontSize: 9, border: "1px solid #e2e8f0", maxWidth: 280 }}>
                                        {note.note}
                                    </td>
                                    <td style={{ padding: "4px 8px", fontSize: 9, border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                                        {new Date(note.updated_at || note.created_at).toLocaleDateString("es-ES")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* ── Pie de página ─────────────────────────────────────────────── */}
            <Box sx={{ mt: 2, pt: 1, borderTop: "1px solid #e2e8f0" }}>
                <Typography variant="caption" color="text.secondary">
                    Informe generado automáticamente por OULAD Visual Analytics · Los datos son pseudonimizados para proteger la privacidad del estudiante.
                </Typography>
            </Box>
        </Box>
    )
}
