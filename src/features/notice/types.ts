export interface NoticeItem {
  id: number
  title: string
  summary: string
  time: string
}

export interface NoticeGroup {
  label: string
  items: NoticeItem[]
}
