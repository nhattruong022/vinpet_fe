// Types for Post Image Management API

export type Locale = 'vi' | 'en' | 'ko';

export interface ContentStructure {
  totalParagraphs: number;
  availablePositions: number[];
}

export interface UploadImageParams {
  file: File;
  postId: string;
  position: number; // 0 for thumbnail, 1-N for content insertion
  altText?: string;
}

export interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  position: number;
  altText?: string;
  image?: string; // Base64 encoded image
}

export interface ApiResponse<T> {
  success: boolean;
  returnCode?: number;
  message?: string;
  result?: T;
  data?: T;
}


