import { useState } from 'react'
import { useWordSearch } from '@/context/WordSearchContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WordSearchGrid } from '@/components/WordSearchGrid'

export function Preview() {
  const { state } = useWordSearch()
  const [activeTab, setActiveTab] = useState('with-answers')

  if (!state.grid) {
    return (
      <p className="text-muted-foreground">
        Click Generate to create a word search
      </p>
    )
  }

  const gridProps = {
    fontFamily: state.fontFamily,
    fontSize: state.fontSize,
    highlightColor: state.highlightColor,
    gridStyle: state.gridStyle,
  } as const

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col items-center gap-4">
      <TabsList className="h-10 p-1">
        <TabsTrigger value="no-answers" className="px-4 text-base font-semibold data-active:bg-primary data-active:text-primary-foreground">
          Без ответов
        </TabsTrigger>
        <TabsTrigger value="with-answers" className="px-4 text-base font-semibold data-active:bg-primary data-active:text-primary-foreground">
          С ответами
        </TabsTrigger>
      </TabsList>
      <TabsContent value="no-answers" className="flex justify-center">
        <WordSearchGrid grid={state.grid} showAnswers={false} tableId="word-search-grid-content" {...gridProps} />
      </TabsContent>
      <TabsContent value="with-answers" className="flex justify-center">
        <WordSearchGrid
          grid={state.solutionGrid ?? state.grid}
          showAnswers
          tableId="word-search-grid-content"
          {...gridProps}
        />
      </TabsContent>
    </Tabs>
  )
}
