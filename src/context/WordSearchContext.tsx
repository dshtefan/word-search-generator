import { createContext, useContext, useEffect, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { WordSearchState, Direction, Language, GridStyle, Cell } from '@/types'

const STORAGE_KEY = 'word-search-state-v2'

function loadState(): Partial<WordSearchState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Partial<WordSearchState>
  } catch { /* ignore corrupt storage */ }
  return {}
}

function saveState(state: WordSearchState) {
  try {
    const toSave = {
      words: state.words,
      language: state.language,
      gridX: state.gridX,
      gridY: state.gridY,
      highlightColor: state.highlightColor,
      cardinalDirections: state.cardinalDirections,
      diagonalDirections: state.diagonalDirections,
      fontFamily: state.fontFamily,
      fontSize: state.fontSize,
      gridStyle: state.gridStyle,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch { /* ignore quota errors */ }
}

export function clearSavedState() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

const initialState: WordSearchState = {
  words: ["Fußball", "Äpfel", "Größe", "Übung", "Straße", "Züge", "Österreich", "Tränen", "Löffel", "Gemüse", "Grüß"],
  language: 'de',
  gridX: 19,
  gridY: 19,
  highlightColor: '#9e9e9e',
  cardinalDirections: ['up', 'down', 'left', 'right'],
  diagonalDirections: ['up-left', 'up-right', 'down-left', 'down-right'],
  fontFamily: 'Open Sans',
  fontSize: 28,
  gridStyle: 'outer',
  grid: null,
  solutionGrid: null,
  isGenerated: false,
  isGenerating: false,
  error: null,
}

type WordSearchAction =
  | { type: 'SET_WORDS'; payload: string[] }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_GRID_X'; payload: number }
  | { type: 'SET_GRID_Y'; payload: number }
  | { type: 'SET_HIGHLIGHT_COLOR'; payload: string }
  | { type: 'SET_CARDINAL_DIRECTIONS'; payload: Direction[] }
  | { type: 'SET_DIAGONAL_DIRECTIONS'; payload: Direction[] }
  | { type: 'SET_FONT_FAMILY'; payload: string }
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'SET_GRID_STYLE'; payload: GridStyle }
  | { type: 'SET_GRID'; payload: Cell[][] | null }
  | { type: 'SET_SOLUTION_GRID'; payload: Cell[][] | null }
  | { type: 'SET_IS_GENERATED'; payload: boolean }
  | { type: 'SET_IS_GENERATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' }

function reducer(state: WordSearchState, action: WordSearchAction): WordSearchState {
  switch (action.type) {
    case 'SET_WORDS':
      return { ...state, words: action.payload }
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload }
    case 'SET_GRID_X':
      return { ...state, gridX: action.payload }
    case 'SET_GRID_Y':
      return { ...state, gridY: action.payload }
    case 'SET_HIGHLIGHT_COLOR':
      return { ...state, highlightColor: action.payload }
    case 'SET_CARDINAL_DIRECTIONS':
      return { ...state, cardinalDirections: action.payload }
    case 'SET_DIAGONAL_DIRECTIONS':
      return { ...state, diagonalDirections: action.payload }
    case 'SET_FONT_FAMILY':
      return { ...state, fontFamily: action.payload }
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: action.payload }
    case 'SET_GRID_STYLE':
      return { ...state, gridStyle: action.payload }
    case 'SET_GRID':
      return { ...state, grid: action.payload }
    case 'SET_SOLUTION_GRID':
      return { ...state, solutionGrid: action.payload }
    case 'SET_IS_GENERATED':
      return { ...state, isGenerated: action.payload }
    case 'SET_IS_GENERATING':
      return { ...state, isGenerating: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

interface WordSearchContextValue {
  state: WordSearchState
  dispatch: React.Dispatch<WordSearchAction>
}

const WordSearchContext = createContext<WordSearchContextValue | null>(null)

export function WordSearchProvider({ children }: { children: ReactNode }) {
  const saved = loadState()
  const [state, dispatch] = useReducer(reducer, { ...initialState, ...saved })

  useEffect(() => {
    saveState(state)
  }, [state])

  return (
    <WordSearchContext.Provider value={{ state, dispatch }}>
      {children}
    </WordSearchContext.Provider>
  )
}

export function useWordSearch(): WordSearchContextValue {
  const context = useContext(WordSearchContext)
  if (context === null) {
    throw new Error('useWordSearch must be used within a WordSearchProvider')
  }
  return context
}
