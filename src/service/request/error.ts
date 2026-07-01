export class ApiRequestError extends Error {
  code?: number
  statusCode?: number
  data?: unknown
  isSilent?: boolean

  constructor(
    message: string,
    options: { code?: number, statusCode?: number, data?: unknown, isSilent?: boolean } = {},
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.code = options.code
    this.statusCode = options.statusCode
    this.data = options.data
    this.isSilent = options.isSilent
  }
}
