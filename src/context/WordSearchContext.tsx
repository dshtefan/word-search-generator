import { createContext, useContext, useEffect, useReducer, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { WordSearchState, SavedGeneration, WordPlacement, Direction, Language, GridStyle, Cell } from '@/types'

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
      useCustomFont: state.useCustomFont,
      customFontUrl: state.customFontUrl,
      useLocalFont: state.useLocalFont,
      localFontFamily: state.localFontFamily,
      localFontFullName: state.localFontFullName,
      localFontStyle: state.localFontStyle,
      useResolution: state.useResolution,
      resolutionW: state.resolutionW,
      resolutionH: state.resolutionH,
      useAspectRatio: state.useAspectRatio,
      aspectRatioW: state.aspectRatioW,
      aspectRatioH: state.aspectRatioH,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch { /* ignore quota errors */ }
}

const SAVED_STORAGE_KEY = 'word-search-saved'

function loadSaved(): SavedGeneration[] {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as SavedGeneration[]
  } catch { /* ignore */ }
  return []
}

function saveSaved(sg: SavedGeneration[]) {
  try {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(sg))
  } catch { /* ignore */ }
}

export function clearSavedState() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

const initialState: WordSearchState = {
  words: ["Fußball", "Äpfel", "Größe", "Übung", "Straße", "Züge", "Österreich", "Tränen", "Löffel", "Gemüse", "Grüß"],
  language: 'de',
  gridX: 19,
  gridY: 19,
  highlightColor: '#90a4ae',
  cardinalDirections: ['up', 'down', 'left', 'right'],
  diagonalDirections: ['up-left', 'up-right', 'down-left', 'down-right'],
  fontFamily: 'Open Sans',
  fontSize: 28,
  gridStyle: 'outer',
  useCustomFont: false,
  customFontUrl: '',
  useLocalFont: false,
  localFontFamily: '',
  localFontFullName: '',
  localFontStyle: '',
  placements: [],
  grid: null,
  solutionGrid: null,
  isGenerated: false,
  isGenerating: false,
  error: null,
  useResolution: false,
  resolutionW: 1024,
  resolutionH: 768,
  useAspectRatio: false,
  aspectRatioW: 16,
  aspectRatioH: 9,
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
  | { type: 'SET_USE_CUSTOM_FONT'; payload: boolean }
  | { type: 'SET_CUSTOM_FONT_URL'; payload: string }
  | { type: 'SET_USE_LOCAL_FONT'; payload: boolean }
  | { type: 'SET_LOCAL_FONT_FAMILY'; payload: string }
  | { type: 'SET_LOCAL_FONT_FULLNAME'; payload: string }
  | { type: 'SET_LOCAL_FONT_STYLE'; payload: string }
  | { type: 'SET_PLACEMENTS'; payload: WordPlacement[] }
  | { type: 'SET_GRID'; payload: Cell[][] | null }
  | { type: 'SET_SOLUTION_GRID'; payload: Cell[][] | null }
  | { type: 'SET_IS_GENERATED'; payload: boolean }
  | { type: 'SET_IS_GENERATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USE_RESOLUTION'; payload: boolean }
  | { type: 'SET_RESOLUTION_W'; payload: number }
  | { type: 'SET_RESOLUTION_H'; payload: number }
  | { type: 'SET_USE_ASPECT_RATIO'; payload: boolean }
  | { type: 'SET_ASPECT_RATIO_W'; payload: number }
  | { type: 'SET_ASPECT_RATIO_H'; payload: number }
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
    case 'SET_USE_CUSTOM_FONT':
      return { ...state, useCustomFont: action.payload }
    case 'SET_CUSTOM_FONT_URL':
      return { ...state, customFontUrl: action.payload }
    case 'SET_USE_LOCAL_FONT':
      return { ...state, useLocalFont: action.payload }
    case 'SET_LOCAL_FONT_FAMILY':
      return { ...state, localFontFamily: action.payload }
    case 'SET_LOCAL_FONT_FULLNAME':
      return { ...state, localFontFullName: action.payload }
    case 'SET_LOCAL_FONT_STYLE':
      return { ...state, localFontStyle: action.payload }
    case 'SET_PLACEMENTS':
      return { ...state, placements: action.payload }
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
    case 'SET_USE_RESOLUTION':
      return { ...state, useResolution: action.payload, useAspectRatio: action.payload ? false : state.useAspectRatio }
    case 'SET_RESOLUTION_W':
      return { ...state, resolutionW: action.payload }
    case 'SET_RESOLUTION_H':
      return { ...state, resolutionH: action.payload }
    case 'SET_USE_ASPECT_RATIO':
      return { ...state, useAspectRatio: action.payload, useResolution: action.payload ? false : state.useResolution }
    case 'SET_ASPECT_RATIO_W':
      return { ...state, aspectRatioW: action.payload }
    case 'SET_ASPECT_RATIO_H':
      return { ...state, aspectRatioH: action.payload }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

interface WordSearchContextValue {
  state: WordSearchState
  dispatch: React.Dispatch<WordSearchAction>
  savedGenerations: SavedGeneration[]
  addSaved: (sg: SavedGeneration) => void
  removeSaved: (id: string) => void
  applySaved: (sg: SavedGeneration) => void
}

const WordSearchContext = createContext<WordSearchContextValue | null>(null)

export function WordSearchProvider({ children }: { children: ReactNode }) {
  const saved = loadState()
  const [state, dispatch] = useReducer(reducer, { ...initialState, ...saved })
  const [savedGenerations, setSavedGenerations] = useState<SavedGeneration[]>(loadSaved())

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    saveSaved(savedGenerations)
  }, [savedGenerations])

  const addSaved = useCallback((sg: SavedGeneration) => {
    setSavedGenerations(prev => [...prev, sg])
  }, [])

  const removeSaved = useCallback((id: string) => {
    setSavedGenerations(prev => prev.filter(sg => sg.id !== id))
  }, [])

  const applySaved = useCallback((sg: SavedGeneration) => {
    dispatch({ type: 'SET_GRID', payload: sg.grid })
    dispatch({ type: 'SET_SOLUTION_GRID', payload: sg.solutionGrid })
    dispatch({ type: 'SET_PLACEMENTS', payload: sg.placements })
    dispatch({ type: 'SET_WORDS', payload: sg.words })
    dispatch({ type: 'SET_FONT_FAMILY', payload: sg.fontFamily })
    dispatch({ type: 'SET_FONT_SIZE', payload: sg.fontSize })
    dispatch({ type: 'SET_HIGHLIGHT_COLOR', payload: sg.highlightColor })
    dispatch({ type: 'SET_GRID_STYLE', payload: sg.gridStyle })
    dispatch({ type: 'SET_USE_CUSTOM_FONT', payload: sg.useCustomFont })
    dispatch({ type: 'SET_CUSTOM_FONT_URL', payload: sg.customFontUrl })
    dispatch({ type: 'SET_USE_LOCAL_FONT', payload: sg.useLocalFont })
    dispatch({ type: 'SET_LOCAL_FONT_FAMILY', payload: sg.localFontFamily })
    dispatch({ type: 'SET_LOCAL_FONT_FULLNAME', payload: sg.localFontFullName })
    dispatch({ type: 'SET_LOCAL_FONT_STYLE', payload: sg.localFontStyle })
    dispatch({ type: 'SET_USE_RESOLUTION', payload: sg.useResolution })
    dispatch({ type: 'SET_RESOLUTION_W', payload: sg.resolutionW })
    dispatch({ type: 'SET_RESOLUTION_H', payload: sg.resolutionH })
    dispatch({ type: 'SET_USE_ASPECT_RATIO', payload: sg.useAspectRatio })
    dispatch({ type: 'SET_ASPECT_RATIO_W', payload: sg.aspectRatioW })
    dispatch({ type: 'SET_ASPECT_RATIO_H', payload: sg.aspectRatioH })
    dispatch({ type: 'SET_IS_GENERATED', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
  }, [dispatch])

  return (
    <WordSearchContext.Provider value={{ state, dispatch, savedGenerations, addSaved, removeSaved, applySaved }}>
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
