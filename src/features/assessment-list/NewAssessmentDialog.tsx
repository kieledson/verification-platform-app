import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Select } from '@/design-system/components'
import * as assessmentsRepo from '@/db/repositories/assessments'
import { newId } from '@/lib/id'
import type { SiteRecord } from '@/db/schema'

const STANDARD_VERSION = 'shrimp-farm-v2.4'

export function NewAssessmentDialog({
  sites,
  onClose,
}: {
  sites: SiteRecord[]
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [siteId, setSiteId] = useState(sites[0]?.id ?? '')
  const [assessorType, setAssessorType] = useState<'Company' | 'Collaborator' | 'SGS'>('Company')
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    const site = sites.find((s) => s.id === siteId)
    if (!site) return
    setCreating(true)
    const record = await assessmentsRepo.createAssessment({
      id: newId(),
      farmSiteId: site.id,
      groupId: site.groupId,
      standardVersion: STANDARD_VERSION,
      assessorType,
    })
    onClose()
    navigate(`/assessments/${record.id}`)
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(1,44,76,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 900,
      }}
      onClick={onClose}
    >
      <Card
        elevation="md"
        padding="lg"
        style={{ width: 420 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 16px' }}>New assessment</h2>

        <Select
          label="Farm site"
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          options={sites.map((s) => ({ value: s.id, label: `${s.farmName} (${s.referenceCode})` }))}
        />

        <div style={{ marginTop: 12 }}>
          <Select
            label="Assessor type"
            value={assessorType}
            onChange={(e) => setAssessorType(e.target.value as typeof assessorType)}
            options={[
              { value: 'Company', label: 'Company' },
              { value: 'Collaborator', label: 'Collaborator' },
              { value: 'SGS', label: 'SGS' },
            ]}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void handleCreate()} disabled={!siteId || creating}>
            Start assessment
          </Button>
        </div>
      </Card>
    </div>
  )
}
