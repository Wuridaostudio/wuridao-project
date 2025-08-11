// stores/seo.ts
import { defineStore } from 'pinia'
import { logger } from '~/utils/logger'

export interface SeoSettings {
  title: string
  description: string
  keywords: string
}

export interface AeoSettings {
  featuredSnippet: string
  faqs: Array<{ question: string, answer: string }>
}

export interface GeoSettings {
  latitude: number
  longitude: number
  address: string
  city: string
  postalCode: string
}

export interface SocialSettings {
  facebook: string
  instagram: string
  youtube: string
}

export const useSeoStore = defineStore('seo', {
  state: () => ({
    seoSettings: {
      title: 'WURIDAO 智慧家',
      description: 'WURIDAO 智慧家提供完整的智能家居解決方案，包括智能控制、安全守護、節能環保等功能',
      keywords: '智慧家居,智能家居,智慧家,WURIDAO,物聯網,IoT,家庭自動化',
    } as SeoSettings,

    aeoSettings: {
      featuredSnippet: '',
      faqs: [{ question: '', answer: '' }],
    } as AeoSettings,

    geoSettings: {
      latitude: 24.1477358,
      longitude: 120.6736482,
      address: '台中市大墩七街112號',
      city: '台中市',
      postalCode: '408',
    } as GeoSettings,

    socialSettings: {
      facebook: '',
      instagram: '',
      youtube: '',
    } as SocialSettings,

    loading: false,
    error: null as string | null,
  }),

  actions: {
    // 載入所有設定
    async fetchSettings() {
      this.loading = true
      this.error = null
      try {
        const api = useApi()
        const settings = await api.getSeoSettings()
        this.seoSettings = settings.seo || this.seoSettings
        this.aeoSettings = settings.aeo || this.aeoSettings
        this.geoSettings = settings.geo || this.geoSettings
        this.socialSettings = settings.social || this.socialSettings
      }
      catch (e: any) {
        this.error = e.data?.message || '載入設定失敗'
        logger.error('載入 SEO 設定失敗:', e)
      }
      finally {
        this.loading = false
      }
    },

    // 儲存 SEO 設定
    async saveSeoSettings(settings: SeoSettings) {
      this.loading = true
      this.error = null
      try {
        const api = useApi()
        await api.updateSeoSettings({ seo: settings })
        this.seoSettings = settings
        return true
      }
      catch (e: any) {
        this.error = e.data?.message || '儲存 SEO 設定失敗'
        logger.error('儲存 SEO 設定失敗:', e)
        throw new Error(this.error)
      }
      finally {
        this.loading = false
      }
    },

    // 儲存 AEO 設定
    async saveAeoSettings(settings: AeoSettings) {
      this.loading = true
      this.error = null
      try {
        const api = useApi()
        await api.updateSeoSettings({ aeo: settings })
        this.aeoSettings = settings
        return true
      }
      catch (e: any) {
        this.error = e.data?.message || '儲存 AEO 設定失敗'
        logger.error('儲存 AEO 設定失敗:', e)
        throw new Error(this.error)
      }
      finally {
        this.loading = false
      }
    },

    // 儲存 GEO 設定
    async saveGeoSettings(settings: GeoSettings) {
      this.loading = true
      this.error = null
      try {
        const api = useApi()
        await api.updateSeoSettings({ geo: settings })
        this.geoSettings = settings
        return true
      }
      catch (e: any) {
        this.error = e.data?.message || '儲存 GEO 設定失敗'
        logger.error('儲存 GEO 設定失敗:', e)
        throw new Error(this.error)
      }
      finally {
        this.loading = false
      }
    },

    // 儲存社群設定
    async saveSocialSettings(settings: SocialSettings) {
      this.loading = true
      this.error = null
      try {
        const api = useApi()
        await api.updateSeoSettings({ social: settings })
        this.socialSettings = settings
        return true
      }
      catch (e: any) {
        this.error = e.data?.message || '儲存社群設定失敗'
        logger.error('儲存社群設定失敗:', e)
        throw new Error(this.error)
      }
      finally {
        this.loading = false
      }
    },
  },
})
