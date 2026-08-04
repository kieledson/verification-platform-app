import { db, type SiteRecord } from '@/db/schema'

/**
 * Synthetic demo data only — matches the content rule that all sample data
 * must be synthetic even though production farm names are real individuals'
 * names. Reuses the same synthetic names/IDs shown in the design prototype's
 * own screenshots (VN-TV-0421 "Ao Tôm Bảy Hùng", etc.), which are already
 * confirmed synthetic there.
 */
const SEED_SITES: SiteRecord[] = [
  {
    id: 'site-vn-tv-0421',
    referenceCode: 'VN-TV-0421',
    farmName: 'Ao Tôm Bảy Hùng',
    groupId: 'group-ms-g01-2026',
    groupName: 'MS G01-2026',
    projectName: 'Minh Phu Delta Programme',
    country: 'Vietnam',
    region: 'Trà Vinh · Cầu Ngang',
    address: 'Hamlet 4, Mỹ Long Nam, Cầu Ngang district',
    gps: { lat: 9.74168, lng: 106.34544, accuracy: 8, capturedAt: Date.now() },
  },
  {
    id: 'site-vn-tv-0418',
    referenceCode: 'VN-TV-0418',
    farmName: 'Ao Tôm Minh Sáng',
    groupId: 'group-ms-g01-2026',
    groupName: 'MS G01-2026',
    projectName: 'Minh Phu Delta Programme',
    country: 'Vietnam',
    region: 'Trà Vinh · Cầu Ngang',
    address: 'Hamlet 2, Mỹ Long Nam, Cầu Ngang district',
    gps: { lat: 9.7501, lng: 106.3502, accuracy: 9, capturedAt: Date.now() },
  },
  {
    id: 'site-vn-bt-0102',
    referenceCode: 'VN-BT-0102',
    farmName: 'Ao Tôm Bến Tre Hai',
    groupId: 'group-ms-g21-2025',
    groupName: 'MS G21-2025',
    projectName: 'Minh Phu Delta Programme',
    country: 'Vietnam',
    region: 'Bến Tre',
    address: 'Ấp 3, Thạnh Phú district',
    gps: { lat: 9.9012, lng: 106.487, accuracy: 7, capturedAt: Date.now() },
  },
  {
    id: 'site-in-ap-0067',
    referenceCode: 'IN-AP-0067',
    farmName: 'Krishna Prawn Unit',
    groupId: 'group-in-g04-2026',
    groupName: 'IN G04-2026',
    projectName: 'Andhra Pradesh Shrimp Programme',
    country: 'India',
    region: 'Andhra Pradesh',
    address: 'Kaikaluru mandal, Krishna district',
    gps: { lat: 16.5644, lng: 81.2135, accuracy: 10, capturedAt: Date.now() },
  },
]

export async function seedIfEmpty(): Promise<void> {
  const count = await db.sites.count()
  if (count > 0) return
  await db.sites.bulkAdd(SEED_SITES)
}
