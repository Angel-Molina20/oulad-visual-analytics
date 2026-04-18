import { useMemo, useState } from "react"
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
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material"
import Plot from "react-plotly.js"
import AppShell from "../components/layout/AppShell"
import SectionCard from "../components/ui/SectionCard"
import { useDashboardFilters } from "../context/DashboardFiltersContext"
import { useStudentList } from "../hooks/useStudentList"
import { useMultiTrajectory } from "../hooks/useMultiTrajectory"
import { buildStudentNameMap, getStudentName } from "../../../utils/studentNames"
import { getClusterMeta } from "../utils/clusterMeta"

// ── Paleta de colores por estudiante (hasta 4) ───────────────────────────────
const STUDENT_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"]

// ── Métricas disponibles ─────────────────────────────────────────────────────
type MetricKey = "clicks_total" | "events_count" | "resources_touched"
const METRICS: { key: MetricKey; label: string; yLabel: string }[] = [
    { key: "clicks_total",      label: "Clicks totales",    yLabel: "Clicks" },
    { key: "events_count",      label: "Eventos",           yLabel: "Eventos" },
    { key: "resources_touched", label: "Recursos tocados",  yLabel: "Recursos" },
]

const MAX_STUDENTS = 4

const PLOT_CONFIG = { displayModeBar: false, responsive: true }
const PLOT_STYLE  = { width: "100%", height: "100%" }

export default function StudentComparatorPage() {
    const { courses, coursesError, courseId, setCourseId } = useDashboardFilters()
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
    const [metric, setMetric] = useState<MetricKey>("clicks_total")

    const courseOptions = useMemo(
        () => courses.map((c) => ({ label: c, value: c })),
        [courses]
    )
    const selectedCourse = useMemo(
        () => courseOptions.find((o) => o.value === courseId) ?? (courseOptions[0] ?? null),
        [courseOptions, courseId]
    )

    const { data: studentList, loading: listLoading, error: listError } = useStudentList(courseId)

    // Mapa de nombres "Demo Test N" para todos los estudiantes del curso
    const nameMap = useMemo(
        () => buildStudentNameMap(studentList.map((s) => s.user_id)),
        [studentList]
    )

    // Opciones para el selector multi-estudiante
    const studentOptions = useMemo(
        () =>
            studentList.map((s) => ({
                userId: s.user_id,
                label: getStudentName(s.user_id, nameMap),
                cluster: s.cluster,
                finalResult: s.final_result,
            })),
        [studentList, nameMap]
    )

    const selectedOptions = useMemo(
        () => studentOptions.filter((o) => selectedUserIds.includes(o.userId)),
        [studentOptions, selectedUserIds]
    )

    // Trayectorias en paralelo
    const trajectories = useMultiTrajectory(courseId, selectedUserIds)

    // ── Construir trazas Plotly ──────────────────────────────────────────────
    const traces = useMemo(() => {
        return trajectories
            .filter((t) => t.data?.trajectory?.length)
            .map((t, i) => {
                const rows = t.data!.trajectory
                const color = STUDENT_COLORS[i % STUDENT_COLORS.length]
                const name = getStudentName(t.userId, nameMap)
                return {
                    x: rows.map((r) => r.week_id),
                    y: rows.map((r) => r[metric] as number),
                    type: "scatter" as const,
                    mode: "lines+markers" as const,
                    name,
                    line: { color, width: 2.5 },
                    marker: { size: 6, color },
                    hovertemplate: `<b>${name}</b><br>Semana %{x}<br>${METRICS.find((m) => m.key === metric)?.yLabel}: %{y}<extra></extra>`,
                }
            })
    }, [trajectories, metric, nameMap])

    // ── Tabla comparativa por semana ─────────────────────────────────────────
    const summaryRows = useMemo(() => {
        return trajectories
            .filter((t) => t.data?.trajectory?.length)
            .map((t, i) => {
                const rows = t.data!.trajectory
                const vals = rows.map((r) => r[metric] as number)
                const total = vals.reduce((a, b) => a + b, 0)
                const max = Math.max(...vals)
                const maxWeek = rows[vals.indexOf(max)]?.week_id
                const last = vals[vals.length - 1]
                return {
                    userId: t.userId,
                    name: getStudentName(t.userId, nameMap),
                    color: STUDENT_COLORS[i % STUDENT_COLORS.length],
                    total,
                    max,
                    maxWeek,
                    last,
                    weeks: rows.length,
                    finalResult: t.data!.trajectory[rows.length - 1]?.final_result ?? "—",
                }
            })
    }, [trajectories, metric, nameMap])

    const anyLoading = trajectories.some((t) => t.loading) || listLoading
    const anyError = coursesError || listError || trajectories.find((t) => t.error)?.error

    const metricLabel = METRICS.find((m) => m.key === metric)?.yLabel ?? ""

    const filterFieldSx = {
        bgcolor: "#fff",
        borderRadius: 2,
        "& .MuiInputBase-root": { height: 56 },
        "& .MuiInputBase-input": { padding: "16px 14px", fontSize: 16 },
        "& .MuiInputLabel-root": { fontSize: 15 },
    }

    return (
        <AppShell>
            <Container maxWidth={false} disableGutters sx={{ width: "100%" }}>
                <Stack spacing={2.5}>
                    {/* Header */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        spacing={1}
                    >
                        <Box>
                            <Typography variant="h6" fontWeight={700}>
                                Comparador de estudiantes
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Selecciona hasta {MAX_STUDENTS} estudiantes para comparar su actividad semana a semana.
                            </Typography>
                        </Box>
                        {anyLoading && <CircularProgress size={22} />}
                    </Stack>

                    {/* Filtros */}
                    <Box
                        sx={{
                            p: 2.5,
                            borderRadius: 2.5,
                            border: "1px solid rgba(15,23,42,0.08)",
                            bgcolor: "rgba(15,23,42,0.02)",
                        }}
                    >
                        <Grid container spacing={2.5} alignItems="flex-start">
                            {/* Selector de curso */}
                            <Grid item xs={12}>
                                <Autocomplete
                                    options={courseOptions}
                                    value={selectedCourse}
                                    isOptionEqualToValue={(o, v) => o.value === v.value}
                                    getOptionLabel={(o) => o.label}
                                    onChange={(_, v) => {
                                        if (v) {
                                            setCourseId(v.value)
                                            setSelectedUserIds([])
                                        }
                                    }}
                                    disableClearable
                                    disablePortal
                                    noOptionsText="Sin cursos"
                                    fullWidth
                                    sx={{
                                        "& .MuiInputBase-root": { height: 56 },
                                        "& .MuiAutocomplete-input": { fontSize: 16 },
                                        "& .MuiAutocomplete-listbox": { fontSize: 16 },
                                        "& .MuiAutocomplete-option": { fontSize: 16, py: 1.5 },
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Curso"
                                            fullWidth
                                            sx={filterFieldSx}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Selector multi-estudiante */}
                            <Grid item xs={12}>
                                <Autocomplete
                                    multiple
                                    options={studentOptions}
                                    value={selectedOptions}
                                    isOptionEqualToValue={(o, v) => o.userId === v.userId}
                                    getOptionLabel={(o) => o.label}
                                    getOptionDisabled={(o) =>
                                        selectedUserIds.length >= MAX_STUDENTS &&
                                        !selectedUserIds.includes(o.userId)
                                    }
                                    onChange={(_, values) =>
                                        setSelectedUserIds(values.map((v) => v.userId))
                                    }
                                    fullWidth
                                    disablePortal
                                    sx={{
                                        "& .MuiInputBase-root": { minHeight: 56 },
                                        "& .MuiAutocomplete-input": { fontSize: 16 },
                                        "& .MuiAutocomplete-listbox": { fontSize: 16 },
                                        "& .MuiAutocomplete-option": { fontSize: 16, py: 1.5 },
                                    }}
                                    renderTags={(values, getTagProps) =>
                                        values.map((opt, index) => {
                                            const { key, ...tagProps } = getTagProps({ index })
                                            return (
                                                <Chip
                                                    key={key}
                                                    {...tagProps}
                                                    label={opt.label}
                                                    sx={{
                                                        bgcolor: STUDENT_COLORS[index % STUDENT_COLORS.length],
                                                        color: "#fff",
                                                        fontWeight: 600,
                                                        fontSize: 14,
                                                        height: 30,
                                                        "& .MuiChip-deleteIcon": { color: "rgba(255,255,255,0.7)" },
                                                    }}
                                                />
                                            )
                                        })
                                    }
                                    renderOption={(props, opt) => {
                                        const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: string }
                                        const meta = getClusterMeta(opt.cluster)
                                        return (
                                            <li key={key} {...rest} style={{ padding: "10px 16px" }}>
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                    sx={{ width: "100%" }}
                                                >
                                                    <Typography fontSize={16} fontWeight={500}>{opt.label}</Typography>
                                                    <Stack direction="row" spacing={0.5}>
                                                        <Chip
                                                            label={meta.label}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: 12 }}
                                                        />
                                                        {opt.finalResult && (
                                                            <Chip
                                                                label={opt.finalResult}
                                                                size="small"
                                                                sx={{
                                                                    fontSize: 12,
                                                                    bgcolor:
                                                                        opt.finalResult === "Pass" ? "#22c55e"
                                                                        : opt.finalResult === "Distinction" ? "#3b82f6"
                                                                        : opt.finalResult === "Fail" ? "#f59e0b"
                                                                        : "#ef4444",
                                                                    color: "#fff",
                                                                }}
                                                            />
                                                        )}
                                                    </Stack>
                                                </Stack>
                                            </li>
                                        )
                                    }}
                                    loading={listLoading}
                                    loadingText="Cargando estudiantes…"
                                    noOptionsText="Sin estudiantes en este curso"
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Estudiantes a comparar"
                                            placeholder={
                                                selectedUserIds.length === 0
                                                    ? "Busca por nombre…"
                                                    : selectedUserIds.length >= MAX_STUDENTS
                                                    ? "Máximo alcanzado"
                                                    : "Añadir otro…"
                                            }
                                            helperText={`${selectedUserIds.length} de ${MAX_STUDENTS} seleccionados`}
                                            fullWidth
                                            sx={filterFieldSx}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    {anyError && <Alert severity="error">{String(anyError)}</Alert>}

                    {selectedUserIds.length === 0 && (
                        <Box
                            sx={{
                                py: 8,
                                textAlign: "center",
                                border: "1px dashed rgba(15,23,42,0.12)",
                                borderRadius: 2,
                                bgcolor: "rgba(15,23,42,0.01)",
                            }}
                        >
                            <Typography variant="body1" color="text.secondary">
                                Selecciona al menos 2 estudiantes para comparar sus trayectorias.
                            </Typography>
                        </Box>
                    )}

                    {selectedUserIds.length >= 1 && (
                        <>
                            {/* Selector de métrica */}
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Typography variant="body2" color="text.secondary">
                                    Métrica:
                                </Typography>
                                <ToggleButtonGroup
                                    value={metric}
                                    exclusive
                                    onChange={(_, v) => v && setMetric(v)}
                                    size="medium"
                                >
                                    {METRICS.map((m) => (
                                        <ToggleButton
                                            key={m.key}
                                            value={m.key}
                                            sx={{ px: 2.5, py: 1, fontWeight: 600, fontSize: 14 }}
                                        >
                                            {m.label}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                            </Stack>

                            {/* Gráfica de trayectorias */}
                            <SectionCard
                                title={`Trayectoria comparada — ${METRICS.find((m) => m.key === metric)?.label}`}
                                subtitle="Evolución semanal de cada estudiante seleccionado"
                            >
                                <Box sx={{ height: 320, minHeight: 200 }}>
                                    {traces.length > 0 ? (
                                        <Plot
                                            data={traces}
                                            layout={{
                                                margin: { t: 10, r: 20, b: 40, l: 55 },
                                                xaxis: {
                                                    title: "Semana",
                                                    tickfont: { size: 11 },
                                                    dtick: 1,
                                                },
                                                yaxis: {
                                                    title: metricLabel,
                                                    tickfont: { size: 11 },
                                                },
                                                legend: {
                                                    orientation: "h",
                                                    y: 1.12,
                                                    x: 0,
                                                },
                                                paper_bgcolor: "transparent",
                                                plot_bgcolor: "transparent",
                                                hovermode: "x unified",
                                            }}
                                            config={PLOT_CONFIG}
                                            style={PLOT_STYLE}
                                            useResizeHandler
                                        />
                                    ) : (
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                            <CircularProgress size={28} />
                                        </Box>
                                    )}
                                </Box>
                            </SectionCard>

                            {/* Tabla resumen */}
                            {summaryRows.length > 0 && (
                                <SectionCard
                                    title="Resumen comparativo"
                                    subtitle={`Estadísticas de ${METRICS.find((m) => m.key === metric)?.label.toLowerCase()} por estudiante`}
                                >
                                    <Box sx={{ overflowX: "auto" }}>
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                            <thead>
                                                <tr style={{ borderBottom: "2px solid rgba(15,23,42,0.08)" }}>
                                                    {["Estudiante", "Semanas", "Total", "Máximo", "Semana pico", "Última semana", "Resultado"].map(
                                                        (h) => (
                                                            <th
                                                                key={h}
                                                                style={{
                                                                    padding: "8px 12px",
                                                                    textAlign: "left",
                                                                    fontWeight: 700,
                                                                    color: "#334155",
                                                                }}
                                                            >
                                                                {h}
                                                            </th>
                                                        )
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {summaryRows.map((row) => (
                                                    <tr
                                                        key={row.userId}
                                                        style={{ borderBottom: "1px solid rgba(15,23,42,0.05)" }}
                                                    >
                                                        <td style={{ padding: "8px 12px" }}>
                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                <Box
                                                                    sx={{
                                                                        width: 10,
                                                                        height: 10,
                                                                        borderRadius: "50%",
                                                                        bgcolor: row.color,
                                                                        flexShrink: 0,
                                                                    }}
                                                                />
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    {row.name}
                                                                </Typography>
                                                            </Stack>
                                                        </td>
                                                        <td style={{ padding: "8px 12px", color: "#64748b" }}>{row.weeks}</td>
                                                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>
                                                            {row.total.toLocaleString("es-ES")}
                                                        </td>
                                                        <td style={{ padding: "8px 12px", color: "#22c55e", fontWeight: 600 }}>
                                                            {row.max.toLocaleString("es-ES")}
                                                        </td>
                                                        <td style={{ padding: "8px 12px", color: "#64748b" }}>
                                                            Sem. {row.maxWeek}
                                                        </td>
                                                        <td style={{ padding: "8px 12px", color: "#64748b" }}>
                                                            {row.last.toLocaleString("es-ES")}
                                                        </td>
                                                        <td style={{ padding: "8px 12px" }}>
                                                            <Tooltip title={`Resultado final: ${row.finalResult}`} arrow>
                                                                <Chip
                                                                    label={row.finalResult ?? "—"}
                                                                    size="small"
                                                                    sx={{
                                                                        bgcolor:
                                                                            row.finalResult === "Pass" ? "#22c55e"
                                                                            : row.finalResult === "Distinction" ? "#3b82f6"
                                                                            : row.finalResult === "Fail" ? "#f59e0b"
                                                                            : row.finalResult === "Withdrawn" ? "#ef4444"
                                                                            : "#94a3b8",
                                                                        color: "#fff",
                                                                        fontWeight: 600,
                                                                        fontSize: 11,
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Box>
                                </SectionCard>
                            )}
                        </>
                    )}
                </Stack>
            </Container>
        </AppShell>
    )
}
