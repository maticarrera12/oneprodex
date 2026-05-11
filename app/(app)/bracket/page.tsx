import { BracketScreen } from "@/features/bracket/components/bracket-screen"
import { BRACKET_ROUNDS, BRACKET_SCORE, CHAMPION_PICK } from "@/features/bracket/mock"

export default function BracketPage() {
  return <BracketScreen rounds={BRACKET_ROUNDS} scoreStats={BRACKET_SCORE} champion={CHAMPION_PICK} />
}
