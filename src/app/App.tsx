import { PreviewToolbar } from '@/components/PreviewToolbar'
import { Preview } from '@/components/preview/Preview'
import { SavedPanel } from '@/components/saved/SavedPanel'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { WordSearchProvider } from '@/store'

/** Composes the word-search editor using the intent-level React facade. */
export function App() {
  return (
    <WordSearchProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <PreviewToolbar />
          <main className="flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
            <Preview />
          </main>
        </div>
      </div>
      <div className="pointer-events-none fixed right-3 top-12 select-none text-xs text-gray-400 text-muted-foreground/40">
        v{__APP_VERSION__}
      </div>
      <div className="fixed bottom-2 right-12">
        <SavedPanel />
      </div>
    </WordSearchProvider>
  )
}

export default App
