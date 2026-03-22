import { useEffect, useState } from "react"
import { ENV} from "../../../config/env";
import {
    Alert,
    Container,
    Stack,
} from "@mui/material"
import AppShell from "../components/layout/AppShell"
import ProfilesPanel from "../components/ProfilesPanel"
import AlertsPanel from "../components/AlertsPanel"
import SummaryRow from "../components/SummaryRow"
import { useCourses } from "../hooks/useCourses"
import { useProfiles } from "../hooks/useProfiles"
import ClusterCards from "../components/ClusterCards"
import { useClusterLabels } from "../hooks/useClusterLabels"
import { useAlerts } from "../hooks/useAlerts"
import { loadClusterMeta } from "../utils/clusterMeta"
import { useClusterOutcomes} from "../hooks/useClusterOutcomes";
import FiltersBar from "../components/FiltersBar"

export default function DashboardPage() {
    const { courses, loading: loadingCourses, error: errorCourses } = useCourses()
    const [courseId, setCourseId] = useState("")
    const [weekId, setWeekId] = useState(1)

    useEffect(() => {
        if (!courseId && courses.length) setCourseId(courses[0])
    }, [courses, courseId])

    useEffect(() => {
        loadClusterMeta(ENV.API_URL)
    }, [])

    const profiles = useProfiles(courseId)
    const alerts = useAlerts(courseId, weekId, 50)
    const clusterOut = useClusterOutcomes(courseId)
    const labels = useClusterLabels()

    const error = errorCourses || profiles.error || alerts.error || clusterOut.error
    const loading = loadingCourses || profiles.loading || alerts.loading || clusterOut.loading

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

                    {error && <Alert severity="error">{error}</Alert>}

                    <ClusterCards clusters={labels.data} />
                    <ProfilesPanel data={profiles.data} clusterOutcomes={clusterOut.data} />
                    <AlertsPanel data={alerts.data} courseId={courseId} />
                </Stack>
            </Container>
        </AppShell>
    )
}