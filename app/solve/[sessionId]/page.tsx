'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSessionStore } from '@/lib/store/sessionStore'
import { Session, JudgeResult } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Slider } from '@/components/ui/Slider'
import { cn } from '@/lib/utils'
import { createJudgeClient, validateJudgeResponse } from '@/lib/judge/client'
import { QuickLogModal } from '@/components/log/QuickLogModal'
import { normalizeN8nResponse, type NormalizedN8nResponse } from '@/lib/utils/n8nResponse'
import { getHints } from '@/lib/api'
import { Modal } from '@/components/ui/Modal'

// 웹훅 URL
const WEBHOOK_URL = 'https://primary-production-b57a.up.railway.app/webhook/submit'

// n8n 페이로드 타입
type N8nPayload = {
  userId: string
  problemId: number
  language: string
  code: string
  timeSpentMin: number
  hintUsed: boolean
  selfReportDifficulty: number
}

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
      return '통과 가능'
    case 'FAIL':
      return '실패'
    case 'POSSIBLY_FAIL':
      return '실패 가능'
    case 'TLE_RISK':
      return '시간 초과 위험'
    default:
      return verdict
  }
}

function getVerdictStatusLabel(verdict: JudgeResult['verdict']): string {
  switch (verdict) {
    case 'PASS':
    case 'LIKELY_PASS':
      return '양호'
    case 'FAIL':
    case 'POSSIBLY_FAIL':
    case 'TLE_RISK':
      return '주의 필요'
    default:
      return '확인 필요'
  }
}

function getUnderstandingBadgeStyle(level: string | null): string {
  if (!level) return 'bg-gray-500/20 text-gray-400'
  
  const lower = level.toLowerCase()
  if (lower.includes('낮음') || lower.includes('low')) {
    return 'bg-red-500/20 text-red-400'
  } else if (lower.includes('보통') || lower.includes('medium') || lower.includes('normal')) {
    return 'bg-amber-500/20 text-amber-400'
  } else if (lower.includes('높음') || lower.includes('high')) {
    return 'bg-green-500/20 text-green-400'
  }
  return 'bg-gray-500/20 text-gray-400'
}

// Verdict 정보 타입
type VerdictInfo = {
  abbreviation: string
  fullName: string
  description: string
}

// Verdict 정보 맵
const VERDICT_INFO: Record<string, VerdictInfo> = {
  AC: {
    abbreviation: 'AC',
    fullName: 'Accepted',
    description: '정답\n모든 테스트케이스를 통과했습니다. 코드가 올바르게 작동합니다.',
  },
  WA: {
    abbreviation: 'WA',
    fullName: 'Wrong Answer',
    description: '오답\n코드는 실행되지만 출력 결과가 기대한 값과 다릅니다. 로직을 다시 확인해보세요.',
  },
  TLE: {
    abbreviation: 'TLE',
    fullName: 'Time Limit Exceeded',
    description: '시간 초과\n제한 시간 내에 프로그램이 종료되지 않았습니다. 알고리즘의 시간 복잡도를 개선하거나 최적화가 필요합니다.',
  },
  MLE: {
    abbreviation: 'MLE',
    fullName: 'Memory Limit Exceeded',
    description: '메모리 초과\n메모리 제한을 초과했습니다. 불필요한 메모리 사용을 줄이거나 더 효율적인 자료구조를 사용해보세요.',
  },
  RE: {
    abbreviation: 'RE',
    fullName: 'Runtime Error',
    description: '런타임 에러\n프로그램 실행 중 오류가 발생했습니다. 배열 인덱스 범위 초과, null 참조, 0으로 나누기 등의 문제를 확인해보세요.',
  },
  CE: {
    abbreviation: 'CE',
    fullName: 'Compilation Error',
    description: '컴파일 에러\n코드를 컴파일할 수 없습니다. 문법 오류, 타입 오류, 또는 잘못된 함수 호출 등을 확인해보세요.',
  },
}

// 추천 문제 데이터 타입
type RecommendationData = {
  problemId: number
  recommendationId: number
  recommendationReason: string
}

// 추천 문제 데이터 맵
const RECOMMENDATION_DATA: Record<number, RecommendationData> = {
  1000: { problemId: 1000, recommendationId: 1001, recommendationReason: '같은 입력 형식(두 정수)에서 연산만 바뀌는 기본기 강화(덧셈→뺄셈)' },
  1001: { problemId: 1001, recommendationId: 10869, recommendationReason: '여러 연산을 한 번에 처리하면서 출력 형식/연산자 처리 기본기 확장' },
  1008: { problemId: 1008, recommendationId: 10869, recommendationReason: '나눗셈 출력 이후, 사칙연산 전체를 다루며 정수/나눗셈 처리 습관 정리' },
  2557: { problemId: 2557, recommendationId: 2438, recommendationReason: '입력 없는 단일 출력에서 입력/반복 출력(별찍기)로 자연스럽게 확장' },
  2438: { problemId: 2438, recommendationId: 2439, recommendationReason: '같은 별찍기지만 정렬(공백) 로직이 추가되어 문자열 출력 제어 연습' },
  2439: { problemId: 2439, recommendationId: 2741, recommendationReason: '패턴 출력 다음 단계로, 단순 반복 출력(1~N)로 루프 감각 고정' },
  2739: { problemId: 2739, recommendationId: 2741, recommendationReason: '여러 줄 출력 경험을 유지한 채 더 단순한 반복 출력로 기본기 다지기' },
  2741: { problemId: 2741, recommendationId: 2742, recommendationReason: '같은 반복 출력에서 방향(증가→감소)만 바꿔 루프 조건/인덱스 감각 강화' },
  2742: { problemId: 2742, recommendationId: 2753, recommendationReason: '조건 분기 문제로 전환해 if/else와 나머지 연산을 함께 연습' },
  2753: { problemId: 2753, recommendationId: 1110, recommendationReason: '조건+연산 다음 단계로 반복(while)과 사이클 탐지(종료조건) 연습' },
  2884: { problemId: 2884, recommendationId: 2525, recommendationReason: '시간 계산 유형(시/분 변환, 올림/내림)을 동일 주제로 한 번 더 강화' },
  10869: { problemId: 10869, recommendationId: 10998, recommendationReason: '사칙연산 후 곱셈만 단일로 빠르게 풀며 입출력/연산 실수 줄이기' },
  10950: { problemId: 10950, recommendationId: 10951, recommendationReason: '테스트케이스 반복(T) 다음에 EOF 입력 처리로 입력 종료 조건을 확장' },
  10951: { problemId: 10951, recommendationId: 10952, recommendationReason: 'EOF 처리 이후, 센티넬(0 0) 종료 조건 처리 방식 연습' },
  10952: { problemId: 10952, recommendationId: 11021, recommendationReason: '반복 입력 + 출력 포맷(Case #)이 추가되어 서식 출력 습관 형성' },
  10998: { problemId: 10998, recommendationId: 25314, recommendationReason: '단일 연산에서 문자열 패턴 출력로 전환해 반복 출력(문자열) 감각 확장' },
  11021: { problemId: 11021, recommendationId: 11022, recommendationReason: 'Case 포맷을 더 엄밀하게(수식 포함) 다루며 출력 문자열 구성 연습' },
  11022: { problemId: 11022, recommendationId: 10871, recommendationReason: '출력 포맷 문제 후, 조건 필터링(작은 수만 출력)으로 배열/조건 결합 연습' },
  14681: { problemId: 14681, recommendationId: 1330, recommendationReason: '사분면 판단 후 비교 연산(>,<,==)을 단순하게 한 번 더 고정' },
  2525: { problemId: 2525, recommendationId: 2884, recommendationReason: '같은 시간 계산 문제를 역으로 풀며 모듈러(24시간) 처리 감각 강화' },
  25304: { problemId: 25304, recommendationId: 10818, recommendationReason: '누적 합 검증 후 배열 전체에서 min/max 찾기로 반복+비교 로직 확장' },
  25314: { problemId: 25314, recommendationId: 15829, recommendationReason: '문자열 반복 출력에서 문자열을 수식으로 처리(해시)하는 단계로 확장' },
  2562: { problemId: 2562, recommendationId: 10818, recommendationReason: '최댓값/인덱스 찾기 다음에 min/max 동시 처리로 일반화 연습' },
  2577: { problemId: 2577, recommendationId: 3052, recommendationReason: '자리수 카운팅 후 모듈러/빈도 개념(서로 다른 나머지)로 확장' },
  2675: { problemId: 2675, recommendationId: 2941, recommendationReason: '문자 반복 처리 후 특수 문자열 패턴(치환/카운트)로 문자열 실전 감각 강화' },
  2908: { problemId: 2908, recommendationId: 1330, recommendationReason: '숫자 뒤집기 처리 후 결과 비교로 비교 연산/조건 출력 연결' },
  2920: { problemId: 2920, recommendationId: 8958, recommendationReason: '패턴 판별(ascending/descending) 후 연속 점수 누적(OX)로 상태 누적 로직 연습' },
  3052: { problemId: 3052, recommendationId: 2562, recommendationReason: '나머지의 중복 제거 감각 후 배열에서 최댓값/위치 찾기로 기본 반복/비교 강화' },
  8958: { problemId: 8958, recommendationId: 4344, recommendationReason: '점수 누적 후 평균과 비율 계산(출력 포맷 포함)로 통계형 기본 문제 확장' },
  9498: { problemId: 9498, recommendationId: 1330, recommendationReason: '등급 분기 후 비교 연산 문제로 조건/출력 최소 단위로 다시 정리' },
  1065: { problemId: 1065, recommendationId: 2292, recommendationReason: '규칙 기반 카운팅 후 수열/구간 규칙(벌집)으로 수학적 규칙 찾기 확장' },
  10818: { problemId: 10818, recommendationId: 2562, recommendationReason: 'min/max 처리 후 최댓값+인덱스(위치)까지 요구되어 구현 디테일 강화' },
  10871: { problemId: 10871, recommendationId: 10818, recommendationReason: '필터링 출력 후 min/max로 배열 전반 처리(전체 스캔) 훈련' },
  1110: { problemId: 1110, recommendationId: 1065, recommendationReason: '사이클 반복 후 규칙 판별(한수)로 반복+조건 결합 사고 확장' },
  1152: { problemId: 1152, recommendationId: 1157, recommendationReason: '단어 수 세기 후 빈도 기반 최빈 문자 찾기로 문자열 통계 처리 확장' },
  1157: { problemId: 1157, recommendationId: 1316, recommendationReason: '최빈 문자 후 그룹 단어 판별로 문자열 상태 추적(방문/연속성) 연습' },
  11720: { problemId: 11720, recommendationId: 1065, recommendationReason: '자리수 합 처리 후 규칙 기반 카운팅(한수)로 수학적 조건 구현 확장' },
  1316: { problemId: 1316, recommendationId: 2941, recommendationReason: '연속성 판별 후 다중 치환 패턴 처리로 문자열 예외 케이스 대응력 강화' },
  1546: { problemId: 1546, recommendationId: 4344, recommendationReason: '평균 계산 후 평균 초과 비율 + 퍼센트 출력 포맷으로 한 단계 확장' },
  1712: { problemId: 1712, recommendationId: 2292, recommendationReason: '공식 계산(손익분기점) 후 구간 규칙(벌집)으로 수학적 사고 확장' },
  2292: { problemId: 2292, recommendationId: 1712, recommendationReason: '구간 규칙 문제 후 공식 기반 계산 문제로 전환해 수학 구현 균형 맞추기' },
  2775: { problemId: 2775, recommendationId: 6064, recommendationReason: 'DP/누적 계산 감각 후 모듈러/주기 결합(중국인의 나머지류) 문제로 확장' },
  2839: { problemId: 2839, recommendationId: 1712, recommendationReason: '그리디로 경우의 수 최소화 후 공식 계산 문제로 전환해 사고 다양화' },
  2869: { problemId: 2869, recommendationId: 2292, recommendationReason: '등차 형태 계산 후 구간 규칙 문제로 확장해 수학적 패턴 인식 강화' },
  2941: { problemId: 2941, recommendationId: 2675, recommendationReason: '치환/카운트 후 반복 출력 문제로 돌아가 문자열 기본기를 다시 고정' },
  4344: { problemId: 4344, recommendationId: 1546, recommendationReason: '비율 출력 후 점수 조작 평균으로 다시 기본 평균 계산을 정밀하게 연습' },
  5622: { problemId: 5622, recommendationId: 1152, recommendationReason: '다이얼 매핑 후 문자열 토큰화(단어 개수)로 문자열 처리 범위 확장' },
  6064: { problemId: 6064, recommendationId: 9020, recommendationReason: '모듈러/주기 문제 후 소수 기반 분해(골드바흐)로 수학 주제 확장' },
  9020: { problemId: 9020, recommendationId: 1712, recommendationReason: '소수 분해 사고 후 공식 계산 문제로 전환해 수학 구현 균형 잡기' },
  11654: { problemId: 11654, recommendationId: 2675, recommendationReason: '아스키 변환 후 문자열 반복 출력로 문자/문자열 입출력 감각 확장' },
  1193: { problemId: 1193, recommendationId: 2292, recommendationReason: '대각선 규칙(분수찾기) 후 구간 규칙(벌집)으로 패턴 수학 연속 학습' },
  1330: { problemId: 1330, recommendationId: 9498, recommendationReason: '비교 연산 후 점수 구간 분기로 조건 분기 케이스를 확장' },
  15829: { problemId: 15829, recommendationId: 1316, recommendationReason: '해시로 문자 처리 감각 후 그룹 단어로 연속/방문 상태 추적 실전 연습' },
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
  const { getSession, setCode, updateSession, setJudgeResult, setLog } = useSessionStore()
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [session, setSession] = useState<Session | undefined>(undefined)
  const [code, setCodeLocal] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submittedCode, setSubmittedCode] = useState<string>('')
  const [showProblemPanel, setShowProblemPanel] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const judgeResultRef = useRef<HTMLDivElement | null>(null)
  const initializedRef = useRef(false)
  const sessionIdRef = useRef<string | null>(null)
  const dummyDataUpdatedRef = useRef(false)

  // 시간 측정 관련 상태
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(true)
  const [pausedSeconds, setPausedSeconds] = useState(0) // 일시정지된 시간 누적
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  // 힌트 관련 상태
  const [hintUsed, setHintUsed] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showHintConfirm, setShowHintConfirm] = useState(false)
  const [hints, setHints] = useState<string[]>([])

  // 체감 난이도 상태
  const [selfReportDifficulty, setSelfReportDifficulty] = useState(3)

  // n8n 웹훅 응답 상태
  const [n8nResponse, setN8nResponse] = useState<NormalizedN8nResponse | null>(null)
  const [n8nError, setN8nError] = useState<string | null>(null)
  const [showVerdictModal, setShowVerdictModal] = useState(false)

  // 중복 제거된 테스트 케이스: input과 expectedOutput이 같은 테스트 케이스는 하나만 표시
  const uniqueTestCases = useMemo(() => {
    if (!session?.problem.testCases) return []
    
    const seen = new Set<string>()
    const unique: typeof session.problem.testCases = []
    
    for (const testCase of session.problem.testCases) {
      const key = `${testCase.input || ''}|${testCase.expectedOutput || ''}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(testCase)
      }
    }
    
    return unique
  }, [session?.problem.testCases])

  // 시간 측정 타이머
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - startTimeRef.current) / 1000) + pausedSeconds
        setElapsedSeconds(elapsed)
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [isTimerRunning, pausedSeconds])

  // 타이머 일시정지/재개
  const handleTimerToggle = () => {
    if (isTimerRunning) {
      // 일시정지
      setPausedSeconds(elapsedSeconds)
      setIsTimerRunning(false)
    } else {
      // 재개
      startTimeRef.current = Date.now()
      setIsTimerRunning(true)
    }
  }

  // 힌트 보기 핸들러
  const handleShowHint = () => {
    if (!hintUsed && !showHint) {
      // 첫 번째 클릭: 확인 메시지 표시
      setShowHintConfirm(true)
    } else {
      // 이미 힌트를 본 경우 또는 확인 후: 힌트 표시
      setShowHint(true)
      setShowHintConfirm(false)
    }
  }

  // 힌트 확인 핸들러
  const handleConfirmHint = () => {
    setHintUsed(true)
    setShowHint(true)
    setShowHintConfirm(false)
  }

  // 힌트 확인 취소 핸들러
  const handleCancelHint = () => {
    setShowHintConfirm(false)
  }

  // 세션 로드 및 코드 초기화
  useEffect(() => {
    const currentSessionId = params.sessionId

    // sessionId가 변경된 경우에만 초기화 플래그 리셋
    if (sessionIdRef.current !== currentSessionId) {
      initializedRef.current = false
      dummyDataUpdatedRef.current = false
      sessionIdRef.current = currentSessionId
      // 타이머 리셋
      setElapsedSeconds(0)
      setPausedSeconds(0)
      setIsTimerRunning(true)
      startTimeRef.current = Date.now()
      setHintUsed(false)
      setShowHint(false)
      setShowHintConfirm(false)
      setHints([])
      setSelfReportDifficulty(3)
      setN8nResponse(null)
      setN8nError(null)
      setHasSubmitted(false)
      setSubmittedCode('')
      setIsSubmitting(false)
    }

    // 이미 초기화되었으면 스킵
    if (initializedRef.current) {
      return
    }

    const loadedSession = getSession(currentSessionId)
    if (!loadedSession) {
      return
    }

    initializedRef.current = true

    // 더미 데이터 추가: 문제 설명이 없으면 추가 (한 번만)
    if (!loadedSession.problem.statement && !dummyDataUpdatedRef.current) {
      const sessionWithDummy = {
        ...loadedSession,
        problem: {
          ...loadedSession.problem,
          statement: `## 문제 설명

정수 배열 \`nums\`와 정수 \`target\`이 주어졌을 때, 배열에서 두 숫자를 더해 \`target\`이 되는 인덱스를 반환하세요.

각 입력은 정확히 하나의 해를 가지며, 같은 원소를 두 번 사용할 수 없습니다.

답은 어떤 순서로든 반환할 수 있습니다.

## 예제

**예제 1:**
\`\`\`
입력: nums = [2,7,11,15], target = 9
출력: [0,1]
설명: nums[0] + nums[1] == 9 이므로 [0, 1]을 반환합니다.
\`\`\`

**예제 2:**
\`\`\`
입력: nums = [3,2,4], target = 6
출력: [1,2]
\`\`\`

**예제 3:**
\`\`\`
입력: nums = [3,3], target = 6
출력: [0,1]
\`\`\`

## 제약 조건

- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- **정확히 하나의 해만 존재합니다.**

## 힌트

해시 테이블을 사용하면 O(n) 시간 복잡도로 해결할 수 있습니다.`,
          constraints: `- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9
- -10^9 <= target <= 10^9
- 정확히 하나의 해만 존재합니다.`,
        },
      }
      // 로컬 상태만 먼저 업데이트
      setSession(sessionWithDummy)
      setCodeLocal(sessionWithDummy.code || '')
      dummyDataUpdatedRef.current = true
      // updateSession을 다음 틱에 실행하여 초기 렌더링 루프 방지
      setTimeout(() => {
        if (!dummyDataUpdatedRef.current) return // 이미 처리되었으면 스킵
        updateSession(loadedSession.id, { problem: sessionWithDummy.problem })
      }, 0)
    } else {
      setSession(loadedSession)
      setCodeLocal(loadedSession.code || '')
    }

    // 힌트 로드
    if (loadedSession.problem.id) {
      getHints(loadedSession.problem.id).then(setHints).catch(() => {
        setHints([])
      })
    }
  }, [params.sessionId]) // getSession, updateSession은 의존성에서 제거

  // 코드 변경 시 debounced 저장
  const handleCodeChange = useCallback((value: string | undefined) => {
    const newCode = value || ''
    setCodeLocal(newCode)
    
    if (!session) return
    
    // 코드가 변경되면 제출 상태 리셋 (제출한 코드와 다를 경우)
    if (hasSubmitted && newCode.trim() !== submittedCode.trim()) {
      setHasSubmitted(false)
    }
    
    // 기존 timeout 취소
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // 500ms 후 저장
    saveTimeoutRef.current = setTimeout(() => {
      setCode(session.id, newCode)
      setSession((prev) => prev ? { ...prev, code: newCode } : undefined)
    }, 500)
  }, [session, setCode, hasSubmitted, submittedCode])

  // 언어 변경
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!session) return
    const newLanguage = e.target.value as Session['language']
    updateSession(session.id, { language: newLanguage })
    setSession((prev) => prev ? { ...prev, language: newLanguage } : undefined)
  }


  // n8n 페이로드 빌드 및 전송
  const sendToN8n = async (session: Session, code: string) => {
    if (!WEBHOOK_URL) {
      console.log('WEBHOOK_URL이 설정되지 않아 n8n으로 전송하지 않습니다.')
      return
    }

    setN8nError(null)
    setN8nResponse(null)

    // problemId는 문제 ID를 정수로 변환
    // session.problem.id가 숫자 문자열이면 정수로 변환, 아니면 0 사용
    const problemIdStr = session.problem.id || '0'
    const problemId = parseInt(problemIdStr, 10) || 0

    const payload: N8nPayload = {
      userId: 'test-user', // 고정값
      problemId: problemId,
      language: 'python', // 고정값 (요구사항)
      code: code.trim(),
      timeSpentMin: Math.floor(elapsedSeconds / 60), // 분 단위로 전달
      hintUsed: hintUsed,
      selfReportDifficulty: selfReportDifficulty,
    }

    try {
      // 디버깅: 요청 페이로드 로그
      console.log('n8n으로 전송하는 페이로드:', JSON.stringify(payload, null, 2))
      
      // 먼저 직접 웹훅 호출 시도
      let response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      // 디버깅: 응답 헤더 확인
      console.log('n8n 응답 상태:', response.status, response.statusText)
      console.log('n8n 응답 헤더:', Object.fromEntries(response.headers.entries()))

      // CORS 에러가 발생하면 API 라우트를 통해 재시도
      if (!response.ok) {
        const errorText = await response.text()
        console.error('n8n 응답 에러:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      // n8n이 204(No Content) 또는 빈 body로 성공을 반환하는 경우가 있어 허용
      if (response.status === 204) {
        setN8nResponse(null)
        console.log('n8n으로 전송 성공(204 No Content):', payload)
        return
      }

      // 응답 본문 확인
      const responseText = await response.text()
      console.log('n8n 응답 본문 길이:', responseText.length)
      console.log('n8n 응답 본문 (처음 500자):', responseText.substring(0, 500))
      
      if (!responseText || responseText.trim() === '') {
        setN8nResponse(null)
        console.warn('⚠️ n8n 응답이 비어있습니다(OK). status=', response.status)
        console.warn('⚠️ n8n 워크플로우가 응답을 제대로 반환하지 않는 것 같습니다. 워크플로우의 "Respond to Webhook" 노드를 확인해주세요.')
        setN8nError('n8n 서버가 빈 응답을 반환했습니다. 워크플로우 설정을 확인해주세요.')
        return
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON 파싱 실패:', parseError, '응답 본문:', responseText)
        throw new Error(`서버 응답을 파싱할 수 없습니다: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`)
      }

      const normalized = normalizeN8nResponse(data)
      setN8nResponse(normalized)
      console.log('n8n으로 전송 성공:', payload)
    } catch (error: any) {
      // CORS 에러 체크
      if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
        try {
          // API 라우트를 통해 재시도
          const proxyResponse = await fetch('/api/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })

          if (!proxyResponse.ok) {
            const errorText = await proxyResponse.text()
            throw new Error(`HTTP ${proxyResponse.status}: ${errorText}`)
          }

          // 프록시도 204/빈 body를 성공으로 취급
          if (proxyResponse.status === 204) {
            setN8nResponse(null)
            return
          }

          // 응답 본문 확인
          const proxyResponseText = await proxyResponse.text()
          if (!proxyResponseText || proxyResponseText.trim() === '') {
            setN8nResponse(null)
            return
          }

          let data
          try {
            data = JSON.parse(proxyResponseText)
          } catch (parseError) {
            console.error('JSON 파싱 실패:', parseError, '응답 본문:', proxyResponseText)
            throw new Error(`서버 응답을 파싱할 수 없습니다: ${parseError instanceof Error ? parseError.message : '알 수 없는 오류'}`)
          }

          const normalized = normalizeN8nResponse(data)
          setN8nResponse(normalized)
        } catch (proxyError: any) {
          console.error('프록시 요청 실패:', proxyError)
          setN8nError(`프록시 요청 실패: ${proxyError.message}`)
        }
      } else {
        console.error('n8n 전송 중 오류:', error)
        setN8nError(error.message || '요청 실패')
      }
    }
  }

  // Submit 버튼
  const handleSubmit = async () => {
    if (!session) return
    if (isSubmitting) return // 이미 제출 중이면 무시

    setIsSubmitting(true)
    setSubmitError(null)
    setN8nError(null)
    setN8nResponse(null)

    try {
      // n8n으로 데이터 전송
      await sendToN8n(session, code)
      
      const judgeResult = await submitToJudge(session)
      
      setJudgeResult(session.id, judgeResult)
      updateSession(session.id, { status: 'SUBMITTED' })
      const updatedSession = {
        ...session,
        judge: judgeResult,
        status: 'SUBMITTED' as const,
      }
      setSession(updatedSession)
      
      // 제출 완료 상태 저장
      setHasSubmitted(true)
      setSubmittedCode(code.trim())

      // 판정 결과로 스크롤
      setTimeout(() => {
        judgeResultRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '제출 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // QuickLog 저장 핸들러
  const handleQuickLogSave = (difficulty: number, result: 'success' | 'failure') => {
    if (!session) return
    setLog(session.id, difficulty, result)
    // 세션 상태는 store에서 자동으로 업데이트되므로 여기서는 업데이트하지 않음
    // 모달이 닫히면 자동으로 최신 세션 정보가 반영됨
  }

  // cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
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

          {/* 시간 측정기 및 체감 난이도 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
            {/* 시간 측정기 */}
            <Card className="px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">소요 시간:</span>
                <span className="text-sm font-mono text-text-primary">
                  {Math.floor(elapsedSeconds / 60)}분 {elapsedSeconds % 60}초
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTimerToggle}
                  className="text-xs"
                >
                  {isTimerRunning ? '일시정지' : '시작'}
                </Button>
              </div>
            </Card>

            {/* 체감 난이도 */}
            <Card className="px-4 py-2 flex-1 sm:flex-initial min-w-[200px]">
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary whitespace-nowrap">체감 난이도:</span>
                <div className="flex-1 flex items-center gap-2">
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={selfReportDifficulty}
                    onChange={(e) => setSelfReportDifficulty(parseInt(e.target.value, 10))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-text-primary min-w-[30px]">
                    {selfReportDifficulty}/5
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Editor Section */}
        <div className="space-y-4">
          {/* Language Selector + Editor + Problem Panel */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Editor Column */}
            <div className={cn('flex-1 min-w-0 flex flex-col', showProblemPanel && 'md:w-[calc(100%-400px)]')}>
              <Card className="p-0 overflow-hidden flex flex-col">
                <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-3 flex-shrink-0">
                  <Select
                    value={session.language}
                    onChange={handleLanguageChange}
                    className="w-auto min-w-[120px]"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProblemPanel(!showProblemPanel)}
                    className="text-xs"
                  >
                    {showProblemPanel ? '문제 숨기기' : '문제 보기'}
                  </Button>
                </div>
                <div className="h-[400px] md:h-[500px] w-full">
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
              
              {/* Submit Button - 항상 에디터 바로 아래 */}
              <div className="mt-4">
                <Button
                  variant={hasSubmitted ? "secondary" : "primary"}
                  size="md"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !code.trim()}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      제출 중...
                    </span>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </div>

            {/* Problem Panel - Desktop: Side panel, Mobile: Collapsible */}
            {showProblemPanel && (
              <div className={cn(
                'md:w-[380px] md:flex-shrink-0',
                'md:block',
                'md:sticky md:top-4 md:self-start',
                'md:max-h-[calc(100vh-2rem)] md:overflow-y-auto'
              )}>
                <Card className="h-full">
                  <div className="space-y-4">
                    {/* Problem Header */}
                    <div className="pb-4 border-b border-[rgba(255,255,255,0.06)]">
                      <h2 className="text-lg font-semibold text-text-primary mb-2">
                        {session.problem.title}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-xs font-medium', getPlatformColor(session.problem.platform))}>
                          {session.problem.platform}
                        </span>
                        <span className="text-text-muted text-xs">•</span>
                        <span className={cn('text-xs font-medium', getDifficultyColor(session.problem.difficulty))}>
                          {session.problem.difficulty}
                        </span>
                        {session.problem.tags.length > 0 && (
                          <>
                            <span className="text-text-muted text-xs">•</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {session.problem.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="muted" className="text-[10px] py-0 px-1.5 h-4">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Problem Statement */}
                    {session.problem.statement && (
                      <div className="text-sm text-text-muted leading-relaxed">
                        <pre className="whitespace-pre-wrap font-sans text-text-muted">
                          {session.problem.statement}
                        </pre>
                      </div>
                    )}

                    {/* Constraints */}
                    {session.problem.constraints && (
                      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                        <h3 className="text-sm font-medium text-text-primary mb-2">
                          제약 조건
                        </h3>
                        <pre className="text-xs text-text-muted font-mono whitespace-pre-wrap leading-relaxed">
                          {session.problem.constraints}
                        </pre>
                      </div>
                    )}

                    {/* Test Cases */}
                    {uniqueTestCases.length > 0 && (
                      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                        <h3 className="text-sm font-medium text-text-primary mb-3">
                          테스트 케이스
                        </h3>
                        <div className="space-y-3">
                          {uniqueTestCases.map((testCase, idx) => (
                            <div
                              key={testCase.testCaseId || idx}
                              className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-background-secondary/50 p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-text-secondary">
                                  테스트 케이스 {testCase.testCaseId || idx + 1}
                                </span>
                                {testCase.isHidden && (
                                  <Badge variant="muted" className="text-[10px] py-0 px-1.5 h-4">
                                    숨김
                                  </Badge>
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-medium text-text-secondary mb-1">입력</div>
                                <pre className="text-xs text-text-muted font-mono whitespace-pre-wrap bg-background-tertiary p-2 rounded border border-[rgba(255,255,255,0.04)]">
                                  {testCase.input || '(없음)'}
                                </pre>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-text-secondary mb-1">예상 출력</div>
                                <pre className="text-xs text-text-muted font-mono whitespace-pre-wrap bg-background-tertiary p-2 rounded border border-[rgba(255,255,255,0.04)]">
                                  {testCase.expectedOutput}
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 힌트 섹션 */}
                    <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-text-primary">
                          힌트
                        </h3>
                        {!showHint && !showHintConfirm && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleShowHint}
                            className="text-xs"
                          >
                            힌트 보기
                          </Button>
                        )}
                        {showHint && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowHint(false)}
                            className="text-xs"
                          >
                            힌트 숨기기
                          </Button>
                        )}
                      </div>
                      
                      {/* 확인 메시지 */}
                      {showHintConfirm && (
                        <div className="mt-2 p-4 rounded-[8px] bg-background-tertiary border border-accent/30">
                          <p className="text-sm text-text-primary mb-4 leading-relaxed">
                            정말 힌트를 보시겠습니까?
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleConfirmHint}
                              className="text-xs"
                            >
                              확인
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleCancelHint}
                              className="text-xs"
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* 힌트 내용 */}
                      {showHint && hints.length > 0 && (
                        <div className="mt-2 p-3 rounded-[8px] bg-background-tertiary border border-[rgba(255,255,255,0.06)]">
                          {hints.map((hint, index) => (
                            <p key={index} className="text-sm text-text-muted leading-relaxed mb-2 last:mb-0">
                              {hint}
                            </p>
                          ))}
                        </div>
                      )}
                      {showHint && hints.length === 0 && (
                        <div className="mt-2 p-3 rounded-[8px] bg-background-tertiary border border-[rgba(255,255,255,0.06)]">
                          <p className="text-sm text-text-muted leading-relaxed">
                            힌트를 불러오는 중...
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Mobile: Close button */}
                    <div className="md:hidden pt-4 border-t border-[rgba(255,255,255,0.06)]">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowProblemPanel(false)}
                        className="w-full"
                      >
                        닫기
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
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

          {/* n8n 웹훅 채점 결과 */}
          {n8nError && (
            <Card className="border-red-500/20 bg-red-500/5">
              <p className="text-sm text-red-400 font-medium mb-2">에러 발생</p>
              <p className="text-xs text-red-300">{n8nError}</p>
            </Card>
          )}

          {n8nResponse && (
            <Card className="pb-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-text-primary mb-2">채점 결과</h3>
                {/* 채점 결과가 실제 코드 실행 결과와 다를 수 있음을 알리는 경고 */}
                {session?.runOutput && (
                  <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-400">
                      💡 참고: 채점 결과는 AI가 분석한 결과입니다. 실제 코드 실행 결과와 다를 수 있으니, 
                      아래 "실제 코드 실행 결과" 섹션을 확인해주세요.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Summary Row - 결과, 이해도, 복습 일정 */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* 결과 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-secondary">결과</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-[6px] text-sm font-semibold',
                          n8nResponse.verdict === 'AC'
                            ? 'bg-green-500/20 text-green-400'
                            : n8nResponse.verdict === 'WA'
                            ? 'bg-red-500/20 text-red-400'
                            : n8nResponse.verdict === 'TLE'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : n8nResponse.verdict === 'MLE'
                            ? 'bg-orange-500/20 text-orange-400'
                            : n8nResponse.verdict === 'RE'
                            ? 'bg-purple-500/20 text-purple-400'
                            : n8nResponse.verdict === 'CE'
                            ? 'bg-pink-500/20 text-pink-400'
                            : 'bg-gray-500/20 text-gray-400'
                        )}
                      >
                        {VERDICT_INFO[n8nResponse.verdict] 
                          ? `${VERDICT_INFO[n8nResponse.verdict].abbreviation} (${VERDICT_INFO[n8nResponse.verdict].fullName})`
                          : n8nResponse.verdict}
                      </span>
                      {VERDICT_INFO[n8nResponse.verdict] && (
                        <button
                          onClick={() => setShowVerdictModal(true)}
                          className="w-5 h-5 rounded-full bg-background-tertiary border border-border hover:bg-background-secondary hover:border-accent/30 transition-colors flex items-center justify-center text-xs text-text-muted hover:text-text-secondary"
                          aria-label="판정 설명 보기"
                        >
                          ?
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 이해도 */}
                  {n8nResponse.understandingLevel && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-text-secondary">이해도</span>
                      <span
                        className={cn(
                          'px-3 py-1 rounded-[6px] text-sm font-semibold',
                          getUnderstandingBadgeStyle(n8nResponse.understandingLevel)
                        )}
                      >
                        {n8nResponse.understandingLevel}
                      </span>
                    </div>
                  )}

                  {/* 복습 일정 */}
                  {n8nResponse.reviewDays.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-text-secondary">복습 일정</span>
                      <div className="flex flex-wrap gap-1.5">
                        {n8nResponse.reviewDays.map((day, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded-[6px] text-xs font-medium bg-background-tertiary text-text-secondary border border-border"
                          >
                            D+{day}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Passed/Total - 세그먼트 타일 */}
                <div className="w-full md:w-1/2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-text-secondary">통과한 테스트</span>
                    <span className="text-sm text-text-primary">
                      {n8nResponse.passed} / {n8nResponse.total}
                    </span>
                  </div>
                  {n8nResponse.total > 0 && (
                    <div className="flex gap-1.5">
                      {Array.from({ length: n8nResponse.total }, (_, idx) => {
                        const isPassed = idx < n8nResponse.passed
                        return (
                          <div
                            key={idx}
                            className={cn(
                              'w-5 h-5 rounded-[4px] transition-all duration-300',
                              isPassed
                                ? 'bg-accent/30 border border-accent/40'
                                : 'bg-background-tertiary border border-border'
                            )}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 실제 출력과 예상 출력 비교 */}
                {(n8nResponse.actualOutput || n8nResponse.expectedOutput || session?.runOutput) && (
                  <div className="p-4 rounded-[8px] bg-background-secondary border border-[rgba(255,255,255,0.06)]">
                    <p className="text-xs font-medium text-text-secondary mb-3">실제 코드 실행 결과</p>
                    <div className="space-y-3">
                      {/* 실제 출력 */}
                      {(session?.runOutput || n8nResponse.actualOutput) && (
                        <div>
                          <p className="text-xs font-medium text-text-secondary mb-1.5">실제 출력</p>
                          <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap bg-background-tertiary p-3 rounded border border-[rgba(255,255,255,0.04)]">
                            {session?.runOutput || n8nResponse.actualOutput || '(없음)'}
                          </pre>
                        </div>
                      )}
                      {/* 예상 출력 */}
                      {n8nResponse.expectedOutput && (
                        <div>
                          <p className="text-xs font-medium text-text-secondary mb-1.5">예상 출력</p>
                          <pre className="text-sm text-text-primary font-mono whitespace-pre-wrap bg-background-tertiary p-3 rounded border border-[rgba(255,255,255,0.04)]">
                            {n8nResponse.expectedOutput}
                          </pre>
                        </div>
                      )}
                      {/* 불일치 경고 */}
                      {n8nResponse.actualOutput && n8nResponse.expectedOutput && 
                       n8nResponse.actualOutput.trim() !== n8nResponse.expectedOutput.trim() && (
                        <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500/20">
                          <p className="text-xs text-yellow-400">
                            ⚠️ 실제 출력과 예상 출력이 일치하지 않습니다. 코드를 다시 확인해주세요.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 테스트 케이스 상세 정보 */}
                {n8nResponse.testCaseDetails && n8nResponse.testCaseDetails.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-text-secondary">테스트 케이스 상세</p>
                    {n8nResponse.testCaseDetails.map((tc, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'p-3 rounded-[8px] border',
                          tc.passed === false
                            ? 'bg-red-500/5 border-red-500/20'
                            : tc.passed === true
                            ? 'bg-green-500/5 border-green-500/20'
                            : 'bg-background-secondary border-[rgba(255,255,255,0.06)]'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-text-secondary">
                            테스트 케이스 {idx + 1}
                          </span>
                          {tc.passed !== undefined && (
                            <span
                              className={cn(
                                'text-xs font-semibold px-2 py-0.5 rounded',
                                tc.passed
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              )}
                            >
                              {tc.passed ? '통과' : '실패'}
                            </span>
                          )}
                        </div>
                        {tc.input && (
                          <div className="mb-2">
                            <p className="text-xs text-text-muted mb-1">입력</p>
                            <pre className="text-xs font-mono text-text-primary bg-background-tertiary p-2 rounded">
                              {tc.input}
                            </pre>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {tc.expectedOutput && (
                            <div>
                              <p className="text-xs text-text-muted mb-1">예상 출력</p>
                              <pre className="text-xs font-mono text-text-primary bg-background-tertiary p-2 rounded">
                                {tc.expectedOutput}
                              </pre>
                            </div>
                          )}
                          {tc.actualOutput && (
                            <div>
                              <p className="text-xs text-text-muted mb-1">실제 출력</p>
                              <pre className="text-xs font-mono text-text-primary bg-background-tertiary p-2 rounded">
                                {tc.actualOutput}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hint Level 1 */}
                {n8nResponse.hintLevel1 && (
                  <div className="p-4 rounded-[8px] bg-accent/10 border border-accent/20">
                    <p className="text-xs font-medium text-accent mb-2">힌트</p>
                    <p className="text-sm text-text-primary whitespace-pre-wrap">{n8nResponse.hintLevel1}</p>
                    {/* 힌트가 실제 출력과 불일치할 수 있음을 알리는 경고 */}
                    {session?.runOutput && n8nResponse.hintLevel1.includes(session.runOutput) === false && (
                      <div className="mt-3 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-xs text-yellow-400">
                          💡 참고: 위 힌트는 채점 시스템의 분석 결과입니다. 실제 코드 실행 결과와 다를 수 있습니다.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Followup Questions */}
                {n8nResponse.followupQuestions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-text-secondary mb-3">추가 질문</p>
                    <ol className="list-decimal list-inside space-y-2">
                      {n8nResponse.followupQuestions.map((question, idx) => (
                        <li key={idx} className="text-sm text-text-primary pl-2">
                          {question}
                        </li>
                      ))}
                    </ol>
                    {/* 추가 질문이 실제 출력과 불일치할 수 있음을 알리는 경고 */}
                    {session?.runOutput && (
                      <div className="mt-3 p-2 rounded bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-blue-400">
                          💡 참고: 위 질문들은 채점 시스템의 분석 결과를 바탕으로 생성되었습니다. 
                          실제 코드 실행 결과({'"'}{session.runOutput.substring(0, 50)}{session.runOutput.length > 50 ? '...' : ''}{'"'})와 다를 수 있습니다.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 추천 문제 */}
                {(() => {
                  const currentProblemId = session?.problem.id ? parseInt(session.problem.id, 10) : null
                  const recommendation = currentProblemId ? RECOMMENDATION_DATA[currentProblemId] : null
                  
                  if (recommendation) {
                    return (
                      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                        <p className="text-sm font-medium text-text-secondary mb-3">추천 문제</p>
                        <div className="p-4 rounded-[8px] bg-background-secondary border border-[rgba(255,255,255,0.06)]">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                              <span className="text-xs font-semibold text-accent">
                                {recommendation.recommendationId}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-text-primary">
                                  문제 {recommendation.recommendationId}
                                </span>
                              </div>
                              <p className="text-sm text-text-muted leading-relaxed">
                                {recommendation.recommendationReason}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}

                {/* 문제 기록하기 버튼 */}
                <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setShowQuickLog(true)}
                    disabled={!session || session.loggedAt !== undefined}
                  >
                    문제 기록하기
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
      
      {/* Bottom spacing */}
      <div className="h-8 md:h-12" />

      {/* Quick Log Modal */}
      <QuickLogModal
        isOpen={showQuickLog}
        onClose={() => setShowQuickLog(false)}
        onSave={handleQuickLogSave}
        session={session}
      />

      {/* Verdict 설명 모달 */}
      {n8nResponse && VERDICT_INFO[n8nResponse.verdict] && (
        <Modal
          isOpen={showVerdictModal}
          onClose={() => setShowVerdictModal(false)}
          title={`${VERDICT_INFO[n8nResponse.verdict].abbreviation} - ${VERDICT_INFO[n8nResponse.verdict].fullName}`}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-background-tertiary border border-border">
              <p className="text-sm text-text-primary whitespace-pre-line leading-relaxed">
                {VERDICT_INFO[n8nResponse.verdict].description}
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowVerdictModal(false)}
              >
                확인
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
