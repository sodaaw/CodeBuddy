'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const BOJ_TIERS = [
  { value: '', label: '선택 안 함' },
  { value: 'b5', label: '브론즈 V' },
  { value: 'b4', label: '브론즈 IV' },
  { value: 'b3', label: '브론즈 III' },
  { value: 'b2', label: '브론즈 II' },
  { value: 'b1', label: '브론즈 I' },
  { value: 's5', label: '실버 V' },
  { value: 's4', label: '실버 IV' },
  { value: 's3', label: '실버 III' },
  { value: 's2', label: '실버 II' },
  { value: 's1', label: '실버 I' },
  { value: 'g5', label: '골드 V' },
  { value: 'g4', label: '골드 IV' },
  { value: 'g3', label: '골드 III' },
  { value: 'g2', label: '골드 II' },
  { value: 'g1', label: '골드 I' },
  { value: 'p5', label: '플래티넘 V' },
  { value: 'p4', label: '플래티넘 IV' },
  { value: 'p3', label: '플래티넘 III' },
  { value: 'p2', label: '플래티넘 II' },
  { value: 'p1', label: '플래티넘 I' },
  { value: 'd5', label: '다이아 V' },
  { value: 'd4', label: '다이아 IV' },
  { value: 'd3', label: '다이아 III' },
  { value: 'd2', label: '다이아 II' },
  { value: 'd1', label: '다이아 I' },
  { value: 'r5', label: '루비 V' },
  { value: 'r4', label: '루비 IV' },
  { value: 'r3', label: '루비 III' },
  { value: 'r2', label: '루비 II' },
  { value: 'r1', label: '루비 I' },
] as const

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  // 회원가입 전용
  const [nickname, setNickname] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [bojId, setBojId] = useState('')
  const [bojTier, setBojTier] = useState('')
  const [leetcodeId, setLeetcodeId] = useState('')
  const [programmersId, setProgrammersId] = useState('')

  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignUp && password !== passwordConfirm) {
      setPasswordMismatch(true)
      return
    }
    setPasswordMismatch(false)
    // 보여주기용 fake auth – 추가 필드는 저장하지 않음
    login(email, password)
    router.push('/home')
  }

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp)
    setPasswordMismatch(false)
    if (!isSignUp) {
      setNickname('')
      setPasswordConfirm('')
      setBojId('')
      setBojTier('')
      setLeetcodeId('')
      setProgrammersId('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className={cn('w-full', isSignUp ? 'max-w-lg' : 'max-w-md')}>
        <div className="mb-6 md:mb-8 text-center">
          <Link href="/" className="inline-block mb-4">
            <span className="text-xl font-medium text-text-primary">AlgoMemory</span>
          </Link>
          <h1
            className="text-2xl font-medium text-text-primary mb-2"
            style={{ letterSpacing: '-0.02em', fontWeight: 500 }}
          >
            {isSignUp ? '계정 만들기' : '돌아오신 것을 환영합니다'}
          </h1>
          <p className="text-sm text-text-muted">
            {isSignUp
              ? '코딩 연습 여정을 시작하세요'
              : '심사용 데모 환경입니다. 이메일과 비밀번호는 임의로 입력하시면 됩니다.'}
          </p>
        </div>

        <Card className="p-5 md:p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
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
                  onChange={(e) => {
                    setPassword(e.target.value)
                    const next = e.target.value
                    setPasswordMismatch(!!passwordConfirm && next !== passwordConfirm)
                  }}
                  required
                />
              </div>

              {isSignUp && (
                <>
                  <div>
                    <label htmlFor="passwordConfirm" className="block text-sm font-medium text-text-secondary mb-2">
                      비밀번호 확인
                    </label>
                    <Input
                      id="passwordConfirm"
                      type="password"
                      placeholder="비밀번호를 다시 입력하세요"
                      value={passwordConfirm}
                      onChange={(e) => {
                        const next = e.target.value
                        setPasswordConfirm(next)
                        setPasswordMismatch(!!next && password !== next)
                      }}
                      required
                      className={cn(passwordMismatch && 'border-red-500/50 focus:border-red-500')}
                    />
                    {passwordMismatch && (
                      <p className="mt-1.5 text-xs text-red-400">비밀번호가 일치하지 않아요.</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-text-secondary mb-2">
                      별명
                    </label>
                    <Input
                      id="nickname"
                      type="text"
                      placeholder="다른 사람에게 보일 이름"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      required
                    />
                  </div>

                  {/* 코딩 플랫폼 섹션 */}
                  <div className="mt-12 pt-8 pb-6 border-t border-[rgba(255,255,255,0.08)]">
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-text-primary mb-1.5">코딩 플랫폼 (선택)</h3>
                      <p className="text-xs text-text-muted">선택 입력이에요. 나중에 설정에서도 추가할 수 있어요.</p>
                    </div>
                    <div className="space-y-6">
                      {/* 백준 그룹 */}
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-3">백준</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="bojId" className="block text-xs text-text-secondary mb-2">
                              백준 아이디 (선택)
                            </label>
                            <Input
                              id="bojId"
                              type="text"
                              placeholder="acmicpc.net 아이디"
                              value={bojId}
                              onChange={(e) => setBojId(e.target.value)}
                            />
                          </div>
                          <div>
                            <label htmlFor="bojTier" className="block text-xs text-text-secondary mb-2">
                              백준 티어 (선택)
                            </label>
                            <Select
                              id="bojTier"
                              value={bojTier}
                              onChange={(e) => setBojTier(e.target.value)}
                            >
                              {BOJ_TIERS.map(({ value, label }) => (
                                <option key={value || 'none'} value={value}>
                                  {label}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* LeetCode */}
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-3">LeetCode</p>
                        <div>
                          <label htmlFor="leetcodeId" className="block text-xs text-text-secondary mb-2">
                            LeetCode 아이디 (선택)
                          </label>
                          <Input
                            id="leetcodeId"
                            type="text"
                            placeholder="leetcode.com/u/..."
                            value={leetcodeId}
                            onChange={(e) => setLeetcodeId(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Programmers */}
                      <div>
                        <p className="text-xs font-medium text-text-muted mb-3">Programmers</p>
                        <div>
                          <label htmlFor="programmersId" className="block text-xs text-text-secondary mb-2">
                            Programmers 아이디 (선택)
                          </label>
                          <Input
                            id="programmersId"
                            type="text"
                            placeholder="programmers.co.kr"
                            value={programmersId}
                            onChange={(e) => setProgrammersId(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-10">
              <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isSignUp && passwordMismatch}>
                {isSignUp ? '회원가입' : '로그인'}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={handleToggleMode}
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
