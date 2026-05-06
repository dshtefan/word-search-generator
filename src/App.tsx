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
    </WordSearchProvider>
  )
}

export default App
