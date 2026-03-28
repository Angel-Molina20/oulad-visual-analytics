import type {
    AlertsResponse,
    ProfilesResponse,
    TrajectoryResponse,
} from "../../../types/api"
import { outcomeLabel } from "./outcomes"

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
    const withdrawnCount = totals["Withdrawn"] ?? 0
    const withdrawnRate =
        totalStudents > 0 ? (withdrawnCount / totalStudents) * 100 : 0

    const withdrawalLabel = outcomeLabel("Withdrawn")
    const withdrawnDesc = `${withdrawalLabel} representa estudiantes que abandonaron el curso.`
    const rateText = `${withdrawnRate.toFixed(1)}% (${withdrawnCount} de ${totalStudents})`

    if (withdrawnRate >= 20) {
        return `El curso está dominado por el cluster C${dominantCluster.cluster}. La tasa de ${withdrawalLabel} es ${rateText}, lo que indica un nivel alto de abandono. ${withdrawnDesc} Se recomienda priorizar perfiles con señales tempranas de desconexión.`
    }

    return `El curso está dominado por el cluster C${dominantCluster.cluster}. La tasa de ${withdrawalLabel} es ${rateText}, lo que sugiere un comportamiento relativamente estable. ${withdrawnDesc}`
}

export function getAlertsConclusion(data: AlertsResponse | null): string {
    if (!data || !data.alerts?.length) {
        return "No hay alertas visibles para generar una conclusión."
    }

    const alerts = data.alerts
    const highRiskCount = alerts.filter((a) => a.risk_score >= 0.75).length
    const top = alerts[0]
    const totalAlerts = alerts.length
    const highRiskRate = (highRiskCount / Math.max(totalAlerts, 1)) * 100

    const riskText = `${highRiskRate.toFixed(1)}% (${highRiskCount} de ${totalAlerts})`

    if (highRiskRate >= 40) {
        return `La semana ${data.week_id} tiene una concentración alta de casos de riesgo: ${riskText}. Este porcentaje indica que una parte relevante de los estudiantes priorizados presenta señales fuertes de abandono o bajo rendimiento. El estudiante ${top.user_id} es la prioridad inmediata de revisión.`
    }

    return `La semana ${data.week_id} presenta alertas activas con una concentración moderada de riesgo: ${riskText}. Esto sugiere que hay señales de alerta, pero no generalizadas. El estudiante ${top.user_id} sigue siendo el primer caso a revisar.`
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

    const changeText = `${Math.abs(change).toFixed(1)}%`

    if (change <= -30) {
        return `La actividad cae ${changeText} entre la primera y la última semana. Este porcentaje representa la reducción relativa de interacción y sugiere riesgo de desenganche sostenido.`
    }

    if (change >= 30) {
        return `La actividad aumenta ${changeText} entre la primera y la última semana. Este porcentaje refleja una mejora relativa de interacción y sugiere mayor involucramiento con el curso.`
    }

    return "La trayectoria se mantiene estable: la variación relativa de actividad entre el inicio y el final es pequeña, por lo que no se observan cambios extremos en el compromiso del estudiante."
}