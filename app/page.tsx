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
  const [meowBubble, setMeowBubble] = useState<string | null>(null)
  const [meowExiting, setMeowExiting] = useState(false)
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const meowFadeOutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const meowRemoveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const MEOWS = ['야옹', '미야옹', '애옹', '먀옹', '매옹'] as const
  const FADE_MS = 250
  const VISIBLE_MS = 1200

  const clearMeowTimeouts = () => {
    if (meowFadeOutRef.current) { clearTimeout(meowFadeOutRef.current); meowFadeOutRef.current = null }
    if (meowRemoveRef.current) { clearTimeout(meowRemoveRef.current); meowRemoveRef.current = null }
  }

  const handleCatClick = () => {
    clearMeowTimeouts()
    const random = MEOWS[Math.floor(Math.random() * MEOWS.length)]
    setMeowBubble(random)
    setMeowExiting(false)
    meowFadeOutRef.current = setTimeout(() => {
      setMeowExiting(true)
      meowFadeOutRef.current = null
      meowRemoveRef.current = setTimeout(() => {
        setMeowBubble(null)
        setMeowExiting(false)
        meowRemoveRef.current = null
      }, FADE_MS)
    }, VISIBLE_MS)
  }

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/home')
    }
    return () => { clearMeowTimeouts() }
  }, [isLoggedIn, router])

  const featuresRef = useRef<HTMLDivElement>(null)

  const handleHowItWorks = () => {
    if (howItWorksRef.current) {
      howItWorksRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      setShowHowItWorks(true)
    }
  }

  const handleFeatures = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Landing Navigation */}
      <header className="border-b border-[rgba(255,255,255,0.08)] bg-background">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logobright.png" 
                alt="CodeBuddy" 
                className="h-6 w-6"
              />
              <span className="text-lg font-medium text-text-primary">CodeBuddy</span>
            </div>
            <nav className="hidden sm:flex items-center gap-6">
              <button
                onClick={handleHowItWorks}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 ease-out"
              >
                사용 방법
              </button>
              <button
                onClick={handleFeatures}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 ease-out"
              >
                주요 기능
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm">
                로그인
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="sm" className="text-sm">
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-[calc(100vh-3.5rem)] max-w-6xl mx-auto px-4 pt-16 md:pt-24 pb-20 md:pb-24 flex flex-col md:flex-row md:items-center md:justify-between gap-10 md:gap-12">
        <div className="text-center md:text-left flex-1 max-w-2xl">
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-text-primary mb-5 md:mb-6" 
            style={{ letterSpacing: '-0.2%', fontWeight: 600 }}
          >
            해결한 방법을 잊지 마세요.
          </h1>
          <p className="text-lg sm:text-xl md:text-xl text-text-muted mb-8 md:mb-10 max-w-2xl mx-auto md:mx-0 leading-relaxed">
            풀었던 알고리즘을 기억하세요. 적극 회상과 간격 반복으로 코딩 테스트를 준비하는 더 좋은 방법이에요.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
            <Link href="/login">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full sm:w-auto rounded-[12px] transition-all duration-150 ease-out hover:shadow-[0_0_0_1px_rgba(62,207,142,0.25),0_0_20px_rgba(62,207,142,0.15)]"
              >
                시작하기
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full sm:w-auto rounded-[12px] transition-all duration-150 ease-out"
              onClick={handleHowItWorks}
            >
              사용 방법
            </Button>
          </div>
        </div>
        <div className="relative flex justify-center md:justify-end flex-shrink-0">
          <button
            type="button"
            onClick={handleCatClick}
            className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            aria-label="고양이"
          >
            <img 
              src="/cat.png" 
              alt="" 
              className="w-72 sm:w-[21rem] md:w-96 lg:w-[27rem] h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
            />
            {meowBubble && (
              <span
                className={`absolute left-1/2 -translate-x-1/2 -top-3 flex flex-col items-center ${
                  meowExiting
                    ? 'animate-[meow-fade-out_250ms_ease-out_forwards]'
                    : 'animate-[meow-fade-in_250ms_ease-out]'
                }`}
              >
                <span className="relative px-3 py-1.5 rounded-xl bg-background-tertiary border border-border text-sm text-text-primary whitespace-nowrap shadow-lg">
                  {meowBubble}
                  <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-background-tertiary" />
                </span>
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Feature Preview Section */}
      <section 
        ref={featuresRef}
        className="max-w-6xl mx-auto px-4 py-12 md:py-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="rounded-[12px]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-text-primary mb-1.5">
                  문제 기록
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  풀었던 문제를 메모와 함께 체계적으로 기록하세요.
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[12px]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-text-primary mb-1.5">
                  이해도 체크
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  AI 질문으로 이해도를 확인하고 오래 기억하세요.
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[12px]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-text-primary mb-1.5">
                  적절한 타이밍의 복습
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  간격 반복으로 최적의 시점에 복습하세요.
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
            사용 방법
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            코딩 문제 마스터를 위한 세 가지 단계
          </p>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
              <span className="text-sm font-medium text-accent">1</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-1.5">
                1. 문제 기록하기
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                코딩 문제를 풀고 메모와 함께 풀이를 기록하세요. 무엇을 배웠는지, 어떻게 접근했는지 적어두세요.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
              <span className="text-sm font-medium text-accent">2</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-1.5">
                2. AI 체크 질문에 답하기
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                AI가 만든 질문으로 이해도를 확인하세요. 문제만 기억하는 게 아니라 풀이를 제대로 기억하는지 검증합니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
              <span className="text-sm font-medium text-accent">3</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-1.5">
                3. 알맞은 타이밍에 복습하기
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                복습할 때가 되면 알림을 받으세요. 간격 반복 알고리즘이 최적의 간격으로 복습해 오래 기억하도록 돕습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Modal (fallback for mobile) */}
      <Modal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
        title="사용 방법"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium text-text-primary mb-1.5">
              1. 문제 기록하기
            </h3>
            <p className="text-sm text-text-muted">
              코딩 문제를 풀고 메모와 함께 풀이를 기록하세요.
            </p>
          </div>
          <div>
            <h3 className="text-base font-medium text-text-primary mb-1.5">
              2. AI 체크 질문에 답하기
            </h3>
            <p className="text-sm text-text-muted">
              AI가 만든 질문으로 이해도를 확인하세요.
            </p>
          </div>
          <div>
            <h3 className="text-base font-medium text-text-primary mb-1.5">
              3. 알맞은 타이밍에 복습하기
            </h3>
            <p className="text-sm text-text-muted">
              복습할 때가 되면 알림을 받아 오래 기억하세요.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
