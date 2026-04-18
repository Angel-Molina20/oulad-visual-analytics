import { useMemo } from "react"
import { Link as RouterLink, useParams, useLocation, useNavigate } from "react-router-dom"
import {
    Alert,
    Box,
    Breadcrumbs,
    Button,
    CircularProgress,
    Container,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material"
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded"
import HomeRoundedIcon from "@mui/icons-material/HomeRounded"
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded"
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded"

import AppShell from "../components/layout/AppShell"
import TrajectoryPanel from "../components/TrajectoryPanel"
import PrintStudentReport from "../components/PrintStudentReport"
import { useTrajectory } from "../hooks/useTrajectory"
import { useStudentNotes } from "../hooks/useStudentNotes"

export default function StudentTrajectoryPage() {
    const { courseId = "", userId = "" } = useParams()

    const numericUserId = useMemo(() => Number(userId), [userId])
    const isValidUserId = Number.isFinite(numericUserId) && numericUserId > 0
    const canLoad = Boolean(courseId) && isValidUserId

    const traj = useTrajectory(courseId, canLoad ? numericUserId : 0)
    const studentNotes = useStudentNotes(
        canLoad ? { courseId, userId: numericUserId } : {}
    )

    const location = useLocation()
    const navigate = useNavigate()
    const selectedWeek = useMemo(() => {
        const sp = new URLSearchParams(location.search)
        const w = Number(sp.get("week"))
        return Number.isFinite(w) ? w : null
    }, [location.search])

    const weekOptions = useMemo(() => {
        const weeks = traj.data?.trajectory?.map((t) => t.week_id) ?? []
        return Array.from(new Set(weeks)).sort((a, b) => a - b)
    }, [traj.data])

    const summary = useMemo(() => {
        const rows = traj.data?.trajectory ?? []
        if (!rows.length) return null
        const first = rows[0]
        const last = rows[rows.length - 1]
        return {
            totalWeeks: rows.length,
            firstWeek: first.week_id,
            lastWeek: last.week_id,
            lastClicks: last.clicks_total,
        }
    }, [traj.data])

    const returnTo = useMemo(() => {
        const sp = new URLSearchParams(location.search)
        const raw = sp.get("from")
        if (!raw) return "/"
        const decoded = decodeURIComponent(raw)
        return decoded.startsWith("/") ? decoded : "/"
    }, [location.search])

    const returnLabel = useMemo(() => {
        if (returnTo === "/notes") return "Notas de estudiantes"
        if (returnTo === "/clusters") return "Analitica de cursos"
        return "Resumen"
    }, [returnTo])

    const studentDisplayName = useMemo(() => {
        const sp = new URLSearchParams(location.search)
        const raw = sp.get("name")
        return raw ? decodeURIComponent(raw) : `Estudiante ${numericUserId}`
    }, [location.search, numericUserId])

    return (
        <AppShell>
            <Container
                maxWidth={false}
                disableGutters
                sx={{
                    width: "100%",
                }}
            >
                <Stack spacing={3}>
                    {/* Header compacto */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                        <Stack spacing={0.5}>
                            <Breadcrumbs sx={{ fontSize: 13 }}>
                                <Box
                                    component={RouterLink}
                                    to={returnTo}
                                    sx={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        textDecoration: "none",
                                        color: "text.secondary",
                                        fontSize: 13,
                                    }}
                                >
                                    <HomeRoundedIcon sx={{ fontSize: 14 }} />
                                    {returnLabel}
                                </Box>
                                <Box
                                    sx={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        color: "text.primary",
                                        fontSize: 13,
                                    }}
                                >
                                    <TimelineRoundedIcon sx={{ fontSize: 14 }} />
                                    Trayectoria
                                </Box>
                            </Breadcrumbs>

                            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                                <Typography variant="h6" fontWeight={700}>
                                    {studentDisplayName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Curso {courseId}
                                </Typography>
                                {summary && (
                                    <>
                                        <Typography variant="body2" color="text.secondary">
                                            Sem. {summary.firstWeek}–{summary.lastWeek}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {summary.totalWeeks} semanas · {summary.lastClicks} clicks última sem.
                                        </Typography>
                                    </>
                                )}
                            </Stack>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap className="no-print">
                            <TextField
                                select
                                label="Semana destacada"
                                size="small"
                                value={selectedWeek === null ? "all" : String(selectedWeek)}
                                onChange={(e) => {
                                    const sp = new URLSearchParams(location.search)
                                    if (e.target.value === "all") {
                                        sp.delete("week")
                                    } else {
                                        sp.set("week", e.target.value)
                                    }
                                    const nextSearch = sp.toString()
                                    navigate(
                                        { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : "" },
                                        { replace: true }
                                    )
                                }}
                                sx={{ minWidth: 160 }}
                            >
                                <MenuItem value="all">Todas</MenuItem>
                                {weekOptions.map((week) => (
                                    <MenuItem key={week} value={String(week)}>
                                        Semana {week}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Button
                                variant="outlined"
                                size="small"
                                color="error"
                                startIcon={<PictureAsPdfRoundedIcon />}
                                onClick={() => window.print()}
                                disabled={!traj.data}
                            >
                                PDF
                            </Button>

                            <Button
                                component={RouterLink}
                                to={returnTo}
                                variant="outlined"
                                size="small"
                                startIcon={<ArrowBackRoundedIcon />}
                            >
                                Volver
                            </Button>
                        </Stack>
                    </Stack>


                    {!canLoad && (
                        <Alert severity="error">
                            Parámetros inválidos para cargar la trayectoria.
                        </Alert>
                    )}

                    {canLoad && traj.loading && (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {canLoad && traj.error && (
                        <Alert severity="error">{traj.error}</Alert>
                    )}

                    {canLoad && !traj.loading && !traj.error && (
                        <TrajectoryPanel data={traj.data} courseId={courseId} selectedWeek={selectedWeek} />
                    )}
                </Stack>
            </Container>

            {/* Componente solo visible al imprimir */}
            {traj.data && (
                <PrintStudentReport
                    studentName={studentDisplayName}
                    courseId={courseId}
                    data={traj.data}
                    notes={studentNotes.data}
                />
            )}
        </AppShell>
    )
}