'use client'

import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

export default function ReportPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
          <PageHeader
            title="Report"
            description="Analytics and progress reports"
            action={<Badge variant="muted">Coming Soon</Badge>}
          />
          
          <div className="space-y-4">
            <Card>
              <p className="text-text-muted text-sm">
                Content will be implemented later
              </p>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
