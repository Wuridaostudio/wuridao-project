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

export const useSeoStore = defineStore('seo', () => {
  const api = useApi()

  const seoSettings = ref<SeoSettings>({
    title: 'WURIDAO 智慧家',
    description: 'WURIDAO 智慧家提供完整的智能家居解決方案，包括智能控制、安全守護、節能環保等功能',
    keywords: '智慧家居,智能家居,智慧家,WURIDAO,物聯網,IoT,家庭自動化',
  })

  const aeoSettings = ref<AeoSettings>({
    featuredSnippet: '',
    faqs: [{ question: '', answer: '' }],
  })

  const geoSettings = ref<GeoSettings>({
    latitude: 24.1477358,
    longitude: 120.6736482,
    address: '台中市大墩七街112號',
    city: '台中市',
    postalCode: '408',
  })

  const socialSettings = ref<SocialSettings>({
    facebook: '',
    instagram: '',
    youtube: '',
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  // 載入所有設定
  const fetchSettings = async () => {
    loading.value = true
    error.value = null
    try {
      const settings = await api.getSeoSettings()
      seoSettings.value = settings.seo || seoSettings.value
      aeoSettings.value = settings.aeo || aeoSettings.value
      geoSettings.value = settings.geo || geoSettings.value
      socialSettings.value = settings.social || socialSettings.value
    }
    catch (e: any) {
      error.value = e.data?.message || '載入設定失敗'
      logger.error('載入 SEO 設定失敗:', e)
    }
    finally {
      loading.value = false
    }
  }

  // 儲存 SEO 設定
  const saveSeoSettings = async (settings: SeoSettings) => {
    loading.value = true
    error.value = null
    try {
      await api.updateSeoSettings({ seo: settings })
      seoSettings.value = settings
      return true
    }
    catch (e: any) {
      error.value = e.data?.message || '儲存 SEO 設定失敗'
      logger.error('儲存 SEO 設定失敗:', e)
      throw new Error(error.value)
    }
    finally {
      loading.value = false
    }
  }

  // 儲存 AEO 設定
  const saveAeoSettings = async (settings: AeoSettings) => {
    loading.value = true
    error.value = null
    try {
      await api.updateSeoSettings({ aeo: settings })
      aeoSettings.value = settings
      return true
    }
    catch (e: any) {
      error.value = e.data?.message || '儲存 AEO 設定失敗'
      logger.error('儲存 AEO 設定失敗:', e)
      throw new Error(error.value)
    }
    finally {
      loading.value = false
    }
  }

  // 儲存 GEO 設定
  const saveGeoSettings = async (settings: GeoSettings) => {
    loading.value = true
    error.value = null
    try {
      await api.updateSeoSettings({ geo: settings })
      geoSettings.value = settings
      return true
    }
    catch (e: any) {
      error.value = e.data?.message || '儲存 GEO 設定失敗'
      logger.error('儲存 GEO 設定失敗:', e)
      throw new Error(error.value)
    }
    finally {
      loading.value = false
    }
  }

  // 儲存社群設定
  const saveSocialSettings = async (settings: SocialSettings) => {
    loading.value = true
    error.value = null
    try {
      await api.updateSeoSettings({ social: settings })
      socialSettings.value = settings
      return true
    }
    catch (e: any) {
      error.value = e.data?.message || '儲存社群設定失敗'
      logger.error('儲存社群設定失敗:', e)
      throw new Error(error.value)
    }
    finally {
      loading.value = false
    }
  }

  return {
    seoSettings,
    aeoSettings,
    geoSettings,
    socialSettings,
    loading,
    error,
    fetchSettings,
    saveSeoSettings,
    saveAeoSettings,
    saveGeoSettings,
    saveSocialSettings,
  }
})
