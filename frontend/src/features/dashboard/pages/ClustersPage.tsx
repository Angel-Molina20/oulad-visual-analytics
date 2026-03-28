import { useEffect, useState } from "react"
import { ENV } from "../../../config/env"
import { Alert, Chip, Container, Stack, Typography } from "@mui/material"
import AppShell from "../components/layout/AppShell"
import ClusterCards from "../components/ClusterCards"
import CohortsPanel from "../components/CohortsPanel"
import ProfilesPanel from "../components/ProfilesPanel"
import FiltersBar from "../components/FiltersBar"
import { useCourses } from "../hooks/useCourses"
import { useProfiles } from "../hooks/useProfiles"
import { useClusterLabels } from "../hooks/useClusterLabels"
import { useClusterOutcomes } from "../hooks/useClusterOutcomes"
import { useCohorts } from "../hooks/useCohorts"
import { loadClusterMeta } from "../utils/clusterMeta"

export default function ClustersPage() {
    const { courses, error: errorCourses } = useCourses()
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
    const labels = useClusterLabels(courseId)
    const clusterOut = useClusterOutcomes(courseId)
    const cohorts = useCohorts(courseId, cohortMetric, weekMin, weekMax)

    const error = errorCourses || profiles.error || labels.error || clusterOut.error || cohorts.error

    return (
        <AppShell>
            <Container maxWidth={false} disableGutters sx={{ width: "100%" }}>
                <Stack spacing={2.5}>
                    <Typography variant="h6">Analisis de clusters</Typography>

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
                            // normaliza si estan invertidos
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
                </Stack>
            </Container>
        </AppShell>
    )
}
