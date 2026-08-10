import { request } from '@/service/request'
import { normalizeRichText } from '@/utils/rich-text'
import type { ContentBlockVM, ContentKey } from './types'

/** 读取内容位 GET /contents/{key}（无需登录） */
export async function getContent(key: ContentKey): Promise<ContentBlockVM> {
  const raw = await request<{
    key: ContentKey
    content: string
    related_id: number | null
    version: number
    updated_at: string
  }>({
    url: `/contents/${key}`,
    method: 'GET',
  })

  return {
    key: raw.key,
    content: normalizeRichText(raw.content),
    relatedId: raw.related_id,
    version: raw.version,
    updatedAt: raw.updated_at,
  }
}
