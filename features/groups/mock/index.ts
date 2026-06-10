import type { ActivityItem, GroupInfo } from "@/features/groups/types"

export const GROUP_INFO: GroupInfo = {
  id: "mock-group-1",
  name: "Les Cracks",
  owner_id: "mock-owner-1",
  members: 12,
  matchday: "Jornada 3",
  invite_code: "MOCK01",
}

export const ACTIVITY: ActivityItem[] = [
  {
    who: "María",
    action: "acertó resultado",
    detail: "ARG 2-1 FRA",
    meta: "+7 pts",
    kind: "correct_result",
    time: "hace 9 min",
  },
  {
    who: "Lucho",
    action: "clavó marcador exacto",
    detail: "BRA 1-1 ESP",
    meta: "+12 pts",
    kind: "exact_score",
    time: "hace 22 min",
  },
  {
    who: "Fede",
    action: "se sumó al grupo",
    detail: "¡Bienvenido!",
    meta: "nuevo miembro",
    kind: "joined",
    time: "hace 1 h",
  },
]
