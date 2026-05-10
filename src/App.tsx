import { WordSearchProvider } from "@/context/WordSearchContext"
import { Sidebar } from "@/components/Sidebar"
import { Preview } from "@/components/Preview"

function App() {
  return (
    <WordSearchProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center bg-muted/30 p-4 overflow-auto">
          <Preview />
        </main>
      </div>
      <span className="pointer-events-none fixed bottom-2 right-3 select-none text-xs text-muted-foreground/40">
        v{__APP_VERSION__}
      </span>
    </WordSearchProvider>
  )
}

export default App
