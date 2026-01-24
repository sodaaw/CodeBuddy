// Mock data types and sample data

export interface Recommendation {
  id: string
  title: string
  description: string
  platform: 'BOJ' | 'LeetCode' | 'Programmers'
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  reason: string
}

export interface ReviewItem {
  id: string
  sessionId: string
  question: string
  problemTitle: string
  platform: 'BOJ' | 'LeetCode' | 'Programmers'
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  submittedAt: string
  status: 'pending' | 'reviewed'
  summary?: string
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

export interface CheckQuestion {
  id: string
  text: string
}

export interface CheckResult {
  level: 'complete' | 'partial' | 'surface'
  feedback: string
}

// Mock data
export const todayRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Two Sum',
    description: 'Find two numbers that add up to a target value',
    platform: 'LeetCode',
    difficulty: 'easy',
    tags: ['array', 'hash-table'],
    reason: 'Reinforces hash table lookup patterns',
  },
  {
    id: '2',
    title: 'Binary Search',
    description: 'Implement binary search algorithm',
    platform: 'LeetCode',
    difficulty: 'medium',
    tags: ['binary-search', 'array'],
    reason: 'Reinforces BFS traversal patterns',
  },
  {
    id: '3',
    title: '가장 긴 증가하는 부분 수열',
    description: 'Longest Increasing Subsequence',
    platform: 'BOJ',
    difficulty: 'medium',
    tags: ['dp', 'binary-search'],
    reason: 'Builds on dynamic programming fundamentals',
  },
]

export const reviewQueue: ReviewItem[] = [
  {
    id: 'r1',
    sessionId: 's1',
    question: 'Two Sum',
    problemTitle: 'Two Sum',
    platform: 'LeetCode',
    difficulty: 'easy',
    tags: ['배열', '해시 테이블'],
    submittedAt: '2024-01-15T10:30:00Z',
    status: 'pending',
    summary: '주어진 배열에서 두 수의 합이 목표값이 되는 인덱스를 찾는 문제입니다. 해시 테이블을 사용하여 각 숫자와 그 인덱스를 저장하고, 목표값에서 현재 숫자를 뺀 값이 해시 테이블에 있는지 확인하는 방식으로 O(n) 시간 복잡도로 해결할 수 있습니다.',
  },
  {
    id: 'r2',
    sessionId: 's2',
    question: 'Binary Search',
    problemTitle: 'Binary Search',
    platform: 'LeetCode',
    difficulty: 'medium',
    tags: ['이진 탐색', '배열'],
    submittedAt: '2024-01-15T09:15:00Z',
    status: 'pending',
    summary: '정렬된 배열에서 특정 값을 찾는 이진 탐색 알고리즘입니다. 배열의 중간값을 기준으로 탐색 범위를 절반씩 줄여가며 O(log n) 시간 복잡도로 해결할 수 있습니다. 왼쪽과 오른쪽 포인터를 사용하여 범위를 좁혀가는 방식으로 구현합니다.',
  },
  {
    id: 'r3',
    sessionId: 's3',
    question: '가장 긴 증가하는 부분 수열',
    problemTitle: '가장 긴 증가하는 부분 수열',
    platform: 'BOJ',
    difficulty: 'medium',
    tags: ['DP', '이진 탐색'],
    submittedAt: '2024-01-14T15:20:00Z',
    status: 'pending',
    summary: '주어진 수열에서 가장 긴 증가하는 부분 수열의 길이를 찾는 문제입니다. 동적 프로그래밍을 사용하여 각 위치에서 끝나는 가장 긴 증가하는 부분 수열의 길이를 저장하고, 이진 탐색을 활용하여 O(n log n) 시간 복잡도로 최적화할 수 있습니다.',
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

export const sampleCheckQuestions: CheckQuestion[] = [
  {
    id: 'cq1',
    text: '이 문제를 해결하기 위해 어떤 접근 방식을 사용했나요? 핵심 아이디어를 설명해주세요.',
  },
  {
    id: 'cq2',
    text: '알고리즘의 시간 복잡도와 공간 복잡도는 각각 얼마인가요? 왜 그런지 설명해주세요.',
  },
  {
    id: 'cq3',
    text: '이 문제에서 주의해야 할 예외 상황이나 엣지 케이스가 있다면 무엇인가요?',
  },
  {
    id: 'cq4',
    text: '비슷한 유형의 문제를 만났을 때 이 풀이 방식을 어떻게 적용할 수 있을까요?',
  },
]
