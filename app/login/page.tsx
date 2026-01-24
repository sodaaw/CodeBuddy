'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Fake auth - accept any input
    login(email, password)
    router.push('/home')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-4">
            <span className="text-xl font-medium text-text-primary">CodeBuddy</span>
          </Link>
          <h1 className="text-2xl font-medium text-text-primary mb-2" style={{ letterSpacing: '-0.2%', fontWeight: 500 }}>
            {isSignUp ? '계정 만들기' : '돌아오신 것을 환영합니다'}
          </h1>
          <p className="text-sm text-text-muted">
            {isSignUp
              ? '코딩 연습 여정을 시작하세요'
              : '(개발중)이메일/비번 아무거나 치면 로그인 가능'}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="예시@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" size="lg">
              {isSignUp ? '회원가입' : '로그인'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors duration-150"
            >
              {isSignUp ? (
                <>
                  이미 계정이 있으신가요? <span className="text-accent">로그인</span>
                </>
              ) : (
                <>
                  계정이 없으신가요? <span className="text-accent">회원가입</span>
                </>
              )}
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
