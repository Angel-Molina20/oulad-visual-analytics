import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useCourses } from "../hooks/useCourses"
import { useWeeks } from "../hooks/useWeeks"

type DashboardFiltersContextValue = {
    courses: string[]
    coursesLoading: boolean
    coursesError: string
    courseId: string
    setCourseId: (value: string) => void
    weekMode: "week" | "range"
    setWeekMode: (value: "week" | "range") => void
    weekMin: number | null
    weekMax: number | null
    setWeekMin: (value: number | null) => void
    setWeekMax: (value: number | null) => void
    selectedWeek: number | null
    weeks: number[]
    minWeekAvailable: number | null
    maxWeekAvailable: number | null
    weeksLoading: boolean
    weeksError: string
    selectedCluster: number | null
    setSelectedCluster: (value: number | null) => void
    selectedStudentId: number | null
    setSelectedStudentId: (value: number | null) => void
}

const DashboardFiltersContext = createContext<DashboardFiltersContextValue | undefined>(undefined)

export function DashboardFiltersProvider({ children }: { children: React.ReactNode }) {
    const { courses, loading: coursesLoading, error: coursesError } = useCourses()
    const [courseId, setCourseId] = useState("")
    const [weekMin, setWeekMinState] = useState<number | null>(null)
    const [weekMax, setWeekMaxState] = useState<number | null>(null)
    const [lastWeekEdited, setLastWeekEdited] = useState<"min" | "max" | null>(null)
    const [weekMode, setWeekModeState] = useState<"week" | "range">("week")
    const [selectedCluster, setSelectedCluster] = useState<number | null>(null)
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)

    useEffect(() => {
        if (!courseId && courses.length) setCourseId(courses[0])
    }, [courses, courseId])

    useEffect(() => {
        setWeekMinState(null)
        setWeekMaxState(null)
        setLastWeekEdited(null)
        setWeekModeState("week")
        setSelectedCluster(null)
        setSelectedStudentId(null)
    }, [courseId])

    const weeksResponse = useWeeks(courseId)
    const weeks = weeksResponse.data?.weeks ?? []
    const minWeekAvailable = weeksResponse.data?.week_min ?? null
    const maxWeekAvailable = weeksResponse.data?.week_max ?? null

    useEffect(() => {
        if (minWeekAvailable === null || maxWeekAvailable === null) return
        setWeekMinState((prev) => {
            if (prev === null || prev < minWeekAvailable || prev > maxWeekAvailable) return minWeekAvailable
            return prev
        })
        setWeekMaxState((prev) => {
            if (prev === null || prev > maxWeekAvailable || prev < minWeekAvailable) return maxWeekAvailable
            return prev
        })
    }, [minWeekAvailable, maxWeekAvailable])

    const selectedWeek = useMemo(() => {
        if (lastWeekEdited === "min" && weekMin !== null) return weekMin
        if (lastWeekEdited === "max" && weekMax !== null) return weekMax
        if (weekMax !== null) return weekMax
        if (weekMin !== null) return weekMin
        return minWeekAvailable ?? null
    }, [lastWeekEdited, weekMin, weekMax, minWeekAvailable])

    const setWeekMode = (value: "week" | "range") => {
        setWeekModeState(value)
        if (value === "week") {
            const nextWeek = selectedWeek ?? minWeekAvailable ?? null
            if (nextWeek !== null) {
                setWeekMinState(nextWeek)
                setWeekMaxState(nextWeek)
            }
            setLastWeekEdited("max")
        }
    }

    const setWeekMin = (value: number | null) => {
        setLastWeekEdited("min")
        if (value === null) {
            setWeekMinState(null)
            return
        }
        setWeekMinState(value)
        if (weekMode === "week") {
            setWeekMaxState(value)
            return
        }
        setWeekMaxState((prev) => {
            if (prev === null) return prev
            return value > prev ? value : prev
        })
    }

    const setWeekMax = (value: number | null) => {
        setLastWeekEdited("max")
        if (value === null) {
            setWeekMaxState(null)
            return
        }
        setWeekMaxState(value)
        if (weekMode === "week") {
            setWeekMinState(value)
            return
        }
        setWeekMinState((prev) => {
            if (prev === null) return prev
            return value < prev ? value : prev
        })
    }

    const value = useMemo(
        () => ({
            courses,
            coursesLoading,
            coursesError,
            courseId,
            setCourseId,
            weekMode,
            setWeekMode,
            weekMin,
            weekMax,
            setWeekMin,
            setWeekMax,
            selectedWeek,
            weeks,
            minWeekAvailable,
            maxWeekAvailable,
            weeksLoading: weeksResponse.loading,
            weeksError: weeksResponse.error,
            selectedCluster,
            setSelectedCluster,
            selectedStudentId,
            setSelectedStudentId,
        }),
        [
            courses,
            coursesLoading,
            coursesError,
            courseId,
            weekMode,
            weekMin,
            weekMax,
            selectedWeek,
            weeks,
            minWeekAvailable,
            maxWeekAvailable,
            weeksResponse.loading,
            weeksResponse.error,
            selectedCluster,
            selectedStudentId,
        ]
    )

    return (
        <DashboardFiltersContext.Provider value={value}>
            {children}
        </DashboardFiltersContext.Provider>
    )
}

export function useDashboardFilters() {
    const ctx = useContext(DashboardFiltersContext)
    if (!ctx) {
        throw new Error("useDashboardFilters must be used within DashboardFiltersProvider")
    }
    return ctx
}
