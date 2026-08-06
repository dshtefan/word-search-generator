import { Separator } from '@/components/ui/separator'
import { ActionsSection } from './ActionsSection'
import { AppearanceSection } from './AppearanceSection'
import { DirectionsSection } from './DirectionsSection'
import { GridSection } from './GridSection'
import { GenerationBalanceSection } from './GenerationBalanceSection'
import { WordsSection } from './WordsSection'
import { useI18n } from '@/i18n'

/** Composes the existing sidebar cards in their established visual order. */
export function Sidebar() {
  const { t } = useI18n()
  return (
    <aside className="flex h-screen w-1/5 shrink-0 flex-col overflow-hidden border-r bg-sidebar p-4">
      <h2 className="text-lg font-semibold">{t('appTitle')}</h2>
      <Separator className="my-2" />
      <div className="flex-1 space-y-4 overflow-y-auto p-1">
        <WordsSection />
        <GridSection />
        <DirectionsSection />
        <GenerationBalanceSection />
        <AppearanceSection />
      </div>
      <Separator className="my-2" />
      <ActionsSection />
    </aside>
  )
}
