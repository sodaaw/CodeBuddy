'use client'

import { useAuth } from '@/lib/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const TYPING_LINES = [
  '// explain your solution',
  '// not just solved, understood',
  '// review before you forget',
] as const

function TypingText() {
  const [displayText, setDisplayText] = useState('')
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const currentLine = TYPING_LINES[currentLineIndex]

    if (isTyping && !isDeleting) {
      if (displayText.length < currentLine.length) {
        const typingSpeed = 60 + Math.random() * 20
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentLine.slice(0, displayText.length + 1))
        }, typingSpeed)
      } else {
        const pauseTime = 1200 + Math.random() * 400
        timeoutRef.current = setTimeout(() => {
          setIsDeleting(true)
        }, pauseTime)
      }
    } else if (isDeleting) {
      if (displayText.length > 0) {
        const deleteSpeed = 40 + Math.random() * 15
        timeoutRef.current = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, deleteSpeed)
      } else {
        setIsDeleting(false)
        const availableIndices = TYPING_LINES.map((_, idx) => idx).filter((idx) => idx !== currentLineIndex)
        const nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
        setCurrentLineIndex(nextIndex)
        setIsTyping(true)
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [displayText, currentLineIndex, isTyping, isDeleting])

  return (
    <div
      className="text-sm font-mono mb-3 md:mb-4"
      style={{
        color: 'rgba(62, 207, 142, 0.75)',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      }}
    >
      {displayText}
    </div>
  )
}

function scrollToSection(id: string, onAfter?: () => void) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#${id}`)
    }
  }
  onAfter?.()
}

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'CodeBuddy는 뭔가요?',
    a: '코딩 테스트 풀이를 기록하고, AI가 만든 이해도 질문으로 복습 타이밍을 잡아주는 서비스예요. 한 번 풀고 끝이 아니라, 오래 기억할 수 있도록 도와줍니다.',
  },
  {
    q: '무료인가요?',
    a: '현재는 개발 중이며, 무료로 사용할 수 있어요. 나중에 유료 플랜이 생겨도 무료 티어는 유지할 예정입니다.',
  },
  {
    q: '어떤 플랫폼을 지원하나요?',
    a: 'BOJ, LeetCode, Programmers 등 자주 쓰는 코딩 테스트 플랫폼을 지원해요. 풀이 기록 시 플랫폼과 난이도, 태그를 함께 남기면 복습할 때 찾기 편합니다.',
  },
  {
    q: '복습 타이밍은 어떻게 정해지나요?',
    a: '간격 반복(spaced repetition) 원리를 사용해요. 이해도 체크 결과와 복습 이력을 바탕으로, 오래 기억할 수 있도록 최적의 시점에 복습할 수 있게 안내합니다.',
  },
  {
    q: '로그인 없이 사용할 수 있나요?',
    a: '세션과 복습 기록을 저장하려면 로그인이 필요해요. 둘러보기만 하시려면 로그인 없이 이 랜딩에서 기능과 이용 방법을 확인하실 수 있습니다.',
  },
]

export default function LandingPage() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const [meowBubble, setMeowBubble] = useState<string | null>(null)
  const [meowExiting, setMeowExiting] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const meowFadeOutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const meowRemoveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const MEOWS = ['야옹', '미야옹', '애옹', '먀옹', '매옹'] as const
  const FADE_MS = 250
  const VISIBLE_MS = 1200

  const clearMeowTimeouts = () => {
    if (meowFadeOutRef.current) {
      clearTimeout(meowFadeOutRef.current)
      meowFadeOutRef.current = null
    }
    if (meowRemoveRef.current) {
      clearTimeout(meowRemoveRef.current)
      meowRemoveRef.current = null
    }
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
    return () => clearMeowTimeouts()
  }, [isLoggedIn, router])

  if (isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Landing Navigation (logged-out) */}
      <header className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.08)] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6 md:gap-8">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <img src="/logobright.png" alt="CodeBuddy" className="h-6 w-6" />
              <span className="text-lg font-medium text-text-primary">CodeBuddy</span>
            </button>
            <nav className="hidden sm:flex items-center gap-1">
              {[
                { id: 'features', label: '기능' },
                { id: 'tutorial', label: '튜토리얼' },
                { id: 'faq', label: 'FAQ' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-secondary rounded-md transition-colors duration-150 ease-out"
                >
                  {label}
                </button>
              ))}
            </nav>
            {/* 모바일: 햄버거 메뉴 */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="sm:hidden p-2 -mr-2 text-text-muted hover:text-text-primary rounded-md transition-colors"
              aria-label="메뉴 열기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm">
                로그인
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="primary" size="sm" className="text-sm">
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-[calc(100vh-3.5rem)] max-w-6xl mx-auto px-4 pt-16 md:pt-24 pb-20 md:pb-24 flex flex-col md:flex-row md:items-center md:justify-between gap-10 md:gap-12">
        <div className="text-center md:text-left flex-1 max-w-2xl">
          <TypingText />
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-text-primary mb-5 md:mb-6 leading-[1.2]"
            style={{ letterSpacing: '-0.02em', fontWeight: 600 }}
          >
            어제 푼 문제, <br />
            오늘 설명할 수 있나요?
          </h1>
          <p className="text-lg sm:text-xl text-text-muted mb-8 md:mb-10 max-w-2xl mx-auto md:mx-0 leading-relaxed">
            CodeBuddy는 한 번 풀고 잊히는 풀이가 아니라, 코딩 테스트에서 다시 꺼낼 수 있는 기억을 만들어줍니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
            <Link href="/login" className="flex-1 sm:flex-initial">
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
              onClick={() => scrollToSection('features')}
            >
              둘러보기
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
                className={cn(
                  'absolute left-1/2 -translate-x-1/2 -top-3 flex flex-col items-center',
                  meowExiting ? 'animate-[meow-fade-out_250ms_ease-out_forwards]' : 'animate-[meow-fade-in_250ms_ease-out]'
                )}
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

      {/* #features */}
      <section
        id="features"
        className="max-w-6xl mx-auto px-4 py-16 md:py-20 border-t border-[rgba(255,255,255,0.06)] scroll-mt-16"
      >
        <div className="text-center mb-10 md:mb-12">
          <h2
            className="text-2xl md:text-3xl font-semibold text-text-primary mb-2"
            style={{ letterSpacing: '-0.02em', fontWeight: 600 }}
          >
            기능
          </h2>
          <p className="text-text-muted text-sm md:text-base max-w-2xl mx-auto">
            풀이 기록부터 복습까지, 한 곳에서 관리하세요.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="rounded-[12px]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-medium text-text-primary mb-1.5">세션 기록</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  풀었던 문제를 세션 단위로 기록해요. 메모와 함께 남기면 나중에 복습할 때 무슨 생각으로 풀었는지 다시 떠올리기 쉽습니다.
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
                <h3 className="text-base font-medium text-text-primary mb-1.5">이해도 질문 3문항</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  AI가 만든 이해도 확인 질문 3개에 답해요. 문제만 기억하는 게 아니라 풀이를 제대로 이해했는지 검증합니다.
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
                <h3 className="text-base font-medium text-text-primary mb-1.5">복습 큐 / 워크벤치</h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  복습할 문제를 큐로 모아두고, 워크벤치에서 한 건씩 처리해요. 타이밍이 된 것부터 안내합니다.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* #tutorial */}
      <section
        id="tutorial"
        className="max-w-4xl mx-auto px-4 py-16 md:py-24 border-t border-[rgba(255,255,255,0.06)] scroll-mt-16"
      >
        <div className="text-center mb-12">
          <h2
            className="text-2xl md:text-3xl font-semibold text-text-primary mb-2"
            style={{ letterSpacing: '-0.02em', fontWeight: 600 }}
          >
            이용 방법
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            세 단계로 코딩 문제 마스터하기
          </p>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
              <span className="text-sm font-medium text-accent">1</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-1.5">1. 세션 기록하기</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                코딩 문제를 풀고 메모와 함께 풀이를 기록하세요. 무엇을 배웠는지, 어떻게 접근했는지 적어두면 나중에 복습할 때 도움이 됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
              <span className="text-sm font-medium text-accent">2</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-text-primary mb-1.5">2. 이해도 질문 3문항에 답하기</h3>
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
              <h3 className="text-lg font-medium text-text-primary mb-1.5">3. 알맞은 타이밍에 복습하기</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                복습할 때가 되면 알림을 받으세요. 간격 반복 알고리즘이 최적의 간격으로 복습해 오래 기억하도록 돕습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* #faq */}
      <section
        id="faq"
        className="max-w-2xl mx-auto px-4 py-16 md:py-24 border-t border-[rgba(255,255,255,0.06)] scroll-mt-16"
      >
        <div className="text-center mb-12">
          <h2
            className="text-2xl md:text-3xl font-semibold text-text-primary mb-2"
            style={{ letterSpacing: '-0.02em', fontWeight: 600 }}
          >
            FAQ
          </h2>
          <p className="text-text-muted max-w-xl mx-auto">
            자주 묻는 질문
          </p>
        </div>

        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="rounded-[10px] border border-[rgba(255,255,255,0.06)] bg-background-secondary overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-text-primary hover:bg-background-tertiary/50 transition-colors duration-150"
              >
                <span>{item.q}</span>
                <span
                  className={cn(
                    'flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-text-muted transition-transform duration-200',
                    faqOpen === i && 'rotate-180'
                  )}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              <div
                className={cn(
                  'grid transition-all duration-200 ease-out',
                  faqOpen === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-text-muted leading-relaxed border-t border-[rgba(255,255,255,0.06)] pt-3">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* #cta */}
      <section
        id="cta"
        className="max-w-4xl mx-auto px-4 py-20 md:py-28 border-t border-[rgba(255,255,255,0.06)] scroll-mt-16"
      >
        <div className="text-center">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-semibold text-text-primary mb-4"
            style={{ letterSpacing: '-0.02em', fontWeight: 600 }}
          >
            오늘부터 풀이를 기억하세요
          </h2>
          <p className="text-base md:text-lg text-text-muted mb-8 max-w-xl mx-auto leading-relaxed">
            한 번 푼 문제를 코딩 테스트까지 가져가세요. 무료로 시작할 수 있어요.
          </p>
          <Link href="/login">
            <Button
              variant="primary"
              size="lg"
              className="rounded-[12px] transition-all duration-150 ease-out hover:shadow-[0_0_0_1px_rgba(62,207,142,0.25),0_0_20px_rgba(62,207,142,0.15)]"
            >
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      {/* 모바일 메뉴 Drawer */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="메뉴"
        side="bottom"
      >
        <nav className="flex flex-col gap-1">
          {[
            { id: 'features', label: '기능' },
            { id: 'tutorial', label: '튜토리얼' },
            { id: 'faq', label: 'FAQ' },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id, () => setMobileMenuOpen(false))}
              className="px-4 py-3 text-left text-base font-medium text-text-primary hover:bg-background-tertiary rounded-lg transition-colors"
            >
              {label}
            </button>
          ))}
        </nav>
      </Drawer>
    </div>
  )
}
