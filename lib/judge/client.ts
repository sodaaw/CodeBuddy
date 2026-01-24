import { JudgeResponseSchema, JudgeResponse, SafeJudgeResponse } from './schema'

export interface JudgePayload {
  sessionId: string
  problem: {
    id: string
    title: string
    platform: string
    difficulty: string
    tags: string[]
    url?: string
    statement?: string
    constraints?: string
  }
  language: string
  code: string
  userExplanation?: string
  runOutput?: string
}

export interface JudgeClient {
  judge(payload: JudgePayload): Promise<unknown>
}

export class MockJudgeClient implements JudgeClient {
  async judge(payload: JudgePayload): Promise<unknown> {
    // 간단한 휴리스틱 기반 판정
    const code = payload.code.trim()
    const codeLength = code.length
    const hasTodo = /TODO|todo|FIXME|fixme/.test(code)
    const forLoopMatches = (code.match(/\bfor\s*\(/g) || []).length
    
    let verdict: JudgeResponse['verdict']
    let confidence: number
    let reasons: string[]
    let edge_cases_to_test: string[]
    let time_complexity: string

    // 매우 짧은 코드 또는 TODO가 있으면 POSSIBLY_FAIL
    if (codeLength < 50 || hasTodo) {
      verdict = 'POSSIBLY_FAIL'
      confidence = 0.45 + Math.random() * 0.15 // 0.45 ~ 0.6
      reasons = [
        codeLength < 50 
          ? '코드가 너무 짧아 완전한 구현이 아닐 수 있습니다.'
          : '코드에 TODO나 미완성 부분이 있습니다.',
        '로직의 일부가 누락되었을 가능성이 있습니다.',
      ]
      edge_cases_to_test = [
        '빈 입력값 처리',
        '경계값 테스트',
        '예외 상황 처리',
      ]
      time_complexity = 'O(n) 또는 미정'
    }
    // 중첩된 for 루프가 2개 이상이면 TLE_RISK
    else if (forLoopMatches >= 2) {
      verdict = 'TLE_RISK'
      confidence = 0.5 + Math.random() * 0.2 // 0.5 ~ 0.7
      reasons = [
        '중첩된 반복문이 많아 시간 복잡도가 높을 수 있습니다.',
        '대규모 입력에서 시간 초과가 발생할 가능성이 있습니다.',
      ]
      edge_cases_to_test = [
        '큰 입력 크기 (n=10^5 이상)',
        '최악의 경우 입력',
        '반복문 중첩 깊이 확인',
      ]
      time_complexity = 'O(n²) 이상일 가능성'
    }
    // 그 외는 LIKELY_PASS
    else {
      verdict = 'LIKELY_PASS'
      confidence = 0.7 + Math.random() * 0.2 // 0.7 ~ 0.9
      reasons = [
        '코드 구조가 적절해 보입니다.',
        '기본적인 로직이 구현되어 있습니다.',
      ]
      edge_cases_to_test = [
        '경계값 테스트',
        '빈 입력 처리',
      ]
      time_complexity = 'O(n) 또는 O(n log n)'
    }

    const response: JudgeResponse = {
      verdict,
      confidence,
      reasons,
      edge_cases_to_test,
      time_complexity,
      next_actions: ['GO_CHECK'],
    }

    // 시뮬레이션을 위한 약간의 지연
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))

    return response
  }
}

export class N8nJudgeClient implements JudgeClient {
  private webhookUrl: string

  constructor(webhookUrl: string) {
    if (!webhookUrl) {
      throw new Error('Judge webhook not configured')
    }
    this.webhookUrl = webhookUrl
  }

  async judge(payload: JudgePayload): Promise<unknown> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Judge 요청 실패: ${response.status} ${errorText}`)
    }

    return await response.json()
  }
}

export function createJudgeClient(): JudgeClient {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_JUDGE === 'true'
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_JUDGE_WEBHOOK_URL

  if (useMock || !webhookUrl) {
    return new MockJudgeClient()
  }

  return new N8nJudgeClient(webhookUrl)
}

export function validateJudgeResponse(raw: unknown): JudgeResponse {
  const result = JudgeResponseSchema.safeParse(raw)
  
  if (result.success) {
    return result.data
  }

  console.warn('Judge response validation failed:', result.error)
  return SafeJudgeResponse
}
