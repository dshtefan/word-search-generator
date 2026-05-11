import { WordSearchProvider } from "@/context/WordSearchContext"
import { Sidebar } from "@/components/Sidebar"
import { Preview } from "@/components/Preview"
import { PreviewToolbar } from "@/components/PreviewToolbar"
import { SavedPanel } from "@/components/SavedPanel"

function App() {
  return (
    <WordSearchProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <PreviewToolbar />
          <main className="flex flex-1 items-center justify-center bg-muted/30 p-4 overflow-auto">
            <Preview />
          </main>
        </div>
      </div>
      <div className="pointer-events-none fixed top-12 right-3 select-none text-xs text-muted-foreground/40 text-gray-400">
        v{__APP_VERSION__}
      </div>
      <div className="fixed bottom-2 right-12">
        <SavedPanel />
      </div>
    </WordSearchProvider>
  )
}

export default App
