'use client'

import { useAuth } from '@/lib/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'

export default function LandingPage() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const howItWorksRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/home')
    }
  }, [isLoggedIn, router])

  const handleHowItWorks = () => {
    if (howItWorksRef.current) {
      howItWorksRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      setShowHowItWorks(true)
    }
  }

  if (isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Landing Navigation */}
      <header className="border-b border-[rgba(255,255,255,0.06)] bg-background">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logobright.png" 
              alt="CodeBuddy" 
              className="h-6 w-6"
            />
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
      <section className="min-h-[calc(100vh-3.5rem)] max-w-6xl mx-auto px-4 pt-16 md:pt-24 pb-20 md:pb-24 flex flex-col md:flex-row md:items-center md:justify-between gap-10 md:gap-12">
        <div className="text-center md:text-left flex-1 max-w-2xl">
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-text-primary mb-4 md:mb-6" 
            style={{ letterSpacing: '-0.2%', fontWeight: 600 }}
          >
            Don't forget how you solved it.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-text-muted mb-6 md:mb-8 max-w-2xl mx-auto md:mx-0">
            Remember your algorithms. A better way to prepare for coding interviews through active recall and spaced repetition.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
            <Link href="/login">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Get started
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full sm:w-auto"
              onClick={handleHowItWorks}
            >
              How it works
            </Button>
          </div>
        </div>
        <div className="flex justify-center md:justify-end flex-shrink-0">
          <img 
            src="/cat.png" 
            alt="" 
            className="w-72 sm:w-[21rem] md:w-96 lg:w-[27rem] h-auto object-contain"
          />
        </div>
      </section>

      {/* Feature Preview Section */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-text-primary mb-1.5">
                  Log your solved problems
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Track every problem you solve with detailed notes and solutions.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-text-primary mb-1.5">
                  Check your understanding
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Test yourself with spaced repetition to ensure long-term retention.
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-text-primary mb-1.5">
                  Review at the right time
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  Get notified when it's time to review problems you solved before.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* How it works Section */}
      <section 
        ref={howItWorksRef}
        className="max-w-4xl mx-auto px-4 py-16 md:py-24 border-t border-[rgba(255,255,255,0.06)]"
      >
        <div className="text-center mb-12">
          <h2 
            className="text-2xl md:text-3xl font-semibold text-text-primary mb-3" 
            style={{ letterSpacing: '-0.2%', fontWeight: 600 }}
          >
            How it works
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            Three simple steps to master coding problems
          </p>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
              <span className="text-sm font-medium text-accent">1</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-1.5">
                Log a problem
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Solve a coding problem and record your solution with notes. Track what you learned and how you approached it.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
              <span className="text-sm font-medium text-accent">2</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-1.5">
                Answer AI check questions
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Test your understanding with AI-generated questions. Verify that you truly remember the solution, not just the problem.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
              <span className="text-sm font-medium text-accent">3</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-1.5">
                Review at the right time
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Get notified when it's time to review. Our spaced repetition algorithm ensures you review problems at optimal intervals for long-term retention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Modal (fallback for mobile) */}
      <Modal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
        title="How it works"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium text-text-primary mb-1.5">
              1. Log a problem
            </h3>
            <p className="text-sm text-text-muted">
              Solve a coding problem and record your solution with notes.
            </p>
          </div>
          <div>
            <h3 className="text-base font-medium text-text-primary mb-1.5">
              2. Answer AI check questions
            </h3>
            <p className="text-sm text-text-muted">
              Test your understanding with AI-generated questions.
            </p>
          </div>
          <div>
            <h3 className="text-base font-medium text-text-primary mb-1.5">
              3. Review at the right time
            </h3>
            <p className="text-sm text-text-muted">
              Get notified when it's time to review for optimal retention.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
