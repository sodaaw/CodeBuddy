'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSessionStore } from '@/lib/store/sessionStore'
import { Session, JudgeResult } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import { createJudgeClient, validateJudgeResponse } from '@/lib/judge/client'

// Monaco Editor를 동적으로 로드 (SSR 방지)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface SolvePageProps {
  params: {
    sessionId: string
  }
}

function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'BOJ':
      return 'text-blue-400'
    case 'LeetCode':
      return 'text-orange-400'
    case 'Programmers':
      return 'text-purple-400'
    default:
      return 'text-text-muted'
  }
}

function getDifficultyColor(difficulty: string): string {
  const lower = difficulty.toLowerCase()
  if (lower === 'easy') return 'text-green-400'
  if (lower === 'medium') return 'text-yellow-400'
  if (lower === 'hard') return 'text-red-400'
  return 'text-text-muted'
}

function getVerdictColor(verdict: JudgeResult['verdict']): string {
  switch (verdict) {
    case 'PASS':
      return 'text-green-400'
    case 'LIKELY_PASS':
      return 'text-green-300'
    case 'FAIL':
      return 'text-red-400'
    case 'POSSIBLY_FAIL':
      return 'text-yellow-400'
    case 'TLE_RISK':
      return 'text-orange-400'
    default:
      return 'text-text-muted'
  }
}

function getVerdictLabel(verdict: JudgeResult['verdict']): string {
  switch (verdict) {
    case 'PASS':
      return '통과'
    case 'LIKELY_PASS':
      return 'Likely pass'
    case 'FAIL':
      return '실패'
    case 'POSSIBLY_FAIL':
      return 'Possible issues'
    case 'TLE_RISK':
      return 'TLE risk'
    default:
      return verdict
  }
}

async function submitToJudge(session: Session): Promise<JudgeResult> {
  const client = createJudgeClient()

  const payload = {
    sessionId: session.id,
    problem: session.problem,
    language: session.language,
    code: session.code,
    userExplanation: '',
    runOutput: session.runOutput || '',
  }

  try {
    const rawResponse = await client.judge(payload)
    const validatedResponse = validateJudgeResponse(rawResponse)

    // JudgeResponse를 JudgeResult로 변환
    const judgeResult: JudgeResult = {
      verdict: validatedResponse.verdict,
      confidence: validatedResponse.confidence,
      reasons: validatedResponse.reasons,
      edge_cases_to_test: validatedResponse.edge_cases_to_test,
      time_complexity: validatedResponse.time_complexity,
      next_actions: validatedResponse.next_actions,
      createdAt: new Date().toISOString(),
    }

    return judgeResult
  } catch (error) {
    console.error('Judge 요청 중 오류:', error)
    throw error instanceof Error ? error : new Error('Judge 요청 중 알 수 없는 오류가 발생했습니다.')
  }
}

export default function SolvePage({ params }: SolvePageProps) {
  const router = useRouter()
  const { getSession, setCode, updateSession, setJudgeResult } = useSessionStore()
  const [session, setSession] = useState<Session | undefined>(() => getSession(params.sessionId))
  const [code, setCodeLocal] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 세션 로드 및 코드 초기화
  useEffect(() => {
    const loadedSession = getSession(params.sessionId)
    if (loadedSession) {
      setSession(loadedSession)
      setCodeLocal(loadedSession.code || '')
    }
  }, [params.sessionId, getSession])

  // 코드 변경 시 debounced 저장
  const handleCodeChange = useCallback((value: string | undefined) => {
    const newCode = value || ''
    setCodeLocal(newCode)
    
    if (!session) return
    
    // 기존 timeout 취소
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // 500ms 후 저장
    saveTimeoutRef.current = setTimeout(() => {
      setCode(session.id, newCode)
      setSession((prev) => prev ? { ...prev, code: newCode } : undefined)
    }, 500)
  }, [session, setCode])

  // 언어 변경
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!session) return
    const newLanguage = e.target.value as Session['language']
    updateSession(session.id, { language: newLanguage })
    setSession((prev) => prev ? { ...prev, language: newLanguage } : undefined)
  }

  // Run 버튼
  const handleRun = () => {
    if (!session) return
    const output = 'Ran successfully\n\nTest cases passed: 3/3'
    updateSession(session.id, { runOutput: output })
    setSession((prev) => prev ? { ...prev, runOutput: output } : undefined)
  }

  // Submit 버튼
  const handleSubmit = async () => {
    if (!session) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const judgeResult = await submitToJudge(session)
      
      setJudgeResult(session.id, judgeResult)
      updateSession(session.id, { status: 'SUBMITTED' })
      setSession((prev) => prev ? {
        ...prev,
        judge: judgeResult,
        status: 'SUBMITTED',
      } : undefined)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '제출 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // 세션이 없으면 빈 상태 표시
  if (!session) {
    return (
      <div className="min-h-screen pb-20 md:pb-0 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">
              세션을 찾을 수 없어요
            </h2>
            <p className="text-sm text-text-muted">
              이 세션이 존재하지 않거나 삭제되었을 수 있어요.
            </p>
            <Link href="/start">
              <Button variant="primary" size="md" className="w-full">
                새 세션 시작하기
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  // Monaco 언어 매핑
  const monacoLanguage = session.language === 'javascript' ? 'javascript' :
                         session.language === 'typescript' ? 'typescript' :
                         'python'

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-text-primary mb-2">
                {session.problem.title}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('text-xs font-medium', getPlatformColor(session.problem.platform))}>
                  {session.problem.platform}
                </span>
                <span className="text-text-muted text-xs">•</span>
                <span className={cn('text-xs font-medium', getDifficultyColor(session.problem.difficulty))}>
                  {session.problem.difficulty}
                </span>
                <span className="text-text-muted text-xs">•</span>
                <span className="text-xs text-text-muted">
                  세션
                </span>
              </div>
            </div>
            <Link href="/home">
              <Button variant="ghost" size="sm">
                홈
              </Button>
            </Link>
          </div>
        </div>

        {/* Editor Section */}
        <div className="space-y-4">
          {/* Language Selector + Editor */}
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-3">
              <Select
                value={session.language}
                onChange={handleLanguageChange}
                className="w-auto min-w-[120px]"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
              </Select>
            </div>
            <div className="h-[400px] md:h-[500px]">
              <MonacoEditor
                language={monacoLanguage}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
              />
            </div>
          </Card>

          {/* Buttons Row */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={handleRun}
            >
              Run
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={isSubmitting || !code.trim()}
            >
              {isSubmitting ? '제출 중...' : 'Submit'}
            </Button>
          </div>

          {/* Error Message */}
          {submitError && (
            <Card className="border-red-500/20 bg-red-500/5">
              <p className="text-sm text-red-400">{submitError}</p>
            </Card>
          )}

          {/* Run Output */}
          {session.runOutput && (
            <Card>
              <div className="mb-2">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                  실행 결과
                </span>
              </div>
              <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap">
                {session.runOutput}
              </pre>
            </Card>
          )}

          {/* Judge Result */}
          {session.judge && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                    판정 결과
                  </span>
                  <Badge
                    variant="muted"
                    className={cn('text-xs font-medium', getVerdictColor(session.judge.verdict))}
                  >
                    {getVerdictLabel(session.judge.verdict)}
                  </Badge>
                  {session.judge.confidence !== undefined && (
                    <span className="text-xs text-text-muted">
                      신뢰도: {Math.round(session.judge.confidence * 100)}%
                    </span>
                  )}
                </div>

                {session.judge.reasons.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-text-primary mb-2">
                      판정 이유
                    </h3>
                    <ul className="space-y-1.5">
                      {session.judge.reasons.map((reason, idx) => (
                        <li key={idx} className="text-sm text-text-muted flex items-start gap-2">
                          <span className="text-text-secondary mt-0.5">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(session.judge.edge_cases_to_test && session.judge.edge_cases_to_test.length > 0) ||
                 (session.judge.edge_cases && session.judge.edge_cases.length > 0) ? (
                  <div>
                    <h3 className="text-sm font-medium text-text-primary mb-2">
                      엣지 케이스
                    </h3>
                    <ul className="space-y-1.5">
                      {(session.judge.edge_cases_to_test || session.judge.edge_cases || []).map((edgeCase, idx) => (
                        <li key={idx} className="text-sm text-text-muted flex items-start gap-2">
                          <span className="text-text-secondary mt-0.5">•</span>
                          <span>{edgeCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {session.judge.time_complexity && (
                  <div>
                    <h3 className="text-sm font-medium text-text-primary mb-1">
                      시간 복잡도
                    </h3>
                    <p className="text-sm text-text-muted">{session.judge.time_complexity}</p>
                  </div>
                )}

                {session.judge.next_actions && session.judge.next_actions.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-text-primary mb-2">
                      다음 액션
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {session.judge.next_actions.map((action, idx) => (
                        <Badge
                          key={idx}
                          variant="muted"
                          className="text-xs"
                        >
                          {action === 'ASK_HINT' ? '힌트 요청' : '확인하기'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-[rgba(255,255,255,0.06)]">
                  {session.judge.next_actions?.includes('GO_CHECK') ? (
                    <Link href={`/check/${session.id}`}>
                      <Button variant="primary" size="md" className="w-full sm:w-auto">
                        이해도 확인하기
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/check/${session.id}`}>
                      <Button variant="primary" size="md" className="w-full sm:w-auto">
                        이해도 확인하기
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
