'use client'

import { useAuth } from '@/lib/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function LandingPage() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/home')
    }
  }, [isLoggedIn, router])

  if (isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Landing Navigation */}
      <header className="border-b border-border bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium text-text-primary">CodeBuddy</span>
          </div>
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 py-20 md:py-32">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-text-primary mb-6" style={{ letterSpacing: '-0.2%' }}>
            Don't forget how you solved it.
          </h1>
          <p className="text-lg md:text-xl text-text-muted mb-8 max-w-2xl">
            Remember your algorithms. A better way to prepare for coding interviews through active recall and spaced repetition.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/login">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Get started
              </Button>
            </Link>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              How it works
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Preview Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Log your solved problems
              </h3>
              <p className="text-sm text-text-muted">
                Track every problem you solve with detailed notes and solutions.
              </p>
            </div>
          </Card>

          <Card>
            <div className="mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Check your understanding
              </h3>
              <p className="text-sm text-text-muted">
                Test yourself with spaced repetition to ensure long-term retention.
              </p>
            </div>
          </Card>

          <Card>
            <div className="mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Review at the right time
              </h3>
              <p className="text-sm text-text-muted">
                Get notified when it's time to review problems you solved before.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
