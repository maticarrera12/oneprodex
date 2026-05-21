import type { ProfileAchievement } from "@/features/profile/types"

type ProfileAchievementsGridProps = {
  achievements: ProfileAchievement[]
}

export function ProfileAchievementsGrid({ achievements }: ProfileAchievementsGridProps) {
  const unlocked = achievements.filter((achievement) => achievement.got).length

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold tracking-wider text-(--color-text2) uppercase">Achievements</h2>
        <p className="font-mono text-xs text-(--color-text3)">
          {unlocked} / 12
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {achievements.map((achievement) => (
          <article
            key={achievement.id}
            className={`rounded-xl border p-2.5 text-center ${toneClasses(achievement.tone)} ${achievement.got ? "" : "opacity-65"}`}
          >
            <div
              className={`mx-auto mb-2 inline-flex size-9 items-center justify-center rounded-lg ${
                achievement.got
                  ? "bg-linear-to-br from-(--color-primary) to-(--color-lime-deep) text-black"
                  : "bg-white/7 text-(--color-text3)"
              }`}
            >
              {achievement.got ? (
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path
                    d="M4 9 7.5 12.5 14 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                  <rect x="2" y="6" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </div>
            <p className="text-[11px] font-semibold leading-tight">{achievement.name}</p>
            <p className="mt-1 font-mono text-[9px] tracking-wide text-(--color-text3)">{achievement.sub}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function toneClasses(tone: ProfileAchievement["tone"]): string {
  switch (tone) {
    case "lime":
      return "border-(--color-lime-deep) bg-(--color-lime-bg)"
    case "amber":
      return "border-(--color-amber)/30 bg-(--color-amber)/10"
    case "violet":
      return "border-(--color-violet)/30 bg-(--color-violet)/10"
    default:
      return "border-(--color-border-hi) bg-(--color-card-hi)"
  }
}
