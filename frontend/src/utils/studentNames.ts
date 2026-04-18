/**
 * Builds a deterministic mapping from user IDs to display names.
 * IDs are sorted numerically and assigned sequential "Demo Test N" names,
 * so the same ID always resolves to the same name within a given dataset.
 */
export function buildStudentNameMap(userIds: number[]): Map<number, string> {
    const sorted = [...new Set(userIds)].sort((a, b) => a - b)
    const map = new Map<number, string>()
    sorted.forEach((id, idx) => map.set(id, `Demo Test ${idx + 1}`))
    return map
}

export function getStudentName(userId: number, nameMap: Map<number, string>): string {
    return nameMap.get(userId) ?? `Demo Test ?`
}
