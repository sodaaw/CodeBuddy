import { UnderstandingLevel } from '@/lib/types/session'

/**
 * Computes the review date based on understanding level.
 * SURFACE: +1 day
 * PARTIAL: +3 days
 * FULL: +7 days (or +14 days if fullPlus14 is true)
 */
export function computeReviewAt(
  level: UnderstandingLevel,
  fullPlus14: boolean = false
): string {
  const now = new Date()
  const daysToAdd = 
    level === "SURFACE" ? 1 :
    level === "PARTIAL" ? 3 :
    fullPlus14 ? 14 : 7
  
  const reviewDate = new Date(now)
  reviewDate.setDate(reviewDate.getDate() + daysToAdd)
  
  return reviewDate.toISOString()
}
