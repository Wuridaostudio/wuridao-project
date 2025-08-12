// frontend/composables/usePerformance.ts
import { logger } from '~/utils/logger'

export const usePerformance = () => {
  const measureApiCall = async <T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now()
    
    try {
      const result = await apiCall()
      const duration = performance.now() - start
      
      logger.debug(`API call completed`, { 
        name, 
        duration: `${duration.toFixed(2)}ms` 
      })
      
      // 記錄慢查詢
      if (duration > 1000) {
        logger.warn(`Slow API call detected`, { 
          name, 
          duration: `${duration.toFixed(2)}ms` 
        })
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      logger.error(`API call failed`, { 
        name, 
        duration: `${duration.toFixed(2)}ms`,
        error: error.message 
      })
      throw error
    }
  }

  const measureComponentRender = (name: string) => {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      logger.debug(`Component rendered`, { 
        name, 
        duration: `${duration.toFixed(2)}ms` 
      })
    }
  }

  return {
    measureApiCall,
    measureComponentRender
  }
}
