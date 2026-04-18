import { useMemo, useState } from "react"
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Chip,
    Container,
    Grid,
    IconButton,
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
    Tooltip,
    Typography,
} from "@mui/material"
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded"
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded"
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded"
import { downloadCsv } from "../../../utils/exportCsv"
import AppShell from "../components/layout/AppShell"
import { useStudentNotes } from "../hooks/useStudentNotes"
import { useWeeks } from "../hooks/useWeeks"
import { useStudentList } from "../hooks/useStudentList"
import { apiPost } from "../../../api/client"
import type { AlertFeedback } from "../../../types/api"
import { useNavigate, useLocation } from "react-router-dom"
import { useDashboardFilters } from "../context/DashboardFiltersContext"

type StatusFilterValue = "all" | "open" | "resolved"

type NoteRow = {
    id: number
    course_id: string
    week_id: number
    user_id: number
    risk_score: number | null
    status: "open" | "resolved"
    note: string | null
    created_at: string
    updated_at?: string | null
}

export default function StudentNotesPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { courses, coursesError } = useDashboardFilters()
    const [notesCourseId, setNotesCourseId] = useState("")
    const [studentFilter, setStudentFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const notesWeeks = useWeeks(notesCourseId)

    const courseOptions = useMemo(
        () => [
            { label: "Todos", value: "" },
            ...courses.map((c) => ({ label: c, value: c })),
        ],
        [courses]
    )

    const selectedCourse = useMemo(() => {
        return courseOptions.find((opt) => opt.value === notesCourseId) ?? courseOptions[0]
    }, [courseOptions, notesCourseId])

    const notes = useStudentNotes({
        courseId: notesCourseId || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
    })

    const { data: studentList } = useStudentList(notesCourseId)

    const error = coursesError || notes.error

    const nameMap = useMemo(() => {
        const map = new Map<number, string>()
        studentList.forEach((s) => map.set(s.user_id, s.display_name ?? "Demo Test ?"))
        return map
    }, [studentList])

    const statusLabel = (status: StatusFilterValue) => {
        if (status === "resolved") return "Revisado"
        return "Pendiente"
    }

    const statusColor = (status: StatusFilterValue) => {
        if (status === "resolved") return "success"
        return "warning"
    }

    const riskLabel = (risk: number | null) => {
        if (risk === null || Number.isNaN(risk)) return "-"
        if (risk >= 0.75) return `Alto · ${Math.round(risk * 100)}%`
        if (risk >= 0.45) return `Medio · ${Math.round(risk * 100)}%`
        return `Bajo · ${Math.round(risk * 100)}%`
    }

    const riskColor = (risk: number | null) => {
        if (risk === null || Number.isNaN(risk)) return "default"
        if (risk >= 0.75) return "error"
        if (risk >= 0.45) return "warning"
        return "success"
    }

    const riskTone = (risk: number | null) => {
        if (risk === null || Number.isNaN(risk)) return { border: undefined, text: undefined }
        if (risk >= 0.75) return { border: "#d32f2f", text: "#d32f2f" }
        if (risk >= 0.45) return { border: "#f9a825", text: "#f9a825" }
        return { border: "#2e7d32", text: "#2e7d32" }
    }

    const riskTooltip = (risk: number | null) => {
        if (risk === null || Number.isNaN(risk)) return "Sin riesgo calculado"
        if (risk >= 0.75) return `Riesgo alto · ${(risk * 100).toFixed(0)}%`
        if (risk >= 0.45) return `Riesgo medio · ${(risk * 100).toFixed(0)}%`
        return `Riesgo bajo · ${(risk * 100).toFixed(0)}%`
    }

    const rows = useMemo(() => {
        const query = studentFilter.trim().toLowerCase()
        return notes.data.filter((row) => {
            if (!row.note || row.note.trim().length === 0) return false
            if (!query) return true
            return nameMap.get(row.user_id) ?? "Demo Test ?".toLowerCase().includes(query)
        })
    }, [notes.data, studentFilter, nameMap])

    const paginatedRows = useMemo(() => {
        const start = page * rowsPerPage
        return rows.slice(start, start + rowsPerPage)
    }, [rows, page, rowsPerPage])

    const filterFieldSx = {
        bgcolor: "#fff",
        borderRadius: 2,
        "& .MuiInputBase-root": {
            height: 56,
        },
        "& .MuiInputBase-input": {
            padding: "16px 14px",
            fontSize: 16,
        },
        "& .MuiInputLabel-root": {
            fontSize: 15,
        },
    }

    const handleExport = () => {
        const suffix = notesCourseId ? `_${notesCourseId}` : ""
        const filename = `notas${suffix}_${new Date().toISOString().slice(0, 10)}.csv`
        downloadCsv(rows, [
            { label: "Estudiante",  value: (r) => getStudentName(r.user_id, nameMap) },
            { label: "Curso",       value: (r) => r.course_id },
            { label: "Semana",      value: (r) => r.week_id },
            { label: "Estado",      value: (r) => r.status === "resolved" ? "Revisado" : "Pendiente" },
            { label: "Riesgo (%)",  value: (r) => r.risk_score != null ? Math.round(r.risk_score * 100) : "" },
            { label: "Comentario",  value: (r) => r.note ?? "" },
            { label: "Actualizado", value: (r) => new Date(r.updated_at || r.created_at).toLocaleString() },
        ], filename)
    }

    const markReviewed = async (row: NoteRow) => {
        if (row.status !== "open") return
        try {
            await apiPost<AlertFeedback>("/ops/alerts/feedback", {
                course_id: row.course_id,
                week_id: row.week_id,
                user_id: row.user_id,
                risk_score: row.risk_score,
                status: "resolved",
                note: row.note,
            })
            notes.reload()
        } catch (err) {
            // Ignore for now; UI remains unchanged
        }
    }

    return (
        <AppShell>
            <Container maxWidth={false} disableGutters sx={{ width: "100%" }}>
                <Stack spacing={2.5}>
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: "1px solid rgba(15, 23, 42, 0.07)",
                            bgcolor: "#fff",
                        }}
                    >
                        <Grid container spacing={2} alignItems="stretch">
                            <Grid item xs={12} md={7}>
                                <Autocomplete
                                    options={courseOptions}
                                    value={selectedCourse}
                                    isOptionEqualToValue={(option, value) => option.value === value.value}
                                    getOptionLabel={(option) => option.label}
                                    onChange={(_, value) => {
                                        setNotesCourseId(value?.value ?? "")
                                        setPage(0)
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Curso"
                                            placeholder="Todos los cursos"
                                            sx={filterFieldSx}
                                            fullWidth
                                            helperText={
                                                notesCourseId &&
                                                notesWeeks.data?.week_min !== undefined &&
                                                notesWeeks.data?.week_max !== undefined
                                                    ? `Rango semanas: ${notesWeeks.data.week_min}–${notesWeeks.data.week_max}`
                                                    : ""
                                            }
                                        />
                                    )}
                                    noOptionsText="Sin cursos"
                                    clearOnEscape
                                    disableClearable
                                    fullWidth
                                    sx={{
                                        "& .MuiInputBase-root": { height: 56 },
                                        "& .MuiAutocomplete-input": { fontSize: 16 },
                                        minWidth: 360,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label="Estudiante"
                                    placeholder="Ej. Demo Test 5"
                                    value={studentFilter}
                                    onChange={(e) => {
                                        setStudentFilter(e.target.value)
                                        setPage(0)
                                    }}
                                    sx={filterFieldSx}
                                    fullWidth
                                />
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
                                    sx={filterFieldSx}
                                    fullWidth
                                >
                                    <MenuItem value="all">Todos</MenuItem>
                                    <MenuItem value="open">Pendientes</MenuItem>
                                    <MenuItem value="resolved">Revisados</MenuItem>
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", pt: "0 !important" }}>
                                <Tooltip title={`Exportar ${rows.length} filas a CSV`}>
                                    <span>
                                        <Button
                                            variant="outlined"
                                            color="success"
                                            startIcon={<DownloadRoundedIcon />}
                                            onClick={handleExport}
                                            disabled={rows.length === 0}
                                            size="small"
                                        >
                                            Exportar CSV
                                        </Button>
                                    </span>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Box>

                    {error && <Alert severity="error">{error}</Alert>}

                    <TableContainer sx={{ border: "1px solid rgba(15, 23, 42, 0.06)", borderRadius: 2 }}>
                        <Table size="medium">
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                                    <TableCell sx={{ fontWeight: 700, width: "12%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Estudiante</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: "14%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Curso</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: "8%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Semana</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: "12%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Estado</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: "10%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Riesgo</TableCell>
                                    <TableCell sx={{ fontWeight: 700, borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Comentario</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: "16%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>Actualizado</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, width: "8%", borderBottom: "2px solid rgba(15,23,42,0.08)" }}>
                                        Acción
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedRows.map((row: NoteRow) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{nameMap.get(row.user_id) ?? "Demo Test ?"}</TableCell>
                                        <TableCell>{row.course_id}</TableCell>
                                        <TableCell>{row.week_id}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={statusLabel(row.status)}
                                                color={statusColor(row.status)}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={riskTooltip(row.risk_score)} placement="left" arrow>
                                                <Chip
                                                    size="small"
                                                    label={riskLabel(row.risk_score)}
                                                    color={riskColor(row.risk_score)}
                                                    variant="outlined"
                                                    sx={() => {
                                                        const tone = riskTone(row.risk_score)
                                                        return tone.border
                                                            ? {
                                                                borderColor: tone.border,
                                                                color: tone.text,
                                                                fontWeight: 700,
                                                            }
                                                            : { fontWeight: 700 }
                                                    }}
                                                />
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                                {row.note}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(row.updated_at || row.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                {row.status !== "resolved" && (
                                                    <Tooltip title="Marcar revisado">
                                                        <IconButton
                                                            size="small"
                                                            color="warning"
                                                            aria-label="Marcar revisado"
                                                            onClick={() => markReviewed(row)}
                                                        >
                                                            <CheckCircleRoundedIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Ver trayectoria">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        aria-label="Ver trayectoria"
                                                        onClick={() => {
                                                            const studentName = encodeURIComponent(nameMap.get(row.user_id) ?? "Demo Test ?")
                                                            navigate(
                                                                `/trajectory/${row.course_id}/${row.user_id}?week=${row.week_id}&from=${encodeURIComponent(location.pathname)}&name=${studentName}`
                                                            )
                                                        }}
                                                    >
                                                        <VisibilityRoundedIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <TablePagination
                            component="div"
                            count={rows.length}
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

                    {!notes.loading && rows.length === 0 && !error && (
                        <Box
                            sx={{
                                py: 6,
                                textAlign: "center",
                                border: "1px dashed rgba(15,23,42,0.12)",
                                borderRadius: 2,
                                bgcolor: "rgba(15,23,42,0.01)",
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                No hay comentarios para los filtros seleccionados.
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
                                Los comentarios se crean desde la tabla de alertas al revisar un caso.
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </Container>
        </AppShell>
    )
}
