import { logger } from './logger'

// 導入DOMPurify，處理SSR兼容性
let DOMPurify: any = null

if (process.client) {
  try {
    DOMPurify = require('dompurify')
  } catch (error) {
    logger.error('[HTMLSanitizer] DOMPurify 載入失敗:', error)
  }
}

/**
 * HTML Sanitizer 配置
 * 定義允許的標籤和屬性，確保安全性
 */
const SANITIZER_CONFIG = {
  // 允許的HTML標籤
  ALLOWED_TAGS: [
    // 基本文本標籤
    'p', 'br', 'hr',
    // 標題標籤
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // 格式化標籤
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
    // 代碼標籤
    'code', 'pre', 'kbd', 'samp', 'var',
    // 引用標籤
    'blockquote', 'cite',
    // 列表標籤
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    // 表格標籤
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col',
    // 連結和圖片
    'a', 'img',
    // 容器標籤
    'div', 'span', 'section', 'article', 'aside', 'header', 'footer', 'nav',
    // 其他安全標籤
    'mark', 'small', 'sub', 'sup', 'time', 'abbr', 'acronym', 'dfn'
  ],
  
  // 允許的HTML屬性
  ALLOWED_ATTR: [
    // 基本屬性
    'id', 'class', 'title', 'lang', 'dir',
    // 連結屬性
    'href', 'target', 'rel',
    // 圖片屬性
    'src', 'alt', 'width', 'height', 'loading', 'decoding',
    // 表格屬性
    'colspan', 'rowspan', 'scope', 'headers',
    // 樣式屬性（需要額外驗證）
    'style',
    // 其他安全屬性
    'datetime', 'cite', 'data-*'
  ],
  
  // 允許的CSS屬性（用於style屬性）
  ALLOWED_CSS_PROPERTIES: [
    'color', 'background-color', 'background', 'font-size', 'font-weight',
    'font-style', 'text-align', 'text-decoration', 'line-height',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border', 'border-width', 'border-style', 'border-color',
    'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'float', 'clear', 'overflow', 'overflow-x', 'overflow-y',
    'z-index', 'opacity', 'visibility', 'cursor'
  ],
  
  // 允許的URL協議
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  
  // 禁止的標籤（額外安全層）
  FORBIDDEN_TAGS: [
    'script', 'iframe', 'object', 'embed', 'applet', 'form', 'input',
    'textarea', 'select', 'button', 'label', 'fieldset', 'legend',
    'frameset', 'frame', 'noframes', 'noscript', 'xmp', 'listing',
    'plaintext', 'listing', 'marquee', 'bgsound', 'link', 'meta',
    'title', 'head', 'body', 'html', 'xml', 'svg', 'math'
  ],
  
  // 禁止的屬性（額外安全層）
  FORBIDDEN_ATTR: [
    'onload', 'onunload', 'onclick', 'ondblclick', 'onmousedown', 'onmouseup',
    'onmouseover', 'onmousemove', 'onmouseout', 'onfocus', 'onblur',
    'onkeypress', 'onkeydown', 'onkeyup', 'onsubmit', 'onreset', 'onselect',
    'onchange', 'onerror', 'onabort', 'onbeforeunload', 'onerror', 'onhashchange',
    'onmessage', 'onoffline', 'ononline', 'onpagehide', 'onpageshow',
    'onpopstate', 'onresize', 'onstorage', 'oncontextmenu', 'oninput',
    'oninvalid', 'onsearch', 'onbeforecopy', 'onbeforecut', 'onbeforepaste',
    'oncopy', 'oncut', 'onpaste', 'onselectstart', 'onstart', 'onfinish',
    'onbounce', 'onfinish', 'onstart', 'onbeforeprint', 'onafterprint',
    'onbeforeinstallprompt', 'onappinstalled', 'onbeforeinstallprompt',
    'onappinstalled', 'onbeforeinstallprompt', 'onappinstalled'
  ]
}

/**
 * 增強的正則表達式清理（作為DOMPurify的備用方案）
 */
function enhancedRegexSanitize(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  let sanitized = html

  // 移除所有禁止的標籤（大小寫不敏感）
  SANITIZER_CONFIG.FORBIDDEN_TAGS.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi')
    sanitized = sanitized.replace(regex, '')
  })

  // 移除所有禁止的屬性（大小寫不敏感）
  SANITIZER_CONFIG.FORBIDDEN_ATTR.forEach(attr => {
    const regex = new RegExp(`\\s+${attr}\\s*=\\s*["'][^"']*["']`, 'gi')
    sanitized = sanitized.replace(regex, '')
  })

  // 移除javascript:協議
  sanitized = sanitized.replace(/javascript:/gi, '')

  // 移除data:協議（除了安全的圖片格式）
  sanitized = sanitized.replace(/data:(?!image\/(png|jpeg|gif|webp|svg\+xml))/gi, '')

  // 移除vbscript:協議
  sanitized = sanitized.replace(/vbscript:/gi, '')

  // 移除expression()和calc()等危險的CSS函數
  sanitized = sanitized.replace(/expression\s*\(/gi, '')
  sanitized = sanitized.replace(/calc\s*\(/gi, '')

  return sanitized
}

/**
 * 驗證CSS屬性
 */
function validateCSSProperty(property: string, value: string): boolean {
  // 檢查是否為允許的CSS屬性
  if (!SANITIZER_CONFIG.ALLOWED_CSS_PROPERTIES.includes(property.toLowerCase())) {
    return false
  }

  // 檢查值是否包含危險內容
  const dangerousPatterns = [
    /expression\s*\(/i,
    /javascript:/i,
    /vbscript:/i,
    /data:/i,
    /url\s*\(\s*['"]?javascript:/i,
    /url\s*\(\s*['"]?data:/i
  ]

  return !dangerousPatterns.some(pattern => pattern.test(value))
}

/**
 * 清理style屬性
 */
function sanitizeStyleAttribute(styleValue: string): string {
  if (!styleValue) return ''

  const stylePairs = styleValue.split(';')
  const validPairs: string[] = []

  for (const pair of stylePairs) {
    const [property, value] = pair.split(':').map(s => s.trim())
    if (property && value && validateCSSProperty(property, value)) {
      validPairs.push(`${property}: ${value}`)
    }
  }

  return validPairs.join('; ')
}

/**
 * 主要的HTML清理函數
 */
export function sanitizeHtml(html: string, options: {
  strict?: boolean
  allowImages?: boolean
  allowLinks?: boolean
  allowTables?: boolean
  allowStyles?: boolean
} = {}): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  const {
    strict = false,
    allowImages = true,
    allowLinks = true,
    allowTables = true,
    allowStyles = true
  } = options

  try {
    // 第一層：增強的正則表達式清理
    let sanitized = enhancedRegexSanitize(html)

    // 第二層：DOMPurify清理（如果可用）
    if (DOMPurify && process.client) {
      const config = {
        ALLOWED_TAGS: [...SANITIZER_CONFIG.ALLOWED_TAGS],
        ALLOWED_ATTR: [...SANITIZER_CONFIG.ALLOWED_ATTR],
        ALLOWED_URI_REGEXP: SANITIZER_CONFIG.ALLOWED_URI_REGEXP,
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_DOM_IMPORT: false,
        RETURN_TRUSTED_TYPE: false
      }

      // 根據選項調整允許的標籤
      if (!allowImages) {
        config.ALLOWED_TAGS = config.ALLOWED_TAGS.filter(tag => tag !== 'img')
      }
      if (!allowLinks) {
        config.ALLOWED_TAGS = config.ALLOWED_TAGS.filter(tag => tag !== 'a')
      }
      if (!allowTables) {
        config.ALLOWED_TAGS = config.ALLOWED_TAGS.filter(tag => 
          !['table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col'].includes(tag)
        )
      }
      if (!allowStyles) {
        config.ALLOWED_ATTR = config.ALLOWED_ATTR.filter(attr => attr !== 'style')
      }

      // 嚴格模式：只允許基本標籤
      if (strict) {
        config.ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li']
        config.ALLOWED_ATTR = ['class', 'title']
      }

      sanitized = DOMPurify.sanitize(sanitized, config)
    }

    // 第三層：額外的安全檢查
    if (process.client) {
      // 創建臨時DOM元素進行最終驗證
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = sanitized

      // 移除任何殘留的危險元素
      const dangerousElements = tempDiv.querySelectorAll('script, iframe, object, embed, form')
      dangerousElements.forEach(el => el.remove())

      // 清理style屬性
      if (allowStyles) {
        const elementsWithStyle = tempDiv.querySelectorAll('[style]')
        elementsWithStyle.forEach(el => {
          const styleValue = el.getAttribute('style')
          if (styleValue) {
            const cleanStyle = sanitizeStyleAttribute(styleValue)
            if (cleanStyle) {
              el.setAttribute('style', cleanStyle)
            } else {
              el.removeAttribute('style')
            }
          }
        })
      }

      sanitized = tempDiv.innerHTML
    }

    logger.log('[HTMLSanitizer] HTML清理完成，原始長度:', html.length, '清理後長度:', sanitized.length)
    return sanitized

  } catch (error) {
    logger.error('[HTMLSanitizer] HTML清理失敗:', error)
    // 發生錯誤時，返回最嚴格的清理結果
    return enhancedRegexSanitize(html)
  }
}

/**
 * 快速清理函數（用於簡單文本）
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  // 移除所有HTML標籤
  return text.replace(/<[^>]*>/g, '')
}

/**
 * 驗證URL安全性
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }

  // 檢查是否為安全的URL協議
  const safeProtocols = /^(https?|mailto|tel|callto):/i
  if (!safeProtocols.test(url)) {
    return ''
  }

  return url
}

/**
 * 清理工具函數
 */
export const HtmlSanitizer = {
  sanitize: sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
  config: SANITIZER_CONFIG
}
