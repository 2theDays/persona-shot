
export interface ImageState {
  file: File | null;
  previewUrl: string | null;
  resultUrl: string | null;
  isProcessing: boolean;
  error: string | null;
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNSPECIFIED = 'UNSPECIFIED'
}

export interface TransformationConfig {
  gender: Gender;
  background: 'blue' | 'gray' | 'white';
  style: 'modern' | 'classic';
}
