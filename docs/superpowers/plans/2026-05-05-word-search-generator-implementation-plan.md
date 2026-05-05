# Word Search Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build a browser-based word search generator with Vite + React + shadcn/ui — word placement algorithm, visual controls, two-tab preview, and SVG/PNG/PDF export.

**Architecture:** React Context holds all state. A backtracking algorithm places words. A DOM table renders the grid with CSS-driven live controls (font, color, grid style). Save modal exports via DOM → SVG → PNG/PDF pipeline.

**Tech Stack:** React 18+, Vite, shadcn/ui (Tailwind CSS), jsPDF

---

## Task 1: Project Scaffolding

- [ ] Initialize Vite + React + TypeScript project
- [ ] Install and configure Tailwind CSS
- [ ] Install shadcn/ui CLI and initialize components
- [ ] Install jsPDF for PDF export

## Task 2: Types and Context

- [ ] Create `src/types/index.ts` with Direction, Cell, WordSearchState interfaces
- [ ] Create `src/context/WordSearchContext.tsx` with initial state and provider

## Task 3: Word Placement Algorithm

- [ ] Create `src/lib/letter-frequencies.ts` with EN/RU/DE letter weights
- [ ] Create `src/lib/word-placement.ts` with backtracking algorithm
- [ ] Export `generateGrid(words, directions, gridX, gridY, language)` function

## Task 4: UI Components (shadcn-based)

- [ ] Create reusable UI components: Button, Input, Textarea, Select, Tabs, Dialog, Card, Label, Separator
- [ ] Create custom MultiSelect component for direction groups
- [ ] Create GridSizeInputs component with X/Y inputs
- [ ] Create WordsInput component with textarea

## Task 5: Layout and Sidebar

- [ ] Create main App layout with Sidebar (left) + Preview (right)
- [ ] Create Sidebar component with all controls in Card sections
- [ ] Wire up context state changes from all inputs

## Task 6: Preview Component

- [ ] Create Preview component with Tabs (Без ответов / С ответами)
- [ ] Create WordSearchGrid component (DOM table)
- [ ] Implement answer highlighting in "С ответами" tab

## Task 7: Generate Functionality

- [ ] Wire up Generate button to call word placement algorithm
- [ ] Handle errors: words don't fit, no directions selected
- [ ] Fill empty cells with random letters after placement

## Task 8: Real-time Visual Controls

- [ ] Implement highlight color change (CSS variable)
- [ ] Implement font family change
- [ ] Implement font size change (8-42px, step 4)
- [ ] Implement grid style (full/outer/none borders)

## Task 9: Save Modal and Export

- [ ] Create SaveModal component with Dialog
- [ ] Implement SVG export via XMLSerializer
- [ ] Implement PNG export via canvas conversion
- [ ] Implement PDF export via jsPDF

## Task 10: Final Verification

- [ ] Test full flow: words → generate → preview → save
- [ ] Verify all three export formats work
- [ ] Verify real-time controls update without regeneration