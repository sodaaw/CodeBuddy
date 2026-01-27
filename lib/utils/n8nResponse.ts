/**
 * n8n 웹훅 응답 정규화 함수
 * 다양한 형태의 응답을 일관된 형태로 변환합니다.
 */

export interface NormalizedN8nResponse {
  verdict: string
  passed: number
  total: number
  understandingLevel: string | null
  needsReview: boolean
  reviewDays: number[]
  hintLevel1: string | null
  followupQuestions: string[]
  actualOutput?: string | null
  expectedOutput?: string | null
  testCaseDetails?: Array<{
    input?: string
    expectedOutput?: string
    actualOutput?: string
    passed?: boolean
  }>
}

/**
 * n8n 웹훅 응답을 정규화합니다.
 */
export function normalizeN8nResponse(raw: any): NormalizedN8nResponse {
  // understandingLevel 정규화
  const understandingLevel =
    raw.understandingLevel || raw.understandingLeve1 || null

  // hintLevel1 정규화
  const hintLevel1 = raw.hintLevel1 || raw.hintLeve11 || null

  // reviewDays 정규화
  let reviewDays: number[] = []
  if (raw.reviewDays) {
    if (Array.isArray(raw.reviewDays)) {
      reviewDays = raw.reviewDays.map((d: any) => Number(d)).filter((n: number) => !isNaN(n))
    } else if (typeof raw.reviewDays === 'string') {
      try {
        const parsed = JSON.parse(raw.reviewDays)
        if (Array.isArray(parsed)) {
          reviewDays = parsed.map((d: any) => Number(d)).filter((n: number) => !isNaN(n))
        }
      } catch {
        // JSON 파싱 실패 시 빈 배열
        reviewDays = []
      }
    }
  }

  // followupQuestions 정규화
  let followupQuestions: string[] = []
  if (raw.followupQuestions) {
    if (Array.isArray(raw.followupQuestions)) {
      followupQuestions = raw.followupQuestions.map((q: any) => String(q).trim()).filter((q: string) => q.length > 0)
    } else if (typeof raw.followupQuestions === 'string') {
      const str = raw.followupQuestions.trim()
      // JSON 문자열인지 확인 (시작이 [이면 시도)
      if (str.startsWith('[')) {
        try {
          // 완전한 JSON 문자열인 경우
          if (str.endsWith(']')) {
            const parsed = JSON.parse(str)
            if (Array.isArray(parsed)) {
              followupQuestions = parsed.map((q: any) => String(q).trim()).filter((q: string) => q.length > 0)
            }
          } else {
            // 불완전한 JSON 문자열인 경우 (끝이 잘림) - 수동으로 파싱 시도
            // 예: "[\"질문1\",\"질문2" -> ["질문1", "질문2"]로 변환
            try {
              // 닫는 대괄호와 따옴표를 추가해서 파싱 시도
              const fixedStr = str + '"]'
              const parsed = JSON.parse(fixedStr)
              if (Array.isArray(parsed)) {
                followupQuestions = parsed.map((q: any) => String(q).trim()).filter((q: string) => q.length > 0)
              }
            } catch {
              // 수정해도 파싱 실패 시, 정규식으로 추출 시도
              const matches = str.match(/"([^"]+)"/g)
              if (matches && matches.length > 0) {
                followupQuestions = matches.map((m: string) => m.replace(/^"|"$/g, '').trim()).filter((q: string) => q.length > 0)
              }
            }
          }
        } catch {
          // JSON 파싱 실패 시 다른 방법 시도
        }
      }
      
      // JSON 파싱이 실패했거나 배열이 아닌 경우, 구분자로 분리 시도
      if (followupQuestions.length === 0) {
        // 파이프(|)로 분리 시도
        const pipeSplit = str.split('|').map((q: string) => q.trim()).filter((q: string) => q.length > 0)
        if (pipeSplit.length > 1) {
          followupQuestions = pipeSplit
        } else {
          // 쉼표로 분리 시도 (JSON 문자열 내부의 쉼표는 이미 처리됨)
          const commaSplit = str.split(',').map((q: string) => q.trim().replace(/^["'\[\]\s]+|["'\[\]\s]+$/g, '')).filter((q: string) => q.length > 0)
          if (commaSplit.length > 1) {
            followupQuestions = commaSplit
          } else {
            // 최종 폴백: 전체 문자열을 하나의 질문으로 (JSON 형식 제거)
            const cleaned = str.replace(/^\[|\]$/g, '').replace(/^"|"$/g, '').trim()
            followupQuestions = cleaned ? [cleaned] : [str]
          }
        }
      }
    }
  }

  // actualOutput, expectedOutput 정규화
  const actualOutput = raw.actualOutput || raw.actual_output || raw.output || null
  const expectedOutput = raw.expectedOutput || raw.expected_output || null
  
  // testCaseDetails 정규화
  let testCaseDetails: NormalizedN8nResponse['testCaseDetails'] = undefined
  if (raw.testCaseDetails || raw.test_case_details || raw.testCases || raw.test_cases) {
    const details = raw.testCaseDetails || raw.test_case_details || raw.testCases || raw.test_cases
    if (Array.isArray(details)) {
      testCaseDetails = details.map((tc: any) => ({
        input: tc.input || null,
        expectedOutput: tc.expectedOutput || tc.expected_output || null,
        actualOutput: tc.actualOutput || tc.actual_output || tc.output || null,
        passed: tc.passed !== undefined ? Boolean(tc.passed) : undefined,
      }))
    }
  }

  return {
    verdict: String(raw.verdict || ''),
    passed: Number(raw.passed) || 0,
    total: Number(raw.total) || 0,
    understandingLevel,
    needsReview: Boolean(raw.needsReview),
    reviewDays,
    hintLevel1,
    followupQuestions,
    actualOutput: actualOutput ? String(actualOutput) : null,
    expectedOutput: expectedOutput ? String(expectedOutput) : null,
    testCaseDetails,
  }
}
