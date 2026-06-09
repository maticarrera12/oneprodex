'use client'

import { useEffect, useMemo, useState } from 'react'
import { GroupHeader } from '@/features/groups/components/group-header'
import { GroupModal } from '@/features/groups/components/group-modal'
import { GroupPodiumHero } from '@/features/groups/components/group-podium-hero'
import { GroupRankList } from '@/features/groups/components/group-rank-list'
import { GroupYouSticky } from '@/features/groups/components/group-you-sticky'
import type { GroupInfo } from '@/features/groups/types'
import type { RankingEntry } from '@/features/rankings/types'

type GroupLeaderboardScreenProps = {
  group: GroupInfo
  leaderboard: RankingEntry[]
  groups: GroupInfo[]
}

export function GroupLeaderboardScreen({ group, leaderboard, groups }: GroupLeaderboardScreenProps) {
  const [pulseHandle, setPulseHandle] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const you = useMemo(() => leaderboard.find((entry) => entry.isYou), [leaderboard])
  const podium = leaderboard.slice(0, 3)

  useEffect(() => {
    const timer = setInterval(() => {
      const candidates = leaderboard.filter((entry) => !entry.isYou && entry.delta !== 0)
      if (candidates.length === 0) return
      const random = candidates[Math.floor(Math.random() * candidates.length)]
      setPulseHandle(random.handle)
      window.setTimeout(() => setPulseHandle(null), 1700)
    }, 6000)

    return () => clearInterval(timer)
  }, [leaderboard])

  return (
    <>
      <div className="space-y-4 py-4 pb-6">
        <GroupHeader
          name={group.name}
          members={group.members}
          inviteCode={group.invite_code}
          onAdd={() => setModalOpen(true)}
          groups={groups}
          activeId={group.id}
        />
        <GroupPodiumHero podium={podium} you={you} totalMembers={group.members} />
        <GroupRankList leaderboard={leaderboard} pulseHandle={pulseHandle} />

        {you ? <GroupYouSticky you={you} /> : null}
      </div>

      <GroupModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
