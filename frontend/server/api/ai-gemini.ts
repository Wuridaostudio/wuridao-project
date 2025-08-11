import { defineEventHandler, readBody } from 'h3'
import fetch from 'node-fetch'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY // 請在 .env 設定

logger.log('AI Gemini API handler loaded')

import { logger } from '~/utils/logger'

export default defineEventHandler(async (event) => {
  // 取得前端傳來的資料
  const body = await readBody(event)
  if (process.env.NODE_ENV === 'development') {
    logger.log('[AI] Request received:', { type: body.type, hasContent: !!body.content })
  }

  // 組裝 prompt
  let prompt = ''
  if (body.type === 'keywords') {
    prompt = `請根據以下內容，產生 8-12 個熱門 SEO 關鍵字，請用逗號分隔：\n${body.content}`
  }
  else if (body.type === 'faq') {
    prompt = `請根據以下內容，產生 2-3 組常見問題與答案（FAQ），回傳格式為 JSON 陣列，每組包含 question 與 answer 欄位，只回傳 JSON，不要有其他說明。\n${body.content}`
  }
  else {
    return { error: '不支援的 type' }
  }

  // 呼叫 Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${
      GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  )
  const data = await response.json()
  if (process.env.NODE_ENV === 'development') {
    logger.log('[AI] Gemini response received:', { hasCandidates: !!data.candidates, candidatesCount: data.candidates?.length })
  }
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  if (process.env.NODE_ENV === 'development') {
    logger.log('[AI] Gemini text length:', text.length)
  }

  if (!text) {
    return { error: 'Gemini 沒有回傳內容', raw: data }
  }

  // 解析 Gemini 回傳內容
  if (body.type === 'keywords') {
    return { keywords: text.replace(/\n/g, '').replace(/。/g, '') }
  }
  if (body.type === 'faq') {
    // 嘗試解析 JSON
    try {
      const faqs = JSON.parse(text)
      return { faqs }
    }
    catch {
      // 若 AI 回傳非 JSON，則回傳原始文字
      return { faqs: [], raw: text }
    }
  }
})
