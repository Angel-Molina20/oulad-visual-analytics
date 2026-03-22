import type {
    AlertsResponse,
    ProfilesResponse,
    TrajectoryResponse,
} from "../../../types/api"

export function getProfilesInsights(data: ProfilesResponse | null): string[] {
    if (!data) return []

    const profiles = data.profiles ?? []
    const outcomes = data.outcomes ?? []

    if (!profiles.length || !outcomes.length) return []

    const dominantCluster = profiles.reduce((best, item) =>
        item.students > best.students ? item : best
    )

    const outcomeTotals = outcomes.reduce<Record<string, number>>((acc, item) => {
        const key = item.final_result || "Unknown"
        acc[key] = (acc[key] || 0) + item.students
        return acc
    }, {})

    const sortedOutcomes = Object.entries(outcomeTotals).sort((a, b) => b[1] - a[1])
    const dominantOutcome = sortedOutcomes[0]?.[0] ?? "-"
    const dominantOutcomeCount = sortedOutcomes[0]?.[1] ?? 0

    const withdrawnCount = outcomeTotals["Withdrawn"] ?? 0
    const totalStudents = Object.values(outcomeTotals).reduce((acc, val) => acc + val, 0)
    const withdrawnRate = totalStudents > 0 ? (withdrawnCount / totalStudents) * 100 : 0

    const failCount = outcomeTotals["Fail"] ?? 0

    const insights: string[] = []

    insights.push(
        `El cluster C${dominantCluster.cluster} concentra la mayor cantidad de estudiantes, con ${dominantCluster.students} casos.`
    )

    insights.push(
        `El resultado final predominante del curso es ${dominantOutcome}, con ${dominantOutcomeCount} estudiantes.`
    )

    if (withdrawnRate >= 20) {
        insights.push(
            `La tasa de retiro es ${withdrawnRate.toFixed(1)}%, lo que sugiere un nivel de abandono que merece seguimiento.`
        )
    } else {
        insights.push(
            `La tasa de retiro es ${withdrawnRate.toFixed(1)}%, un valor relativamente contenido para el curso.`
        )
    }

    if (failCount > 0) {
        insights.push(
            `Además del retiro, hay ${failCount} estudiantes en Fail, por lo que conviene revisar tanto abandono como bajo rendimiento.`
        )
    }

    return insights
}

export function getAlertsInsights(data: AlertsResponse | null): string[] {
    if (!data || !data.alerts?.length) return []

    const alerts = data.alerts
    const top = alerts[0]

    const avgRisk =
        alerts.reduce((acc, item) => acc + item.risk_score, 0) / alerts.length

    const withdrawnCount = alerts.filter((a) => a.final_result === "Withdrawn").length
    const passCount = alerts.filter((a) => a.final_result === "Pass").length

    const insights: string[] = []

    insights.push(
        `La semana ${data.week_id} muestra ${alerts.length} estudiantes priorizados para revisión.`
    )

    insights.push(
        `El caso más crítico visible es el estudiante ${top.user_id}, con riesgo ${top.risk_score.toFixed(2)}.`
    )

    insights.push(
        `El riesgo promedio del grupo priorizado es ${avgRisk.toFixed(2)}.`
    )

    if (withdrawnCount > passCount) {
        insights.push(
            `Dentro del grupo de alertas predominan más casos Withdrawn que Pass, lo que refuerza la necesidad de intervención temprana.`
        )
    } else {
        insights.push(
            `Aunque hay estudiantes con buen resultado final, el grupo priorizado sigue mostrando señales de riesgo que no conviene ignorar.`
        )
    }

    return insights
}

export function getTrajectoryInsights(data: TrajectoryResponse | null): string[] {
    if (!data || !data.trajectory?.length) return []

    const trajectory = data.trajectory
    const clicks = trajectory.map((t) => t.clicks_total)
    const resources = trajectory.map((t) => t.resources_touched)

    const peakClicks = Math.max(...clicks)
    const peakWeek = trajectory.find((t) => t.clicks_total === peakClicks)?.week_id ?? "-"

    const minClicks = Math.min(...clicks)
    const minWeek = trajectory.find((t) => t.clicks_total === minClicks)?.week_id ?? "-"

    const firstClicks = clicks[0] ?? 0
    const lastClicks = clicks[clicks.length - 1] ?? 0
    const clickChange =
        firstClicks > 0 ? ((lastClicks - firstClicks) / firstClicks) * 100 : 0

    const avgResources =
        resources.reduce((acc, val) => acc + val, 0) / Math.max(resources.length, 1)

    const insights: string[] = []

    insights.push(
        `El mayor nivel de actividad ocurrió en la semana ${peakWeek}, con ${peakClicks} clicks.`
    )

    insights.push(
        `La menor actividad se observó en la semana ${minWeek}, con ${minClicks} clicks.`
    )

    if (clickChange <= -30) {
        insights.push(
            `La actividad cayó ${Math.abs(clickChange).toFixed(1)}% entre la primera y la última semana, señal de pérdida sostenida de interacción.`
        )
    } else if (clickChange >= 30) {
        insights.push(
            `La actividad aumentó ${clickChange.toFixed(1)}% entre la primera y la última semana, señal de mayor involucramiento con el curso.`
        )
    } else {
        insights.push(
            `La actividad se mantuvo relativamente estable entre el inicio y el cierre de la trayectoria.`
        )
    }

    insights.push(
        `En promedio, el estudiante tocó ${avgResources.toFixed(1)} recursos por semana.`
    )

    return insights
}