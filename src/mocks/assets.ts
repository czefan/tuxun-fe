export interface MockImageAsset {
  src: string
  width: number
  height: number
}

export const mockImageAssets = {
  brand: {
    logo: {
      src: '/static/logo.png',
      width: 72,
      height: 72,
    },
  },
  campus: {
    gate: {
      src: '/static/images/arch.jpg',
      width: 201,
      height: 251,
    },
    lake: {
      src: '/static/images/lake.jpg',
      width: 262,
      height: 192,
    },
    library: {
      src: '/static/images/road.jpg',
      width: 194,
      height: 259,
    },
    building: {
      src: '/static/images/sunset.jpg',
      width: 275,
      height: 183,
    },
    poster: {
      src: '/static/images/beach.jpg',
      width: 275,
      height: 183,
    },
  },
} as const

export const mockQuestionImages = [
  mockImageAssets.campus.gate,
  mockImageAssets.campus.lake,
  mockImageAssets.campus.library,
  mockImageAssets.campus.building,
  mockImageAssets.campus.poster,
] as const
