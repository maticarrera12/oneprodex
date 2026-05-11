import { notFound } from "next/navigation"

import MatchDetailScreen from "@/features/matches/components/match-detail-screen"
import { getMatchById } from "@/features/matches/mock"

type MatchDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = await params
  const match = getMatchById(id)

  if (!match) {
    notFound()
  }

  return <MatchDetailScreen match={match} />
}
