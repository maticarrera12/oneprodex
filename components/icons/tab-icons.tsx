import type { SVGProps } from "react"

type TabIconProps = SVGProps<SVGSVGElement> & {
  className?: string
}

export function HomeIcon({ className, ...props }: TabIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.8V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.8" />
      <path d="M9.5 21v-6a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6" />
    </svg>
  )
}

export function StandingsIcon({ className, ...props }: TabIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 4v16" />
      <path d="M3 14h18" />
    </svg>
  )
}

export function GroupIcon({ className, ...props }: TabIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M4 19.5c.7-3 3.4-5 8-5s7.3 2 8 5" />
      <path d="M5.5 11.5a2.3 2.3 0 1 0 0-4.6" />
      <path d="M18.5 11.5a2.3 2.3 0 1 1 0-4.6" />
    </svg>
  )
}

export function BracketIcon({ className, ...props }: TabIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M6 5h4v4H6zM14 5h4v4h-4zM10 15h4v4h-4z" />
      <path d="M10 7h4M12 9v6M10 17H6v-4M14 17h4v-4" />
    </svg>
  )
}

export function ProfileIcon({ className, ...props }: TabIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 13.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M4 20c.8-3.1 3.6-5.5 8-5.5s7.2 2.4 8 5.5" />
    </svg>
  )
}
