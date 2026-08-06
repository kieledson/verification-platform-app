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
  // --- extended coverage for Project Preparation / Reports (see
  // seedProjectsAndGroups.ts for the matching Project/SiteGroup records) ---
  {
    id: 'site-vn-tv-0430',
    referenceCode: 'VN-TV-0430',
    farmName: 'Ao Tôm Hòa Bình',
    groupId: 'group-ms-g02-2026',
    groupName: 'MS G02-2026',
    projectName: 'Minh Phu Delta Programme',
    country: 'Vietnam',
    region: 'Trà Vinh · Duyên Hải',
    address: 'Hamlet 1, Hòa Bình, Duyên Hải district',
    gps: { lat: 9.6142, lng: 106.4977, accuracy: 8, capturedAt: Date.now() },
  },
  {
    id: 'site-vn-tv-0431',
    referenceCode: 'VN-TV-0431',
    farmName: 'Ao Tôm Đông Hải',
    groupId: 'group-ms-g02-2026',
    groupName: 'MS G02-2026',
    projectName: 'Minh Phu Delta Programme',
    country: 'Vietnam',
    region: 'Trà Vinh · Duyên Hải',
    address: 'Hamlet 5, Đông Hải, Duyên Hải district',
    gps: { lat: 9.598, lng: 106.512, accuracy: 9, capturedAt: Date.now() },
  },
  {
    id: 'site-in-ap-0071',
    referenceCode: 'IN-AP-0071',
    farmName: 'Godavari Aqua Farm',
    groupId: 'group-ap-g02-2025',
    groupName: 'AP G02-2025',
    projectName: 'Andhra Pradesh Shrimp Programme',
    country: 'India',
    region: 'West Godavari',
    address: 'Narsapur mandal, West Godavari district',
    gps: { lat: 16.4331, lng: 81.6978, accuracy: 11, capturedAt: Date.now() },
  },
  {
    id: 'site-in-ap-0072',
    referenceCode: 'IN-AP-0072',
    farmName: 'Bhimavaram Prawn Farm',
    groupId: 'group-ap-g02-2025',
    groupName: 'AP G02-2025',
    projectName: 'Andhra Pradesh Shrimp Programme',
    country: 'India',
    region: 'West Godavari',
    address: 'Bhimavaram mandal, West Godavari district',
    gps: { lat: 16.5449, lng: 81.5212, accuracy: 9, capturedAt: Date.now() },
  },
  {
    id: 'site-id-jv-0012',
    referenceCode: 'ID-JV-0012',
    farmName: 'Tambak Sari Makmur',
    groupId: 'group-jv-g01-2026',
    groupName: 'JV G01-2026',
    projectName: 'Java Coastal Aquaculture Programme',
    country: 'Indonesia',
    region: 'Jawa Tengah · Demak',
    address: 'Desa Bedono, Demak Regency',
    gps: { lat: -6.8917, lng: 110.5453, accuracy: 10, capturedAt: Date.now() },
  },
  {
    id: 'site-id-jv-0013',
    referenceCode: 'ID-JV-0013',
    farmName: 'Tambak Mina Sejahtera',
    groupId: 'group-jv-g01-2026',
    groupName: 'JV G01-2026',
    projectName: 'Java Coastal Aquaculture Programme',
    country: 'Indonesia',
    region: 'Jawa Tengah · Demak',
    address: 'Desa Wedung, Demak Regency',
    gps: { lat: -6.8452, lng: 110.5891, accuracy: 12, capturedAt: Date.now() },
  },
  {
    id: 'site-th-ct-0005',
    referenceCode: 'TH-CT-0005',
    farmName: 'Chanthaburi Shrimp Farm',
    groupId: 'group-th-g01-2026',
    groupName: 'TH G01-2026',
    projectName: 'Gulf of Thailand Shrimp Programme',
    country: 'Thailand',
    region: 'Chanthaburi',
    address: 'Tha Mai district, Chanthaburi',
    gps: { lat: 12.5865, lng: 102.1084, accuracy: 8, capturedAt: Date.now() },
  },
  {
    id: 'site-th-ct-0006',
    referenceCode: 'TH-CT-0006',
    farmName: 'Klong Nam Shrimp Farm',
    groupId: 'group-th-g01-2026',
    groupName: 'TH G01-2026',
    projectName: 'Gulf of Thailand Shrimp Programme',
    country: 'Thailand',
    region: 'Chanthaburi',
    address: 'Khlung district, Chanthaburi',
    gps: { lat: 12.4813, lng: 102.2185, accuracy: 9, capturedAt: Date.now() },
  },
]

let seedPromise: Promise<void> | null = null

/** Guarded against concurrent invocation with an in-flight-promise
 * singleton — React 18 StrictMode double-invokes effects in dev, and two
 * concurrent `count() === 0` checks would otherwise both pass before either
 * write lands, causing a duplicate-key `BulkError` on the second `bulkAdd`. */
export function seedIfEmpty(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await db.sites.count()
      if (count > 0) return
      await db.sites.bulkAdd(SEED_SITES)
    })()
  }
  return seedPromise
}
