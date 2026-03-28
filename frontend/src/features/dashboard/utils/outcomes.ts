export const OUTCOME_ORDER = ["Pass", "Distinction", "Fail", "Withdrawn"] as const

export type OutcomeKey = (typeof OUTCOME_ORDER)[number]

export const OUTCOME_LABELS: Record<OutcomeKey, string> = {
    Pass: "Aprobado",
    Distinction: "Distincion",
    Fail: "Reprobado",
    Withdrawn: "Retirado",
}

export function outcomeLabel(value?: string | null) {
    if (!value) return "-"
    return OUTCOME_LABELS[value as OutcomeKey] ?? value
}

