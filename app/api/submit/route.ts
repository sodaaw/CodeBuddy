import { NextRequest, NextResponse } from 'next/server'

const WEBHOOK_URL = 'https://primary-production-b57a.up.railway.app/webhook/submit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 필수 필드 검증
    if (!body.code || typeof body.code !== 'string' || !body.code.trim()) {
      return NextResponse.json(
        { error: '코드는 필수이며 비어있을 수 없습니다.' },
        { status: 400 }
      )
    }

    // n8n 웹훅으로 요청 전달
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: body.userId || 'test-user',
        problemId: parseInt(String(body.problemId), 10) || 1000,
        language: 'python',
        code: body.code.trim(),
        timeSpentMin: parseInt(String(body.timeSpentMin), 10) || 10,
        hintUsed: Boolean(body.hintUsed),
        selfReportDifficulty: parseInt(String(body.selfReportDifficulty), 10) || 3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `웹훅 요청 실패: HTTP ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('API 라우트 에러:', error)
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.', details: error.message },
      { status: 500 }
    )
  }
}
