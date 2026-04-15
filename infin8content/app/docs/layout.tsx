import Link from 'next/link'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold text-sm">
              Infin8Content
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/docs/api" className="hover:text-foreground transition-colors">
                API Reference
              </Link>
            </nav>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-primary hover:underline underline-offset-4"
          >
            Back to Dashboard →
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">{children}</main>
    </div>
  )
}
