// Mock data types and sample data

export interface Recommendation {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
}

export interface ReviewItem {
  id: string
  sessionId: string
  question: string
  submittedAt: string
  status: 'pending' | 'reviewed'
}

export interface Question {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
}

export interface Session {
  id: string
  questions: Question[]
  startedAt: string
  completedAt?: string
  status: 'in-progress' | 'completed'
}

// Mock data
export const todayRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Two Sum',
    description: 'Find two numbers that add up to a target value',
    difficulty: 'easy',
    tags: ['array', 'hash-table'],
  },
  {
    id: '2',
    title: 'Binary Search',
    description: 'Implement binary search algorithm',
    difficulty: 'medium',
    tags: ['binary-search', 'array'],
  },
]

export const reviewQueue: ReviewItem[] = [
  {
    id: 'r1',
    sessionId: 's1',
    question: 'Two Sum',
    submittedAt: '2024-01-15T10:30:00Z',
    status: 'pending',
  },
  {
    id: 'r2',
    sessionId: 's2',
    question: 'Binary Search',
    submittedAt: '2024-01-15T09:15:00Z',
    status: 'pending',
  },
]

export const sampleQuestions: Question[] = [
  {
    id: 'q1',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    difficulty: 'easy',
    tags: ['array', 'hash-table'],
  },
  {
    id: 'q2',
    title: 'Binary Search',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums.',
    difficulty: 'medium',
    tags: ['binary-search', 'array'],
  },
]

export const sampleSession: Session = {
  id: 's1',
  questions: sampleQuestions,
  startedAt: '2024-01-15T10:00:00Z',
  status: 'in-progress',
}
