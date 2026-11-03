export default function Loading() {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-background"
      aria-label="טוען..."
    >
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 animate-spin rounded-full border-4 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">טוען...</p>
      </div>
    </div>
  )
}
