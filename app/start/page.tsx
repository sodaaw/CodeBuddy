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

// 테스트 케이스 데이터
const TEST_CASES: Record<string, Array<{ testCaseId: number; input: string; expectedOutput: string; isHidden: boolean }>> = {
  '1000': [{ testCaseId: 1, input: '1 2', expectedOutput: '3', isHidden: false }],
  '1001': [{ testCaseId: 1, input: '5 3', expectedOutput: '2', isHidden: false }],
  '1008': [{ testCaseId: 1, input: '1 3', expectedOutput: '0.3333333333', isHidden: false }],
  '2557': [{ testCaseId: 1, input: '', expectedOutput: 'Hello World!', isHidden: false }],
  '2438': [{ testCaseId: 1, input: '5', expectedOutput: '*\\n**\\n***\\n****\\n*****', isHidden: false }],
  '2439': [{ testCaseId: 1, input: '5', expectedOutput: '*\\n   **\\n  ***\\n ****\\n*****', isHidden: false }],
  '2739': [{ testCaseId: 1, input: '2', expectedOutput: '2 * 1 = 2\\n2 * 2 = 4\\n2 * 3 = 6\\n2 * 4 = 8\\n2 * 5 = 10\\n2 * 6 = 12\\n2 * 7 = 14\\n2 * 8 = 16\\n2 * 9 = 18', isHidden: false }],
  '2741': [{ testCaseId: 1, input: '5', expectedOutput: '1\\n2\\n3\\n4\\n5', isHidden: false }],
  '2742': [{ testCaseId: 1, input: '5', expectedOutput: '5\\n4\\n3\\n2\\n1', isHidden: false }],
  '2753': [{ testCaseId: 1, input: '2000', expectedOutput: '1', isHidden: false }],
  '2884': [{ testCaseId: 1, input: '10 10', expectedOutput: '9 25', isHidden: false }],
  '10869': [{ testCaseId: 1, input: '7 3', expectedOutput: '10\\n4\\n21\\n2\\n1', isHidden: false }],
  '10950': [{ testCaseId: 1, input: '2\\n1 1\\n2 3', expectedOutput: '2\\n5', isHidden: false }],
  '10951': [{ testCaseId: 1, input: '1 1\\n2 3\\n3 4', expectedOutput: '2\\n5\\n7', isHidden: false }],
  '10952': [{ testCaseId: 1, input: '1 1\\n2 2\\n0 0', expectedOutput: '2\\n4', isHidden: false }],
  '10998': [{ testCaseId: 1, input: '3 4', expectedOutput: '12', isHidden: false }],
  '11021': [{ testCaseId: 1, input: '2\\n1 1\\n2 3', expectedOutput: 'Case #1: 2\\nCase #2: 5', isHidden: false }],
  '11022': [{ testCaseId: 1, input: '2\\n1 1\\n2 3', expectedOutput: 'Case #1: 1 + 1 = 2\\nCase #2: 2 + 3 = 5', isHidden: false }],
  '14681': [{ testCaseId: 1, input: '12\\n5', expectedOutput: '1', isHidden: false }],
  '2525': [{ testCaseId: 1, input: '14 30\\n20', expectedOutput: '14 50', isHidden: false }],
  '25304': [{ testCaseId: 1, input: '260000\\n4\\n20000 5\\n30000 2\\n10000 6\\n5000 8', expectedOutput: 'Yes', isHidden: false }],
  '25314': [{ testCaseId: 1, input: '20', expectedOutput: 'long long long long long int', isHidden: false }],
  '2562': [{ testCaseId: 1, input: '3\\n29\\n38\\n12\\n57\\n74\\n40\\n85\\n61', expectedOutput: '85\\n8', isHidden: false }],
  '2577': [{ testCaseId: 1, input: '150\\n266\\n427', expectedOutput: '3\\n1\\n0\\n2\\n0\\n0\\n0\\n0\\n0\\n0', isHidden: false }],
  '2675': [{ testCaseId: 1, input: '2\\n3 ABC\\n5 /HTP', expectedOutput: 'AAABBBCCC\\n/////HHHHHTTTTTPPPPP', isHidden: false }],
  '2908': [{ testCaseId: 1, input: '734 893', expectedOutput: '437', isHidden: false }],
  '2920': [{ testCaseId: 1, input: '1 2 3 4 5 6 7 8', expectedOutput: 'ascending', isHidden: false }],
  '3052': [{ testCaseId: 1, input: '1\\n2\\n3\\n4\\n5\\n6\\n7\\n8\\n9\\n10', expectedOutput: '10', isHidden: false }],
  '8958': [{ testCaseId: 1, input: '2\\nOOXXOXXOOO\\nOOXXOOXXOO', expectedOutput: '10\\n9', isHidden: false }],
  '9498': [{ testCaseId: 1, input: '85', expectedOutput: 'B', isHidden: false }],
  '1065': [{ testCaseId: 1, input: '110', expectedOutput: '99', isHidden: false }],
  '10818': [{ testCaseId: 1, input: '5\\n20 10 35 30 7', expectedOutput: '7 35', isHidden: false }],
  '10871': [{ testCaseId: 1, input: '10 5\\n1 10 4 9 2 3 8 5 7 6', expectedOutput: '1 4 2 3', isHidden: false }],
  '1110': [{ testCaseId: 1, input: '26', expectedOutput: '4', isHidden: false }],
  '1152': [{ testCaseId: 1, input: 'Hello World', expectedOutput: '2', isHidden: false }],
  '1157': [{ testCaseId: 1, input: 'zZa', expectedOutput: 'Z', isHidden: false }],
  '11720': [{ testCaseId: 1, input: '5\\n54321', expectedOutput: '15', isHidden: false }],
  '1316': [{ testCaseId: 1, input: '3\\nhappy\\nnew\\nyear', expectedOutput: '3', isHidden: false }],
  '1546': [{ testCaseId: 1, input: '3\\n40 80 60', expectedOutput: '75', isHidden: false }],
  '1712': [{ testCaseId: 1, input: '1000 70 170', expectedOutput: '11', isHidden: false }],
  '2292': [{ testCaseId: 1, input: '13', expectedOutput: '3', isHidden: false }],
  '2775': [{ testCaseId: 1, input: '2\\n1\\n3\\n2\\n3', expectedOutput: '6\\n10', isHidden: false }],
  '2839': [{ testCaseId: 1, input: '18', expectedOutput: '4', isHidden: false }],
  '2869': [{ testCaseId: 1, input: '2002 1 5', expectedOutput: '4', isHidden: false }],
  '2941': [{ testCaseId: 1, input: 'ljes=njak', expectedOutput: '6', isHidden: false }],
  '4344': [{ testCaseId: 1, input: '1\\n5 50 50 70 80 100', expectedOutput: '40.00%', isHidden: false }],
  '5622': [{ testCaseId: 1, input: 'UNUCIC', expectedOutput: '36', isHidden: false }],
  '6064': [{ testCaseId: 1, input: '10 12 3 9', expectedOutput: '33', isHidden: false }],
  '9020': [{ testCaseId: 1, input: '1\\n8', expectedOutput: '3 5', isHidden: false }],
  '11654': [{ testCaseId: 1, input: 'A', expectedOutput: '65', isHidden: false }],
  '1193': [{ testCaseId: 1, input: '14', expectedOutput: '2/4', isHidden: false }],
  '1330': [{ testCaseId: 1, input: '1 2', expectedOutput: '<', isHidden: false }],
  '15829': [{ testCaseId: 1, input: '5\\nabcde', expectedOutput: '4739715', isHidden: false }],
}

// 더미 문제 리스트
const DUMMY_PROBLEMS: Problem[] = [
  {
    id: '1000',
    title: 'A+B',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/1000',
    statement: '두 정수 A와 B를 입력받아 A+B를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['1000'],
  },
  {
    id: '1001',
    title: 'A-B',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/1001',
    statement: '두 정수 A와 B를 입력받아 A-B를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['1001'],
  },
  {
    id: '1008',
    title: 'A/B',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/1008',
    statement: '두 정수 A와 B를 입력받아 A/B를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['1008'],
  },
  {
    id: '2557',
    title: 'Hello World',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/2557',
    statement: 'Hello World!를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2557'],
  },
  {
    id: '2438',
    title: '별 찍기 - 1',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/2438',
    statement: '첫째 줄부터 N번째 줄까지 별을 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2438'],
  },
  {
    id: '2439',
    title: '별 찍기 - 2',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/2439',
    statement: '오른쪽 정렬된 별을 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2439'],
  },
  {
    id: '2739',
    title: '구구단',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/2739',
    statement: 'N을 입력받아 구구단을 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2739'],
  },
  {
    id: '2741',
    title: 'N 찍기',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/2741',
    statement: '1부터 N까지 한 줄에 하나씩 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2741'],
  },
  {
    id: '2742',
    title: '기찍 N',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/2742',
    statement: 'N부터 1까지 한 줄에 하나씩 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2742'],
  },
  {
    id: '2753',
    title: '윤년',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/2753',
    statement: '윤년이면 1, 아니면 0을 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2753'],
  },
  {
    id: '2884',
    title: '알람 시계',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/2884',
    statement: '알람 시간을 45분 앞서는 시간으로 변경한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2884'],
  },
  {
    id: '10869',
    title: '사칙연산',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/10869',
    statement: '두 자연수 A와 B가 주어졌을 때 사칙연산 결과를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['10869'],
  },
  {
    id: '10950',
    title: 'A+B - 3',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/10950',
    statement: '여러 테스트 케이스에 대해 A+B를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['10950'],
  },
  {
    id: '10951',
    title: 'A+B - 4',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/10951',
    statement: '입력이 끝날 때까지 A+B를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['10951'],
  },
  {
    id: '10952',
    title: 'A+B - 5',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/10952',
    statement: '0 0이 입력될 때까지 A+B를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['10952'],
  },
  {
    id: '10998',
    title: 'A×B',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/10998',
    statement: '두 정수 A와 B를 입력받아 곱을 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['10998'],
  },
  {
    id: '11021',
    title: 'A+B - 7',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/11021',
    statement: '각 테스트 케이스마다 Case #x 형식으로 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['11021'],
  },
  {
    id: '11022',
    title: 'A+B - 8',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/11022',
    statement: '각 테스트 케이스마다 A+B 결과를 포함해 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['11022'],
  },
  {
    id: '14681',
    title: '사분면 고르기',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/14681',
    statement: '점의 좌표가 주어졌을 때 사분면을 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 512,
    testCases: TEST_CASES['14681'],
  },
  {
    id: '2525',
    title: '오븐 시계',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/2525',
    statement: '요리 시간을 고려해 종료 시각을 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2525'],
  },
  {
    id: '25304',
    title: '영수증',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/25304',
    statement: '구매한 물건들의 합이 영수증 총액과 같은지 확인한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 1024,
    testCases: TEST_CASES['25304'],
  },
  {
    id: '25314',
    title: '코딩은 체육과목 입니다',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/25314',
    statement: 'long int를 출력하는 문제이다.',
    timeLimitMs: 1000,
    memoryLimitMb: 1024,
    testCases: TEST_CASES['25314'],
  },
  {
    id: '2562',
    title: '최댓값',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/2562',
    statement: '주어진 수 중 최댓값과 그 위치를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2562'],
  },
  {
    id: '2577',
    title: '숫자의 개수',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/2577',
    statement: '세 수의 곱에 포함된 숫자의 개수를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2577'],
  },
  {
    id: '2675',
    title: '문자열 반복',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'string'],
    url: 'https://www.acmicpc.net/problem/2675',
    statement: '문자열의 각 문자를 R번 반복해 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2675'],
  },
  {
    id: '2908',
    title: '상수',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/2908',
    statement: '뒤집은 두 수 중 더 큰 수를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2908'],
  },
  {
    id: '2920',
    title: '음계',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/2920',
    statement: '주어진 음계가 ascending, descending, mixed인지 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2920'],
  },
  {
    id: '3052',
    title: '나머지',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/3052',
    statement: '서로 다른 나머지 값의 개수를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['3052'],
  },
  {
    id: '8958',
    title: 'OX퀴즈',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'string'],
    url: 'https://www.acmicpc.net/problem/8958',
    statement: 'OX퀴즈 점수를 계산한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['8958'],
  },
  {
    id: '9498',
    title: '시험 성적',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/9498',
    statement: '점수에 따라 등급을 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['9498'],
  },
  {
    id: '1065',
    title: '한수',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/1065',
    statement: '한수의 개수를 구하는 프로그램을 작성한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['1065'],
  },
  {
    id: '10818',
    title: '최소, 최대',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/10818',
    statement: '주어진 수들 중 최솟값과 최댓값을 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['10818'],
  },
  {
    id: '10871',
    title: 'X보다 작은 수',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/10871',
    statement: 'X보다 작은 수를 모두 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['10871'],
  },
  {
    id: '1110',
    title: '더하기 사이클',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/1110',
    statement: '주어진 수의 더하기 사이클 길이를 구한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['1110'],
  },
  {
    id: '1152',
    title: '단어의 개수',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['string'],
    url: 'https://www.acmicpc.net/problem/1152',
    statement: '문자열에 포함된 단어의 개수를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['1152'],
  },
  {
    id: '1157',
    title: '단어 공부',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['string'],
    url: 'https://www.acmicpc.net/problem/1157',
    statement: '가장 많이 사용된 알파벳을 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['1157'],
  },
  {
    id: '11720',
    title: '숫자의 합',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/11720',
    statement: '숫자의 합을 구한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['11720'],
  },
  {
    id: '1316',
    title: '그룹 단어 체커',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['string'],
    url: 'https://www.acmicpc.net/problem/1316',
    statement: '그룹 단어의 개수를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['1316'],
  },
  {
    id: '1546',
    title: '평균',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation', 'math'],
    url: 'https://www.acmicpc.net/problem/1546',
    statement: '점수를 조작해 새로운 평균을 구한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['1546'],
  },
  {
    id: '1712',
    title: '손익분기점',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['math'],
    url: 'https://www.acmicpc.net/problem/1712',
    statement: '손익분기점을 계산한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['1712'],
  },
  {
    id: '2292',
    title: '벌집',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['math'],
    url: 'https://www.acmicpc.net/problem/2292',
    statement: '벌집 중앙에서 N까지의 최소 거리를 구한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2292'],
  },
  {
    id: '2775',
    title: '부녀회장이 될테야',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['math', 'dp'],
    url: 'https://www.acmicpc.net/problem/2775',
    statement: '아파트 거주민 수를 계산한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2775'],
  },
  {
    id: '2839',
    title: '설탕 배달',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['greedy'],
    url: 'https://www.acmicpc.net/problem/2839',
    statement: '최소 봉지 수로 설탕을 배달한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2839'],
  },
  {
    id: '2869',
    title: '달팽이는 올라가고 싶다',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['math'],
    url: 'https://www.acmicpc.net/problem/2869',
    statement: '달팽이가 정상에 도달하는 날짜를 계산한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2869'],
  },
  {
    id: '2941',
    title: '크로아티아 알파벳',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['string'],
    url: 'https://www.acmicpc.net/problem/2941',
    statement: '크로아티아 알파벳의 개수를 센다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['2941'],
  },
  {
    id: '4344',
    title: '평균은 넘겠지',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['math'],
    url: 'https://www.acmicpc.net/problem/4344',
    statement: '평균을 넘는 학생의 비율을 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['4344'],
  },
  {
    id: '5622',
    title: '다이얼',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/5622',
    statement: '전화 다이얼 시간을 계산한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['5622'],
  },
  {
    id: '6064',
    title: '카잉 달력',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['math'],
    url: 'https://www.acmicpc.net/problem/6064',
    statement: '카잉 달력에서 주어진 해를 찾는다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['6064'],
  },
  {
    id: '9020',
    title: '골드바흐의 추측',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['math'],
    url: 'https://www.acmicpc.net/problem/9020',
    statement: '두 소수의 합으로 짝수를 표현한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 256,
    testCases: TEST_CASES['9020'],
  },
  {
    id: '11654',
    title: '아스키 코드',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/11654',
    statement: '문자의 아스키 코드를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['11654'],
  },
  {
    id: '1193',
    title: '분수찾기',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['math'],
    url: 'https://www.acmicpc.net/problem/1193',
    statement: 'N번째 분수를 구한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    testCases: TEST_CASES['1193'],
  },
  {
    id: '1330',
    title: '두 수 비교하기',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['implementation'],
    url: 'https://www.acmicpc.net/problem/1330',
    statement: '두 수를 비교해 결과를 출력한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 512,
    testCases: TEST_CASES['1330'],
  },
  {
    id: '15829',
    title: 'Hashing',
    platform: 'BOJ',
    difficulty: 'Easy',
    tags: ['string'],
    url: 'https://www.acmicpc.net/problem/15829',
    statement: '문자열 해시 값을 계산한다.',
    timeLimitMs: 1000,
    memoryLimitMb: 512,
    testCases: TEST_CASES['15829'],
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

type SearchState = 'idle' | 'loading' | 'success' | 'failure'

export default function StartPage() {
  const router = useRouter()
  const { createSession } = useSessionStore()
  const [urlInput, setUrlInput] = useState('')
  const [previewProblem, setPreviewProblem] = useState<Problem | null>(null)
  const [searchState, setSearchState] = useState<SearchState>('idle')

  // Extract problem number from input (e.g., "1920", "2178", "two-sum")
  const extractProblemNumber = (input: string): string | null => {
    const trimmed = input.trim()
    // Extract numbers from URL or plain number
    const numberMatch = trimmed.match(/\/(\d+)/) || trimmed.match(/^(\d+)$/)
    if (numberMatch) return numberMatch[1]
    
    // Extract slug from URL (e.g., "two-sum" from leetcode URL)
    const slugMatch = trimmed.match(/\/([^\/]+)\/?$/)
    if (slugMatch) return slugMatch[1]
    
    return null
  }

  // Search for problem in DUMMY_PROBLEMS by number or URL
  const searchProblem = async (input: string): Promise<Problem | null> => {
    const problemNumber = extractProblemNumber(input)
    if (!problemNumber) return null

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Search in DUMMY_PROBLEMS
    const found = DUMMY_PROBLEMS.find(problem => {
      if (!problem.url) return false
      const problemNum = extractProblemNumber(problem.url)
      return problemNum === problemNumber || problem.url.includes(problemNumber)
    })

    return found || null
  }

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    setSearchState('loading')
    setPreviewProblem(null)

    try {
      const problem = await searchProblem(urlInput.trim())
      
      if (problem) {
        setPreviewProblem(problem)
        setSearchState('success')
      } else {
        setSearchState('failure')
      }
    } catch (error) {
      setSearchState('failure')
    }
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

              {/* Loading state */}
              {searchState === 'loading' && (
                <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3 text-text-muted">
                      <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">문제를 찾는 중...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Success state: Preview */}
              {searchState === 'success' && previewProblem && (
                <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="mb-3">
                    <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                      미리보기
                    </span>
                  </div>
                  <Card variant="outlined" className="p-0 overflow-hidden">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-text-primary mb-1.5 truncate">
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
                      </div>
                      <Button
                        variant="secondary"
                        className="h-[36px] px-4 text-[13px] rounded-[8px] border-[rgba(255,255,255,0.06)] bg-background-tertiary hover:bg-accent hover:border-accent hover:text-white transition-all duration-200"
                        onClick={() => handleStartSession(previewProblem)}
                      >
                        시작
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* Failure state */}
              {searchState === 'failure' && (
                <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                  <div className="text-center py-6">
                    <div className="mb-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[rgba(53,192,130,0.12)] mb-3">
                        <svg className="w-6 h-6 text-[#35c082]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-base font-medium text-text-primary mb-2">
                      문제를 찾을 수 없어요
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed mb-6 max-w-md mx-auto">
                      해당 문제 번호에 맞는 문제가 존재하지 않아요.
                      <br />
                      문제 번호를 다시 확인하거나 직접 문제를 등록해 주세요.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => {
                          setUrlInput('')
                          setSearchState('idle')
                          setPreviewProblem(null)
                          // Focus on input after clearing
                          setTimeout(() => {
                            const input = document.querySelector('input[type="text"]') as HTMLInputElement
                            input?.focus()
                          }, 100)
                        }}
                        className="min-w-[160px]"
                      >
                        문제 번호 다시 입력
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => {
                          // Create a manual problem entry
                          const platform = inferPlatform(urlInput.trim())
                          const problemId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                          const manualProblem: Problem = {
                            id: problemId,
                            title: urlInput.trim(),
                            platform,
                            difficulty: 'Unknown',
                            tags: [],
                            url: urlInput.trim(),
                          }
                          handleStartSession(manualProblem)
                        }}
                        className="min-w-[160px]"
                      >
                        직접 문제 등록하기
                      </Button>
                    </div>
                  </div>
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
                  className="hover:border-[rgba(255,255,255,0.1)] transition-colors duration-150 p-4 flex flex-col justify-between min-h-[140px]"
                >
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-text-primary mb-2">
                        {problem.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
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
                          <Badge key={tag} variant="muted" className="text-[10px] py-0 px-1.5 h-4">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="secondary"
                      className="h-[34px] px-3.5 text-[13px] rounded-[8px] border-[rgba(255,255,255,0.06)] bg-background-tertiary hover:bg-accent hover:border-accent hover:text-white transition-all duration-200 shadow-none"
                      onClick={() => handleStartSession(problem)}
                    >
                      시작
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
