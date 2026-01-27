export type TestCase = {
  testCaseId: number
  input: string
  expectedOutput: string
  isHidden: boolean
}

export type Problem = {
  id: string
  title: string
  platform: string
  difficulty: string
  tags: string[]
  url?: string
  statement?: string
  constraints?: string
  testCases?: TestCase[]
  timeLimitMs?: number
  memoryLimitMb?: number
}

export type JudgeResult = {
  verdict: "PASS" | "FAIL" | "TLE_RISK" | "LIKELY_PASS" | "POSSIBLY_FAIL"
  confidence?: number
  reasons: string[]
  edge_cases?: string[] // deprecated, use edge_cases_to_test
  edge_cases_to_test?: string[]
  time_complexity?: string
  next_actions?: ("ASK_HINT" | "GO_CHECK")[]
  createdAt: string
}

export type UnderstandingLevel = "SURFACE" | "PARTIAL" | "FULL"

export type Session = {
  id: string
  createdAt: string
  updatedAt: string
  problem: Problem
  language: "javascript" | "typescript" | "python"
  code: string
  runOutput?: string
  judge?: JudgeResult
  understandingAnswers?: {
    q1: string
    q2: string
    q3: string
  }
  understandingLevel?: UnderstandingLevel
  reviewAt?: string // ISO date string
  reviewedAt?: string // ISO date string - when this review was completed
  status: "DRAFT" | "SUBMITTED" | "CHECKED" | "SCHEDULED"
  // Log information
  logDifficulty?: number // 1-5, user's perceived difficulty
  logResult?: 'success' | 'failure' // user's self-reported result
  loggedAt?: string // ISO date string - when the log was saved
}
