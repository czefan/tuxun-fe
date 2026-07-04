export interface NoticeItem {
  id: number
  title: string
  summary: string
  time: string
  read?: boolean
}

export interface NoticeGroup {
  label: string
  items: NoticeItem[]
}
