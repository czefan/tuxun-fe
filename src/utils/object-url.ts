export function releaseObjectUrl(path: string) {
  if (
    path.startsWith('blob:') &&
    typeof URL !== 'undefined' &&
    typeof URL.revokeObjectURL === 'function'
  ) {
    URL.revokeObjectURL(path)
  }
}
