export interface MyMenuItem {
  title: string
  desc: string
  icon: string
  color: string
  value: string
  path: string
  requiresLogin?: boolean
}

export interface MyMenuGroup {
  label: string
  items: MyMenuItem[]
}
