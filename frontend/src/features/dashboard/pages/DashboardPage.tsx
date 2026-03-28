import { useEffect, useState } from "react"
import {
    Alert,
    Container,
    Stack,
} from "@mui/material"
import AppShell from "../components/layout/AppShell"
import AlertsPanel from "../components/AlertsPanel"
import SummaryRow from "../components/SummaryRow"
import { useCourses } from "../hooks/useCourses"
import { useProfiles } from "../hooks/useProfiles"
import { useAlerts } from "../hooks/useAlerts"
import FiltersBar from "../components/FiltersBar"

export default function DashboardPage() {
    const { courses, error: errorCourses } = useCourses()
    const [courseId, setCourseId] = useState("")
    const [weekId, setWeekId] = useState(0)

    useEffect(() => {
        if (!courseId && courses.length) setCourseId(courses[0])
    }, [courses, courseId])

    const profiles = useProfiles(courseId)
    const alerts = useAlerts(courseId, weekId, 50)

    const error = errorCourses || profiles.error || alerts.error

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
                        maxWeek={40}
                    />

                    {error && <Alert severity="error">{error}</Alert>}

                    <AlertsPanel
                        data={alerts.data}
                        courseId={courseId}
                        selectedCluster={null}
                    />
                </Stack>
            </Container>
        </AppShell>
    )
}