import { z } from 'zod'

export const JudgeResponseSchema = z.object({
  verdict: z.enum(['LIKELY_PASS', 'POSSIBLY_FAIL', 'TLE_RISK']),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()).min(2).max(3),
  edge_cases_to_test: z.array(z.string()).min(2).max(4),
  time_complexity: z.string(),
  next_actions: z.array(z.enum(['ASK_HINT', 'GO_CHECK'])).min(1),
})

export type JudgeResponse = z.infer<typeof JudgeResponseSchema>

export const SafeJudgeResponse: JudgeResponse = {
  verdict: 'POSSIBLY_FAIL' as const,
  confidence: 0.5,
  reasons: ['Could not parse judge response.', 'Try submitting again.'],
  edge_cases_to_test: ['Try boundary inputs', 'Try empty / minimal cases'],
  time_complexity: 'Unknown',
  next_actions: ['GO_CHECK'],
}
