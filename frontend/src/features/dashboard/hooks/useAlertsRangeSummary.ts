import { useEffect, useMemo, useState } from "react"
import { apiGet } from "../../../api/client"
import type { AlertRow, AlertsResponse } from "../../../types/api"

type WeekSummary = {
    week: number
    clicksSum: number
    eventsSum: number
    resourcesAvg: number
    topAlert: AlertRow | null
}

type AlertsRangeSummary = {
    rangeMin: number
    rangeMax: number
    weeks: number[]
    weekSummaries: WeekSummary[]
    totals: {
        clicksSum: number
        eventsSum: number
        resourcesAvgPerWeek: number
        avgClicksPerWeek: number
    }
    lastWeek: WeekSummary | null
}

function buildWeekSummary(week: number, alerts: AlertRow[]) {
    if (!alerts.length) {
        return {
            week,
            clicksSum: 0,
            eventsSum: 0,
            resourcesAvg: 0,
            topAlert: null,
        }
    }

    const clicksSum = alerts.reduce((acc, item) => acc + item.clicks_total, 0)
    const eventsSum = alerts.reduce((acc, item) => acc + item.events_count, 0)
    const resourcesAvg = alerts.reduce((acc, item) => acc + item.resources_touched, 0) / alerts.length

    const topAlert = [...alerts].sort((a, b) => b.risk_score - a.risk_score)[0] ?? null

    return {
        week,
        clicksSum,
        eventsSum,
        resourcesAvg,
        topAlert,
    }
}

export function useAlertsRangeSummary(
    courseId: string,
    weekMin: number | null,
    weekMax: number | null,
    top = 50
) {
    const [data, setData] = useState<AlertsRangeSummary | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const normalized = useMemo(() => {
        if (!courseId || weekMin === null || weekMax === null) return null
        const min = Math.min(weekMin, weekMax)
        const max = Math.max(weekMin, weekMax)
        const weeks = Array.from({ length: max - min + 1 }, (_, i) => min + i)
        return { min, max, weeks }
    }, [courseId, weekMin, weekMax])

    useEffect(() => {
        if (!normalized) return
        setLoading(true)
        setError("")
        const { min, max, weeks } = normalized

        Promise.all(
            weeks.map((week) =>
                apiGet<AlertsResponse>(
                    `/analytics/courses/${encodeURIComponent(courseId)}/alerts?week_id=${week}&top=${top}`
                ).then((response) => ({ week, alerts: response.alerts }))
            )
        )
            .then((entries) => {
                const weekSummaries = entries
                    .map((entry) => buildWeekSummary(entry.week, entry.alerts))
                    .sort((a, b) => a.week - b.week)

                const clicksSum = weekSummaries.reduce((acc, item) => acc + item.clicksSum, 0)
                const eventsSum = weekSummaries.reduce((acc, item) => acc + item.eventsSum, 0)
                const resourcesAvgPerWeek =
                    weekSummaries.reduce((acc, item) => acc + item.resourcesAvg, 0) / weekSummaries.length
                const avgClicksPerWeek =
                    weekSummaries.reduce((acc, item) => acc + item.clicksSum, 0) / weekSummaries.length

                const lastWeek = weekSummaries[weekSummaries.length - 1] ?? null

                setData({
                    rangeMin: min,
                    rangeMax: max,
                    weeks,
                    weekSummaries,
                    totals: {
                        clicksSum,
                        eventsSum,
                        resourcesAvgPerWeek,
                        avgClicksPerWeek,
                    },
                    lastWeek,
                })
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false))
    }, [normalized, courseId, top])

    return { data, loading, error }
}

