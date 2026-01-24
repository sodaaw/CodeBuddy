'use client'

import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

interface CheckPageProps {
  params: {
    sessionId: string
  }
}

export default function CheckPage({ params }: CheckPageProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-12">
          <PageHeader
            title={`Session ${params.sessionId}`}
            description="Review your session"
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
