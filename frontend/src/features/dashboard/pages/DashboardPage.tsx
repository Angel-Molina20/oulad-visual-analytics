import { useEffect, useState } from "react"
import {
    Alert,
    Box,
    CircularProgress,
    Container,
    Paper,
    Stack,
    Typography,
} from "@mui/material"
import AppShell from "../components/layout/AppShell"
import ProfilesPanel from "../components/ProfilesPanel"
import AlertsPanel from "../components/AlertsPanel"
import SummaryRow from "../components/SummaryRow"
import { useCourses } from "../hooks/useCourses"
import { useProfiles } from "../hooks/useProfiles"
import { useAlerts } from "../hooks/useAlerts"
import FiltersBar from "../components/FiltersBar"

export default function DashboardPage() {
    const { courses, loading: loadingCourses, error: errorCourses } = useCourses()
    const [courseId, setCourseId] = useState("")
    const [weekId, setWeekId] = useState(1)

    useEffect(() => {
        if (!courseId && courses.length) setCourseId(courses[0])
    }, [courses, courseId])

    const profiles = useProfiles(courseId)
    const alerts = useAlerts(courseId, weekId, 50)

    const error = errorCourses || profiles.error || alerts.error
    const loading = loadingCourses || profiles.loading || alerts.loading

    return (
        <AppShell>
            <Container
                maxWidth={false}
                disableGutters
                sx={{
                    width: "100%",
                }}
            >
                <Stack spacing={2.5}>
                    <SummaryRow profiles={profiles.data} alerts={alerts.data} />

                    <FiltersBar
                        courses={courses}
                        courseId={courseId}
                        onCourseId={setCourseId}
                        weekId={weekId}
                        onWeekId={setWeekId}
                        maxWeek={20}
                    />

                    {loading && (
                        <Paper sx={{ p: 2 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <CircularProgress size={18} />
                                <Typography>Cargando datos del dashboard...</Typography>
                            </Stack>
                        </Paper>
                    )}

                    {error && <Alert severity="error">{error}</Alert>}

                    <ProfilesPanel data={profiles.data} />
                    <AlertsPanel data={alerts.data} courseId={courseId} />
                </Stack>
            </Container>
        </AppShell>
    )
}