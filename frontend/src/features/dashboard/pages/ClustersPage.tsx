import { useEffect, useState } from "react"
import { ENV } from "../../../config/env"
import { Alert, Chip, Container, Grid, Stack, Typography } from "@mui/material"
import AppShell from "../components/layout/AppShell"
import ClusterCards from "../components/ClusterCards"
import CohortsPanel from "../components/CohortsPanel"
import ProfilesPanel from "../components/ProfilesPanel"
import FiltersBar from "../components/FiltersBar"
import { useProfiles } from "../hooks/useProfiles"
import { useClusterLabels } from "../hooks/useClusterLabels"
import { useClusterOutcomes } from "../hooks/useClusterOutcomes"
import { useCohorts } from "../hooks/useCohorts"
import { loadClusterMeta } from "../utils/clusterMeta"
import { useDashboardFilters } from "../context/DashboardFiltersContext"

export default function ClustersPage() {
    const {
        courses,
        coursesError,
        courseId,
        setCourseId,
        weekMode,
        setWeekMode,
        weeks,
        weekMin,
        weekMax,
        setWeekMin,
        setWeekMax,
        minWeekAvailable,
        maxWeekAvailable,
        selectedCluster,
        setSelectedCluster,
        selectedWeek,
    } = useDashboardFilters()
    const [cohortMetric, setCohortMetric] = useState("clicks_total")

    useEffect(() => {
        loadClusterMeta(ENV.API_URL)
    }, [])

    const profiles = useProfiles(courseId)
    const labels = useClusterLabels(courseId)
    const clusterOut = useClusterOutcomes(courseId)
    const baseWeekMin = weekMin ?? minWeekAvailable
    const baseWeekMax = weekMax ?? maxWeekAvailable
    const effectiveWeek = selectedWeek ?? baseWeekMax ?? baseWeekMin ?? null
    const resolvedWeekMin = weekMode === "week" ? effectiveWeek : weekMin
    const resolvedWeekMax = weekMode === "week" ? effectiveWeek : weekMax
    const cohorts = useCohorts(courseId, cohortMetric, resolvedWeekMin, resolvedWeekMax)

    const error = coursesError || profiles.error || labels.error || clusterOut.error || cohorts.error

    const handleApplyRange = (min: number | null, max: number | null) => {
        if (min !== null && max !== null && min > max) {
            setWeekMin(max)
            setWeekMax(min)
            return
        }
        setWeekMin(min)
        setWeekMax(max)
    }

    return (
        <AppShell>
            <Container maxWidth={false} disableGutters sx={{ width: "100%" }}>
                <Stack spacing={2.5}>
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
                        onCourseChange={setCourseId}
                        weekMode={weekMode}
                        onWeekModeChange={setWeekMode}
                        weeks={weeks}
                        weekMin={weekMin}
                        weekMax={weekMax}
                        minWeekAvailable={minWeekAvailable}
                        maxWeekAvailable={maxWeekAvailable}
                        onWeekMinChange={setWeekMin}
                        onWeekMaxChange={setWeekMax}
                    />

                    {error && <Alert severity="error">{error}</Alert>}

                    <ClusterCards
                        clusters={labels.data}
                        selectedCluster={selectedCluster}
                        onSelectCluster={setSelectedCluster}
                    />

                    <Grid container spacing={2.5} alignItems="flex-start">
                        <Grid item xs={12} lg={6}>
                            <CohortsPanel
                                data={cohorts.data}
                                metric={cohortMetric}
                                onMetric={setCohortMetric}
                                weekMin={weekMin}
                                weekMax={weekMax}
                                onApplyRange={handleApplyRange}
                                selectedCluster={selectedCluster}
                            />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                            <ProfilesPanel
                                data={profiles.data}
                                clusterOutcomes={clusterOut.data}
                                selectedCluster={selectedCluster}
                            />
                        </Grid>
                    </Grid>
                </Stack>
            </Container>
        </AppShell>
    )
}
