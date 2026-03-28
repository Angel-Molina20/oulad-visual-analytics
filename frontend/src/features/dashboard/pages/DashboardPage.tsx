import { useEffect, useState } from "react"
import { ENV} from "../../../config/env";
import {
    Alert, Chip,
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
import CohortsPanel from "../components/CohortsPanel";
import { useCohorts } from "../hooks/useCohorts";
import FiltersBar from "../components/FiltersBar"

export default function DashboardPage() {
    const { courses, loading: loadingCourses, error: errorCourses } = useCourses()
    const [courseId, setCourseId] = useState("")
    const [weekId, setWeekId] = useState(0)
    const [cohortMetric, setCohortMetric] = useState("clicks_total")
    const [weekMin, setWeekMin] = useState<number | null>(0)
    const [weekMax, setWeekMax] = useState<number | null>(10)
    const [selectedCluster, setSelectedCluster] = useState<number | null>(null)

    useEffect(() => {
        if (!courseId && courses.length) setCourseId(courses[0])
    }, [courses, courseId])

    useEffect(() => {
        loadClusterMeta(ENV.API_URL)
    }, [])

    const profiles = useProfiles(courseId)
    const alerts = useAlerts(courseId, weekId, 50)
    const clusterOut = useClusterOutcomes(courseId)
    const labels = useClusterLabels(courseId)
    const cohorts = useCohorts(courseId, cohortMetric, weekMin, weekMax)

    const error = errorCourses || profiles.error || alerts.error || clusterOut.error || cohorts.error
    const loading = loadingCourses || profiles.loading || alerts.loading || clusterOut.loading || cohorts.loading

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
                    {selectedCluster !== null && (
                        <Chip
                            color={"primary"}
                            label={`Filtro activo: C${selectedCluster}`}
                            onDelete={() => setSelectedCluster(null)}
                        />
                    )}

                    <FiltersBar
                        courses={courses}
                        courseId={courseId}
                        onCourseId={setCourseId}
                        weekId={weekId}
                        onWeekId={setWeekId}
                        maxWeek={40}
                    />

                    {error && <Alert severity="error">{error}</Alert>}

                    <ClusterCards
                        clusters={labels.data}
                        selectedCluster={selectedCluster}
                        onSelectCluster={setSelectedCluster}
                    />
                    <CohortsPanel
                        data={cohorts.data}
                        metric={cohortMetric}
                        onMetric={setCohortMetric}
                        weekMin={weekMin}
                        weekMax={weekMax}
                        onApplyRange={(min, max) => {
                            // normaliza si están invertidos
                            if (min !== null && max !== null && min > max) {
                                setWeekMin(max)
                                setWeekMax(min)
                                return
                            }
                            setWeekMin(min)
                            setWeekMax(max)
                        }}
                        selectedCluster={selectedCluster}
                    />
                    <ProfilesPanel
                        data={profiles.data}
                        clusterOutcomes={clusterOut.data}
                        selectedCluster={selectedCluster}
                    />

                    <AlertsPanel
                        data={alerts.data}
                        courseId={courseId}
                        selectedCluster={selectedCluster}
                    />
                </Stack>
            </Container>
        </AppShell>
    )
}