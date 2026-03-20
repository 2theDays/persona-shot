
export interface ImageState {
  file: File | null;
  previewUrl: string | null;
  originalUrl: string | null;
  resultUrl: string | null;
  personaResults: PersonaResult[]; // Added for multi-persona support
  isProcessing: boolean;
  isAnalyzing: boolean;
  error: string | null;
  analysis: AIAnalysis | null;
}

export interface PersonaResult {
  id: PersonaType;
  url: string;
  label: string;
  description: string;
}

export enum PersonaType {
  EXECUTIVE = 'EXECUTIVE',
  INNOVATOR = 'INNOVATOR',
  SPECIALIST = 'SPECIALIST'
}

export interface AIAnalysis {
  impression: string;
  lighting: string;
  scoring: number;
  personalColor: 'Warm' | 'Cool' | 'Neutral';
  recommendedColors: string[];
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNSPECIFIED = 'UNSPECIFIED'
}

export enum PresetStyle {
  TRADITIONAL = 'TRADITIONAL',
  MODERN_TECH = 'MODERN_TECH',
  CREATIVE = 'CREATIVE',
  KOREAN_ID = 'KOREAN_ID',
  PASSPORT = 'PASSPORT',
  INSTAGRAM = 'INSTAGRAM'
}

export interface TransformationConfig {
  gender: Gender;
  background: string;
  style: PresetStyle;
  personalColorSync: boolean;
  corporateSync: boolean;
}

export interface AssetKit {
  businessCardUrl?: string;
  emailSignatureHtml?: string;
}
