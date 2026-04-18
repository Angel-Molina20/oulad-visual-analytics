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

import AppShell from "../components/layout/AppShell"
import TrajectoryPanel from "../components/TrajectoryPanel"
import { useTrajectory } from "../hooks/useTrajectory"

export default function StudentTrajectoryPage() {
    const { courseId = "", userId = "" } = useParams()

    const numericUserId = useMemo(() => Number(userId), [userId])
    const isValidUserId = Number.isFinite(numericUserId) && numericUserId > 0
    const canLoad = Boolean(courseId) && isValidUserId

    const traj = useTrajectory(courseId, canLoad ? numericUserId : 0)

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
                    <Stack spacing={2}>
                        <Breadcrumbs>
                            <Box
                                component={RouterLink}
                                to={returnTo}
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    textDecoration: "none",
                                    color: "text.secondary",
                                }}
                            >
                                <HomeRoundedIcon fontSize="small" />
                                <span>{returnLabel}</span>
                            </Box>

                            <Box
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    color: "text.primary",
                                }}
                            >
                                <TimelineRoundedIcon fontSize="small" />
                                <span>Trayectoria</span>
                            </Box>
                        </Breadcrumbs>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                        >
                            <Box>
                                <Typography variant="h4">Trayectoria del estudiante</Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Curso {courseId} · {studentDisplayName}
                                </Typography>
                                {summary && (
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={1}
                                        alignItems={{ xs: "flex-start", sm: "center" }}
                                        sx={{ mt: 1 }}
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            Semanas registradas: {summary.totalWeeks}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Rango: {summary.firstWeek}–{summary.lastWeek}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Última semana: {summary.lastWeek} · Clicks: {summary.lastClicks}
                                        </Typography>
                                    </Stack>
                                )}
                            </Box>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
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
                                            {
                                                pathname: location.pathname,
                                                search: nextSearch ? `?${nextSearch}` : "",
                                            },
                                            { replace: true }
                                        )
                                    }}
                                    sx={{ minWidth: 180 }}
                                >
                                    <MenuItem value="all">Todas</MenuItem>
                                    {weekOptions.map((week) => (
                                        <MenuItem key={week} value={String(week)}>
                                            Semana {week}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                <Button
                                    component={RouterLink}
                                    to={returnTo}
                                    variant="outlined"
                                    startIcon={<ArrowBackRoundedIcon />}
                                >
                                    Volver a {returnLabel}
                                </Button>
                            </Stack>
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
        </AppShell>
    )
}