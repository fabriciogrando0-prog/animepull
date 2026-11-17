import type { ComponentType, ReactNode } from 'react'

export interface Palette {
  bg: string
  surface: string
  accent: string
  accent2: string
  text: string
  muted: string
}

export interface Theme {
  id: string
  name: string
  arquivo: string
  verso: string
  palette: Palette
  CardBack?: ComponentType<any> | ReactNode
  PackArt?: ComponentType<any> | ReactNode
  Background?: ComponentType<any> | ReactNode
}
