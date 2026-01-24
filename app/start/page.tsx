'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSessionStore } from '@/lib/store/sessionStore'
import { Problem } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

// 더미 문제 리스트
const DUMMY_PROBLEMS: Problem[] = [
  {
    id: 'dummy-1',
    title: 'Two Sum',
    platform: 'LeetCode',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    url: 'https://leetcode.com/problems/two-sum/',
  },
  {
    id: 'dummy-2',
    title: 'Binary Search',
    platform: 'LeetCode',
    difficulty: 'Easy',
    tags: ['Array', 'Binary Search'],
    url: 'https://leetcode.com/problems/binary-search/',
  },
  {
    id: 'dummy-3',
    title: 'Valid Parentheses',
    platform: 'LeetCode',
    difficulty: 'Easy',
    tags: ['Stack', 'String'],
    url: 'https://leetcode.com/problems/valid-parentheses/',
  },
  {
    id: 'dummy-4',
    title: 'Merge Two Sorted Lists',
    platform: 'LeetCode',
    difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'],
    url: 'https://leetcode.com/problems/merge-two-sorted-lists/',
  },
  {
    id: 'dummy-5',
    title: 'Maximum Subarray',
    platform: 'LeetCode',
    difficulty: 'Medium',
    tags: ['Array', 'Divide and Conquer', 'DP'],
    url: 'https://leetcode.com/problems/maximum-subarray/',
  },
  {
    id: 'dummy-6',
    title: 'Climbing Stairs',
    platform: 'LeetCode',
    difficulty: 'Easy',
    tags: ['Math', 'DP', 'Memoization'],
    url: 'https://leetcode.com/problems/climbing-stairs/',
  },
  {
    id: 'dummy-7',
    title: 'Best Time to Buy and Sell Stock',
    platform: 'LeetCode',
    difficulty: 'Easy',
    tags: ['Array', 'DP'],
    url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
  },
  {
    id: 'dummy-8',
    title: 'Valid Anagram',
    platform: 'LeetCode',
    difficulty: 'Easy',
    tags: ['Hash Table', 'String', 'Sorting'],
    url: 'https://leetcode.com/problems/valid-anagram/',
  },
]

function inferPlatform(url: string): string {
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes('leetcode')) return 'LeetCode'
  if (lowerUrl.includes('boj') || lowerUrl.includes('acmicpc')) return 'BOJ'
  if (lowerUrl.includes('programmers')) return 'Programmers'
  return 'custom'
}

function getDifficultyColor(difficulty: string): string {
  const lower = difficulty.toLowerCase()
  if (lower === 'easy') return 'text-green-400'
  if (lower === 'medium') return 'text-yellow-400'
  if (lower === 'hard') return 'text-red-400'
  return 'text-text-muted'
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

export default function StartPage() {
  const router = useRouter()
  const { createSession } = useSessionStore()
  const [urlInput, setUrlInput] = useState('')
  const [previewProblem, setPreviewProblem] = useState<Problem | null>(null)

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    const platform = inferPlatform(urlInput)
    const problemId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const problem: Problem = {
      id: problemId,
      title: '불러온 문제',
      platform,
      difficulty: 'Unknown',
      tags: [],
      url: urlInput.trim(),
    }

    setPreviewProblem(problem)
  }

  const handleStartSession = (problem: Problem) => {
    const sessionId = createSession(problem)
    router.push(`/solve/${sessionId}`)
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="mb-2">
            <Link 
              href="/home"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150 inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              홈
            </Link>
          </div>
          <h1 
            className="text-3xl sm:text-4xl md:text-5xl font-semibold text-text-primary mb-3"
            style={{ letterSpacing: '-0.02em', fontWeight: 600 }}
          >
            세션 시작하기
          </h1>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed">
            문제 하나를 선택하세요. 기억에 오래 남도록 도와드릴게요.
          </p>
        </div>

        <div className="space-y-10">
          {/* Section A: Load by URL/ID */}
          <div>
            <div className="mb-4">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                URL/ID로 불러오기
              </span>
            </div>
            <Card>
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="문제 URL 또는 ID를 입력하세요"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button type="submit" variant="secondary" size="md" className="w-full sm:w-auto">
                  불러오기
                </Button>
              </form>

              {previewProblem && (
                <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="mb-3">
                    <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                      미리보기
                    </span>
                  </div>
                  <Card variant="outlined" className="space-y-3">
                    <div>
                      <h3 className="text-base font-medium text-text-primary mb-2">
                        {previewProblem.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-xs font-medium', getPlatformColor(previewProblem.platform))}>
                          {previewProblem.platform}
                        </span>
                        <span className="text-text-muted text-xs">•</span>
                        <span className={cn('text-xs font-medium', getDifficultyColor(previewProblem.difficulty))}>
                          {previewProblem.difficulty}
                        </span>
                      </div>
                      {previewProblem.url && (
                        <div className="mt-2">
                          <a
                            href={previewProblem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:text-accent-hover inline-flex items-center gap-1.5 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            {previewProblem.url}
                          </a>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      onClick={() => handleStartSession(previewProblem)}
                    >
                      세션 시작하기
                    </Button>
                  </Card>
                </div>
              )}
            </Card>
          </div>

          {/* Section B: Pick from dummy list */}
          <div>
            <div className="mb-4">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                목록에서 선택하기
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DUMMY_PROBLEMS.map((problem) => (
                <Card
                  key={problem.id}
                  className="hover:border-[rgba(255,255,255,0.1)] transition-colors duration-150"
                >
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-text-primary mb-2">
                        {problem.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={cn('text-xs font-medium', getPlatformColor(problem.platform))}>
                          {problem.platform}
                        </span>
                        <span className="text-text-muted text-xs">•</span>
                        <span className={cn('text-xs font-medium', getDifficultyColor(problem.difficulty))}>
                          {problem.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {problem.tags.map((tag) => (
                          <Badge key={tag} variant="muted" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {problem.url && (
                        <div className="mt-2">
                          <a
                            href={problem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-text-muted hover:text-text-secondary inline-flex items-center gap-1.5 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            문제 보기
                          </a>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      onClick={() => handleStartSession(problem)}
                    >
                      세션 시작하기
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
