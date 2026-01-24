// API layer - returns mocked promises
// Future: replace with real n8n API calls

import type {
  Recommendation,
  ReviewItem,
  Question,
  Session,
  CheckQuestion,
  CheckResult,
} from '@/lib/mock/data'
import {
  todayRecommendations,
  reviewQueue,
  sampleQuestions,
  sampleSession,
  sampleCheckQuestions,
} from '@/lib/mock/data'

// Today's recommendations
export async function getToday(): Promise<Recommendation[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  return todayRecommendations
}

// Session management
export async function createSession(): Promise<Session> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return {
    ...sampleSession,
    id: `s${Date.now()}`,
    startedAt: new Date().toISOString(),
  }
}

export async function getSessionQuestions(sessionId: string): Promise<Question[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return sampleQuestions
}

export async function submitSessionAnswers(
  sessionId: string,
  answers: Record<string, string>
): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { success: true }
}

// Review management
export async function getReviews(): Promise<ReviewItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return reviewQueue
}

export async function submitReviewResult(
  reviewId: string,
  result: { passed: boolean; feedback?: string }
): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { success: true }
}

// Hint system
export async function getHints(problemId: string): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  // Return 3 hints for demo
  return [
    '해시 테이블을 사용하면 각 숫자를 한 번만 순회하면서 목표값을 찾을 수 있어요.',
    '목표값에서 현재 숫자를 뺀 값이 이미 해시 테이블에 있는지 확인해보세요.',
    '시간 복잡도를 O(n²)에서 O(n)으로 줄이기 위해 공간 복잡도 O(n)을 사용하는 트레이드오프를 고려해보세요.',
  ]
}

// Understanding check
export async function getCheckQuestions(sessionId: string): Promise<CheckQuestion[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  // Return 2-4 random questions
  const shuffled = [...sampleCheckQuestions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.floor(Math.random() * 3) + 2) // 2-4 questions
}

export async function submitCheckAnswers(
  sessionId: string,
  answers: Record<string, string>
): Promise<CheckResult> {
  await new Promise((resolve) => setTimeout(resolve, 1200))
  
  // Random result for demo
  const results: CheckResult[] = [
    {
      level: 'complete',
      feedback: '접근 방식과 시간 복잡도 분석이 명확하고, 예외 상황까지 잘 고려했어요.',
    },
    {
      level: 'partial',
      feedback: '접근 방식은 잘 설명했지만, 예외 상황에 대한 설명이 부족해요.',
    },
    {
      level: 'surface',
      feedback: '기본적인 풀이 흐름은 이해하고 있지만, 알고리즘의 핵심 원리를 더 깊이 이해할 필요가 있어요.',
    },
  ]
  
  return results[Math.floor(Math.random() * results.length)]
}
