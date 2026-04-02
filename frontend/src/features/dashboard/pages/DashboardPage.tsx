import {Alert, Container, Stack,} from "@mui/material"
import AppShell from "../components/layout/AppShell"
import AlertsPanel from "../components/AlertsPanel"
import SummaryRow from "../components/SummaryRow"
import {useAlerts} from "../hooks/useAlerts"
import {useAlertsRangeSummary} from "../hooks/useAlertsRangeSummary"
import FiltersBar from "../components/FiltersBar"
import {useDashboardFilters} from "../context/DashboardFiltersContext"

export default function DashboardPage() {
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
        selectedWeek,
    } = useDashboardFilters()

    const baseWeekMin = weekMin ?? minWeekAvailable
    const baseWeekMax = weekMax ?? maxWeekAvailable
    const effectiveWeek = selectedWeek ?? baseWeekMax ?? baseWeekMin ?? 0
    const resolvedWeekMin = weekMode === "week" ? effectiveWeek : baseWeekMin
    const resolvedWeekMax = weekMode === "week" ? effectiveWeek : baseWeekMax
    const alerts = useAlerts(courseId, effectiveWeek, 50)
    const rangeSummary = useAlertsRangeSummary(courseId, resolvedWeekMin ?? null, resolvedWeekMax ?? null, 50)

    const error = coursesError || alerts.error || rangeSummary.error

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

                    <SummaryRow summary={rangeSummary.data} />

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