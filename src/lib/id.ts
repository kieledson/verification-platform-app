/** crypto.randomUUID is available in all modern browsers/webviews this app
 * targets (tablet Safari/Chrome); no polyfill needed. */
export function newId(): string {
  return crypto.randomUUID()
}
