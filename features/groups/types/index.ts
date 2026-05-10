export type ActivityKind = "correct_result" | "exact_score" | "missed" | "joined"

export interface ActivityItem {
  who: string
  action: string
  detail: string
  meta: string
  kind: ActivityKind
  time: string
}

export interface GroupInfo {
  name: string
  members: number
  matchday: string
}
