import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Session, Problem, JudgeResult, UnderstandingLevel } from '@/lib/types/session'
import { computeReviewAt } from '@/lib/utils/review'

interface SessionStore {
  sessions: Record<string, Session>
  
  // Actions
  createSession: (problem: Problem) => string
  updateSession: (sessionId: string, patch: Partial<Omit<Session, 'id' | 'createdAt'>>) => void
  setCode: (sessionId: string, code: string) => void
  setJudgeResult: (sessionId: string, judgeResult: JudgeResult) => void
  setUnderstanding: (
    sessionId: string,
    answers: { q1: string; q2: string; q3: string },
    level: UnderstandingLevel,
    reviewAt?: string
  ) => void
  setLog: (sessionId: string, difficulty: number, result: 'success' | 'failure') => void
  
  // Selectors
  getSession: (id: string) => Session | undefined
  getDueReviews: (now?: Date) => Session[]
  getUnfinishedSessions: () => Session[]
  getTodayReviews: (now?: Date) => Session[]
  getUpcomingReviews: (now?: Date) => Session[]
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessions: {},

      createSession: (problem: Problem) => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const now = new Date().toISOString()
        
        const newSession: Session = {
          id: sessionId,
          createdAt: now,
          updatedAt: now,
          problem,
          language: "python",
          code: "",
          status: "DRAFT",
        }

        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: newSession,
          },
        }))

        return sessionId
      },

      updateSession: (sessionId: string, patch: Partial<Omit<Session, 'id' | 'createdAt' | 'problem'>>) => {
        set((state) => {
          const session = state.sessions[sessionId]
          if (!session) return state

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                ...patch,
                updatedAt: new Date().toISOString(),
              },
            },
          }
        })
      },

      setCode: (sessionId: string, code: string) => {
        get().updateSession(sessionId, { code })
      },

      setJudgeResult: (sessionId: string, judgeResult: JudgeResult) => {
        get().updateSession(sessionId, { judge: judgeResult })
      },

      setUnderstanding: (
        sessionId: string,
        answers: { q1: string; q2: string; q3: string },
        level: UnderstandingLevel,
        reviewAt?: string
      ) => {
        const computedReviewAt = reviewAt || computeReviewAt(level)
        get().updateSession(sessionId, {
          understandingAnswers: answers,
          understandingLevel: level,
          reviewAt: computedReviewAt,
          status: "SCHEDULED",
        })
      },

      setLog: (sessionId: string, difficulty: number, result: 'success' | 'failure') => {
        get().updateSession(sessionId, {
          logDifficulty: difficulty,
          logResult: result,
          loggedAt: new Date().toISOString(),
        })
      },

      getSession: (id: string) => {
        return get().sessions[id]
      },

      getDueReviews: (now: Date = new Date()) => {
        const sessions = Object.values(get().sessions)
        return sessions.filter((session) => {
          if (!session.reviewAt || session.status !== "SCHEDULED") {
            return false
          }
          const reviewDate = new Date(session.reviewAt)
          return reviewDate <= now
        })
      },

      getTodayReviews: (now: Date = new Date()) => {
        const sessions = Object.values(get().sessions)
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(now)
        todayEnd.setHours(23, 59, 59, 999)
        
        return sessions.filter((session) => {
          if (!session.reviewAt || session.status !== "SCHEDULED") {
            return false
          }
          const reviewDate = new Date(session.reviewAt)
          
          // reviewAt이 오늘 이전이거나 오늘인 경우
          if (reviewDate > todayEnd) {
            return false
          }
          
          // reviewedAt이 오늘 설정되어 있으면 제외
          if (session.reviewedAt) {
            const reviewedDate = new Date(session.reviewedAt)
            if (reviewedDate >= todayStart && reviewedDate <= todayEnd) {
              return false
            }
          }
          
          return true
        }).sort((a, b) => {
          // reviewAt이 빠른 순서대로 정렬
          const aDate = new Date(a.reviewAt!)
          const bDate = new Date(b.reviewAt!)
          return aDate.getTime() - bDate.getTime()
        })
      },

      getUpcomingReviews: (now: Date = new Date()) => {
        const sessions = Object.values(get().sessions)
        const todayEnd = new Date(now)
        todayEnd.setHours(23, 59, 59, 999)
        
        return sessions.filter((session) => {
          if (!session.reviewAt || session.status !== "SCHEDULED") {
            return false
          }
          const reviewDate = new Date(session.reviewAt)
          return reviewDate > todayEnd
        }).sort((a, b) => {
          // reviewAt이 빠른 순서대로 정렬
          const aDate = new Date(a.reviewAt!)
          const bDate = new Date(b.reviewAt!)
          return aDate.getTime() - bDate.getTime()
        })
      },

      getUnfinishedSessions: () => {
        const sessions = Object.values(get().sessions)
        return sessions.filter((session) => {
          return session.status === "DRAFT" || session.status === "SUBMITTED"
        })
      },
    }),
    {
      name: 'codebuddy-sessions-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
