import type {
    AlertsResponse,
    ProfilesResponse,
    TrajectoryResponse,
} from "../../../types/api"

export function getProfilesConclusion(data: ProfilesResponse | null): string {
    if (!data) return ""

    const profiles = data.profiles ?? []
    const outcomes = data.outcomes ?? []

    if (!profiles.length || !outcomes.length) {
        return "No hay datos suficientes para generar una conclusión del curso."
    }

    const dominantCluster = profiles.reduce((best, item) =>
        item.students > best.students ? item : best
    )

    const totals = outcomes.reduce<Record<string, number>>((acc, item) => {
        const key = item.final_result || "Unknown"
        acc[key] = (acc[key] || 0) + item.students
        return acc
    }, {})

    const totalStudents = Object.values(totals).reduce((acc, val) => acc + val, 0)
    const withdrawnRate =
        totalStudents > 0 ? ((totals["Withdrawn"] ?? 0) / totalStudents) * 100 : 0

    if (withdrawnRate >= 20) {
        return `El curso está dominado por el cluster C${dominantCluster.cluster}, pero la tasa de retiro es ${withdrawnRate.toFixed(1)}%, por lo que conviene vigilar perfiles con señales de abandono.`
    }

    return `El curso está dominado por el cluster C${dominantCluster.cluster} y muestra una tasa de retiro de ${withdrawnRate.toFixed(1)}%, lo que sugiere un comportamiento relativamente estable.`
}

export function getAlertsConclusion(data: AlertsResponse | null): string {
    if (!data || !data.alerts?.length) {
        return "No hay alertas visibles para generar una conclusión."
    }

    const alerts = data.alerts
    const highRiskCount = alerts.filter((a) => a.risk_score >= 0.75).length
    const top = alerts[0]

    if (highRiskCount >= Math.ceil(alerts.length * 0.4)) {
        return `La semana ${data.week_id} concentra varios casos de riesgo alto. El estudiante ${top.user_id} aparece como prioridad inmediata de revisión.`
    }

    return `La semana ${data.week_id} presenta alertas activas, pero con una concentración moderada de riesgo. El estudiante ${top.user_id} sigue siendo el primer caso a revisar.`
}

export function getTrajectoryConclusion(data: TrajectoryResponse | null): string {
    if (!data || !data.trajectory?.length) {
        return "No hay datos suficientes para generar una conclusión de trayectoria."
    }

    const trajectory = data.trajectory
    const clicks = trajectory.map((t) => t.clicks_total)

    const firstClicks = clicks[0] ?? 0
    const lastClicks = clicks[clicks.length - 1] ?? 0
    const change = firstClicks > 0 ? ((lastClicks - firstClicks) / firstClicks) * 100 : 0

    if (change <= -30) {
        return `El estudiante muestra una caída sostenida de actividad de ${Math.abs(change).toFixed(1)}% entre el inicio y el final de la trayectoria, señal de posible desenganche.`
    }

    if (change >= 30) {
        return `El estudiante muestra una mejora de actividad de ${change.toFixed(1)}% entre el inicio y el final de la trayectoria, señal de mayor involucramiento con el curso.`
    }

    return "La trayectoria del estudiante se mantiene relativamente estable, sin cambios extremos entre el inicio y el final del curso."
}