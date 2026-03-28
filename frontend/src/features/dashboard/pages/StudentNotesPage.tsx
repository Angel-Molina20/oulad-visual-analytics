import { useMemo, useState } from "react"
import {
    Alert,
    Autocomplete,
    Box,
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
import AppShell from "../components/layout/AppShell"
import { useCourses } from "../hooks/useCourses"
import { useStudentNotes } from "../hooks/useStudentNotes"
import { useNavigate, useLocation } from "react-router-dom"

type StatusFilterValue = "all" | "open" | "in_review" | "resolved"

type NoteRow = {
    id: number
    course_id: string
    week_id: number
    user_id: number
    status: "open" | "in_review" | "resolved"
    note: string | null
    created_at: string
    updated_at?: string | null
}

export default function StudentNotesPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { courses, error: errorCourses } = useCourses()
    const [courseId, setCourseId] = useState("")
    const [studentFilter, setStudentFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const courseOptions = useMemo(
        () => [
            { label: "Todos", value: "" },
            ...courses.map((c) => ({ label: c, value: c })),
        ],
        [courses]
    )

    const selectedCourse = useMemo(() => {
        return courseOptions.find((opt) => opt.value === courseId) ?? courseOptions[0]
    }, [courseOptions, courseId])

    const studentQuery = useMemo(() => studentFilter.trim(), [studentFilter])

    const notes = useStudentNotes({
        courseId: courseId || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
    })

    const error = errorCourses || notes.error

    const statusLabel = (status: StatusFilterValue) => {
        if (status === "resolved") return "Revisado"
        if (status === "in_review") return "En revisión"
        return "Pendiente"
    }

    const statusColor = (status: StatusFilterValue) => {
        if (status === "resolved") return "success"
        if (status === "in_review") return "info"
        return "warning"
    }

    const rows = useMemo(() => {
        const query = studentQuery
        return notes.data.filter((row) => {
            if (!row.note || row.note.trim().length === 0) return false
            if (!query) return true
            return String(row.user_id).includes(query)
        })
    }, [notes.data, studentQuery])

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

    return (
        <AppShell>
            <Container maxWidth={false} disableGutters sx={{ width: "100%" }}>
                <Stack spacing={2.5}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>
                            Notas de estudiantes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Registro de comentarios docentes por estudiante.
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2.5,
                            border: "1px solid rgba(15, 23, 42, 0.08)",
                            bgcolor: "rgba(15, 23, 42, 0.02)",
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
                                        setCourseId(value?.value ?? "")
                                        setPage(0)
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Curso"
                                            placeholder="Todos los cursos"
                                            sx={filterFieldSx}
                                            fullWidth
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
                                    placeholder="Ej. 11391"
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
                                    <MenuItem value="in_review">En revisión</MenuItem>
                                    <MenuItem value="resolved">Revisados</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>
                    </Box>

                    {error && <Alert severity="error">{error}</Alert>}

                    <TableContainer sx={{ border: "1px solid rgba(15, 23, 42, 0.06)", borderRadius: 2 }}>
                        <Table size="medium">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, width: "12%" }}>Estudiante</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: "14%" }}>Curso</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: "8%" }}>Semana</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: "12%" }}>Estado</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Comentario</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: "16%" }}>Actualizado</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700, width: "8%" }}>
                                        Acción
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedRows.map((row: NoteRow) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell>{row.user_id}</TableCell>
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
                                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                                {row.note}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(row.updated_at || row.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Ver trayectoria">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    aria-label="Ver trayectoria"
                                                    onClick={() =>
                                                        navigate(
                                                            `/trajectory/${row.course_id}/${row.user_id}?week=${row.week_id}&from=${encodeURIComponent(location.pathname)}`
                                                        )
                                                    }
                                                >
                                                    <VisibilityRoundedIcon />
                                                </IconButton>
                                            </Tooltip>
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
                        <Typography variant="body2" color="text.secondary">
                            No hay comentarios para los filtros seleccionados.
                        </Typography>
                    )}
                </Stack>
            </Container>
        </AppShell>
    )
}
