type EmptyStateProps = {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return <div className="py-12 text-center text-sm text-(--color-text3)">{message}</div>
}
