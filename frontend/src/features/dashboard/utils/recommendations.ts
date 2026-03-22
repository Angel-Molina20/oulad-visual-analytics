import type {
    AlertsResponse,
    ProfilesResponse,
    TrajectoryResponse,
} from "../../../types/api"

export function getProfilesRecommendations(data: ProfilesResponse | null): string[] {
    if (!data) return []

    const outcomes = data.outcomes ?? []
    if (!outcomes.length) return []

    const totals = outcomes.reduce<Record<string, number>>((acc, item) => {
        const key = item.final_result || "Unknown"
        acc[key] = (acc[key] || 0) + item.students
        return acc
    }, {})

    const totalStudents = Object.values(totals).reduce((acc, val) => acc + val, 0)
    const withdrawnRate =
        totalStudents > 0 ? ((totals["Withdrawn"] ?? 0) / totalStudents) * 100 : 0
    const failRate =
        totalStudents > 0 ? ((totals["Fail"] ?? 0) / totalStudents) * 100 : 0

    const recommendations: string[] = []

    if (withdrawnRate >= 20) {
        recommendations.push(
            "Prioriza seguimiento temprano en cursos o perfiles donde Withdrawn tenga peso alto."
        )
    }

    if (failRate >= 10) {
        recommendations.push(
            "Revisa actividades y evaluaciones en los perfiles con más casos de Fail."
        )
    }

    recommendations.push(
        "Usa el cruce entre cluster y resultado final para detectar qué perfil necesita intervención docente."
    )

    return recommendations
}

export function getAlertsRecommendations(data: AlertsResponse | null): string[] {
    if (!data || !data.alerts?.length) return []

    const alerts = data.alerts
    const highRisk = alerts.filter((a) => a.risk_score >= 0.75)
    const withdrawn = alerts.filter((a) => a.final_result === "Withdrawn")
    const lowResources = alerts.filter((a) => a.resources_touched <= 20)

    const recommendations: string[] = []

    if (highRisk.length > 0) {
        recommendations.push(
            "Empieza la revisión por los estudiantes con riesgo alto y abre primero su trayectoria."
        )
    }

    if (withdrawn.length > 0) {
        recommendations.push(
            "Compara los casos Withdrawn con su nivel de actividad para buscar señales tempranas de abandono."
        )
    }

    if (lowResources.length >= Math.ceil(alerts.length * 0.4)) {
        recommendations.push(
            "Muchos casos visibles tocan pocos recursos. Revisa acceso, secuencia de contenido o participación real."
        )
    }

    recommendations.push(
        "Usa los filtros de riesgo, cluster y estudiante para reducir la lista a los casos más urgentes."
    )

    return recommendations
}

export function getTrajectoryRecommendations(data: TrajectoryResponse | null): string[] {
    if (!data || !data.trajectory?.length) return []

    const trajectory = data.trajectory
    const clicks = trajectory.map((t) => t.clicks_total)
    const resources = trajectory.map((t) => t.resources_touched)

    const firstClicks = clicks[0] ?? 0
    const lastClicks = clicks[clicks.length - 1] ?? 0
    const clickChange =
        firstClicks > 0 ? ((lastClicks - firstClicks) / firstClicks) * 100 : 0

    const avgResources =
        resources.reduce((acc, val) => acc + val, 0) / Math.max(resources.length, 1)

    const recommendations: string[] = []

    if (clickChange <= -30) {
        recommendations.push(
            "Hay una caída fuerte de actividad. Revisa desde qué semana empieza y qué recurso o evento cambia."
        )
    }

    if (avgResources < 15) {
        recommendations.push(
            "El uso de recursos es bajo. Conviene revisar si el estudiante explora poco material del curso."
        )
    }

    recommendations.push(
        "Contrasta los picos y caídas de actividad con semanas de evaluación o cambios de cluster."
    )

    recommendations.push(
        "Si el riesgo es alto o el resultado final fue negativo, usa esta serie para detectar el punto de quiebre."
    )

    return recommendations
}