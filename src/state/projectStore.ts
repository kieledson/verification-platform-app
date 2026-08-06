import { create } from 'zustand'
import type { ProjectRecord, SiteGroupRecord, SiteRecord } from '@/db/schema'
import * as projectsRepo from '@/db/repositories/projects'
import * as siteGroupsRepo from '@/db/repositories/siteGroups'
import * as sitesRepo from '@/db/repositories/sites'

interface ProjectState {
  projects: ProjectRecord[]
  siteGroups: SiteGroupRecord[]
  sites: SiteRecord[]
  loaded: boolean
  loadAll: () => Promise<void>
  createProject: (input: Omit<ProjectRecord, 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProject: (id: string, patch: Partial<Omit<ProjectRecord, 'id'>>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  createSiteGroup: (input: Omit<SiteGroupRecord, 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSiteGroup: (id: string, patch: Partial<Omit<SiteGroupRecord, 'id'>>) => Promise<void>
  deleteSiteGroup: (id: string) => Promise<void>
  createSite: (site: SiteRecord) => Promise<void>
  updateSite: (id: string, patch: Partial<Omit<SiteRecord, 'id'>>) => Promise<void>
  deleteSite: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  siteGroups: [],
  sites: [],
  loaded: false,

  loadAll: async () => {
    const [projects, siteGroups, sites] = await Promise.all([
      projectsRepo.listProjects(),
      siteGroupsRepo.listSiteGroups(),
      sitesRepo.listSites(),
    ])
    set({ projects, siteGroups, sites, loaded: true })
  },

  createProject: async (input) => {
    await projectsRepo.createProject(input)
    await get().loadAll()
  },
  updateProject: async (id, patch) => {
    await projectsRepo.updateProject(id, patch)
    await get().loadAll()
  },
  deleteProject: async (id) => {
    await projectsRepo.deleteProject(id)
    await get().loadAll()
  },

  createSiteGroup: async (input) => {
    await siteGroupsRepo.createSiteGroup(input)
    await get().loadAll()
  },
  updateSiteGroup: async (id, patch) => {
    await siteGroupsRepo.updateSiteGroup(id, patch)
    await get().loadAll()
  },
  deleteSiteGroup: async (id) => {
    await siteGroupsRepo.deleteSiteGroup(id)
    await get().loadAll()
  },

  createSite: async (site) => {
    await sitesRepo.createSite(site)
    await get().loadAll()
  },
  updateSite: async (id, patch) => {
    await sitesRepo.updateSite(id, patch)
    await get().loadAll()
  },
  deleteSite: async (id) => {
    await sitesRepo.deleteSite(id)
    await get().loadAll()
  },
}))
