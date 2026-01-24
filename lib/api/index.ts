// API layer - returns mocked promises
// Future: replace with real n8n API calls

import type {
  Recommendation,
  ReviewItem,
  Question,
  Session,
} from '@/lib/mock/data'
import {
  todayRecommendations,
  reviewQueue,
  sampleQuestions,
  sampleSession,
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
export async function requestHint(
  problemId: string,
  step: number
): Promise<{ hint: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return {
    hint: `Hint for step ${step}: This is a placeholder hint. Future: n8n integration will provide real hints.`,
  }
}
