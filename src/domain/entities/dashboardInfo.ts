/** Who covers the signed-in user while away, and when (calendar days, `YYYY-MM-DD`). */
export type DelegationCoverage = { coveredBy: string; from: string; to: string }

/** Dashboard facts that do not come from the tickets. */
export type DashboardInfo = {
  unreadNotifications: number
  delegation: DelegationCoverage
}
