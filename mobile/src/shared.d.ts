// The shared web modules in ../src reference Vite's import.meta.env; on native
// those files are swapped out by Metro, but tsc still sees the web versions.
interface ImportMeta {
  readonly env: Record<string, string | undefined> & { BASE_URL: string }
}
