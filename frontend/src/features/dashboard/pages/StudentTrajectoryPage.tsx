import { useMemo } from "react"
import { Link as RouterLink, useParams } from "react-router-dom"
import {
    Alert,
    Box,
    Breadcrumbs,
    Button,
    CircularProgress,
    Container,
    Stack,
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
                                to="/"
                                sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.75,
                                    textDecoration: "none",
                                    color: "text.secondary",
                                }}
                            >
                                <HomeRoundedIcon fontSize="small" />
                                <span>Dashboard</span>
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
                                    Curso {courseId}, estudiante {numericUserId}
                                </Typography>
                            </Box>

                            <Button
                                component={RouterLink}
                                to="/"
                                variant="outlined"
                                startIcon={<ArrowBackRoundedIcon />}
                            >
                                Volver al dashboard
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
                        <TrajectoryPanel data={traj.data} />
                    )}
                </Stack>
            </Container>
        </AppShell>
    )
}