import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, Input, Icon } from '@/design-system/components'
import { useProjectStore } from '@/state/projectStore'
import { newId } from '@/lib/id'

export function SiteEditorPage() {
  const { projectId, groupId, siteId } = useParams<{ projectId: string; groupId: string; siteId: string }>()
  const navigate = useNavigate()
  const isNew = siteId === 'new'
  const projects = useProjectStore((s) => s.projects)
  const siteGroups = useProjectStore((s) => s.siteGroups)
  const sites = useProjectStore((s) => s.sites)
  const loaded = useProjectStore((s) => s.loaded)
  const loadAll = useProjectStore((s) => s.loadAll)
  const createSite = useProjectStore((s) => s.createSite)
  const updateSite = useProjectStore((s) => s.updateSite)
  const deleteSite = useProjectStore((s) => s.deleteSite)

  useEffect(() => {
    if (!loaded) void loadAll()
  }, [loaded, loadAll])

  const group = siteGroups.find((g) => g.id === groupId)
  const project = projects.find((p) => p.id === projectId)
  const existing = useMemo(() => sites.find((s) => s.id === siteId), [sites, siteId])

  const [farmName, setFarmName] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState(0)
  const [lng, setLng] = useState(0)

  useEffect(() => {
    if (!existing) return
    setFarmName(existing.farmName)
    setReferenceCode(existing.referenceCode)
    setCountry(existing.country)
    setRegion(existing.region)
    setAddress(existing.address)
    setLat(existing.gps?.lat ?? 0)
    setLng(existing.gps?.lng ?? 0)
  }, [existing])

  if (!isNew && !existing && loaded) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Site not found.</div>
  }

  async function handleSave() {
    if (!groupId || !group) return
    const payload = {
      farmName,
      referenceCode,
      groupId,
      groupName: group.name,
      projectName: project?.name ?? '',
      country,
      region,
      address,
      gps: lat && lng ? { lat, lng, accuracy: 10, capturedAt: Date.now() } : null,
    }
    if (isNew) {
      const id = newId()
      await createSite({ id, ...payload })
    } else if (siteId) {
      await updateSite(siteId, payload)
    }
    navigate(`/projects/${projectId}/groups/${groupId}`)
  }

  return (
    <div style={{ padding: '22px 26px 30px', maxWidth: 640 }}>
      <button
        type="button"
        onClick={() => navigate(`/projects/${projectId}/groups/${groupId}`)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--ocean)', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 14 }}
      >
        <Icon name="arrow-left" size={14} /> Back to {group?.name ?? 'group'}
      </button>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, margin: '0 0 18px' }}>
        {isNew ? 'New site' : farmName || 'Edit site'}
      </h1>

      <Card padding="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Site name" required value={farmName} onChange={(e) => setFarmName(e.target.value)} />
          <Input label="Site ID" required value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} />
          <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
          <Input label="Region" value={region} onChange={(e) => setRegion(e.target.value)} />
          <Input label="Latitude" type="number" value={lat} onChange={(e) => setLat(Number(e.target.value))} />
          <Input label="Longitude" type="number" value={lng} onChange={(e) => setLng(Number(e.target.value))} />
        </div>
        <div style={{ marginTop: 16 }}>
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--gray-100)' }}>
          {!isNew && (
            <Button variant="danger" onClick={() => { void deleteSite(siteId!); navigate(`/projects/${projectId}/groups/${groupId}`) }}>
              Delete site
            </Button>
          )}
          <div style={{ flex: 1 }} />
          <Button variant="primary" onClick={() => void handleSave()} disabled={!farmName || !referenceCode}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  )
}
