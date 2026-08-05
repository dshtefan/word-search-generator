/** Identifies a recoverable rule violation while preparing a word-search puzzle. */
export type WordSearchErrorCode =
  | 'NO_WORDS'
  | 'NO_DIRECTIONS'
  | 'INVALID_DIMENSIONS'
  | 'WORD_DOES_NOT_FIT'
  | 'PLACEMENT_EXHAUSTED'

/** A typed domain error callers can use to present a specific generation failure. */
export class WordSearchError extends Error {
  readonly code: WordSearchErrorCode

  constructor(code: WordSearchErrorCode, message: string) {
    super(message)
    this.name = 'WordSearchError'
    this.code = code
  }
}
