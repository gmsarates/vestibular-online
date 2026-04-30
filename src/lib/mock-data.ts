export interface ExamAttempt {
  id: string;
  created_at_timestamp: number;
  text?: string | null;
  submitted_at?: string | number | null;
  submitted_at_timestamp?: number | null;
  status?: string | null;
  [key: string]: unknown;
}

export interface ExamConfig {
  id: string;
  name: string;
  institution: string;
  theme: string;
  instructions: string;
  duration: string;
  durationMinutes: number;
  minWords: number;
  maxWords: number;
  attempt: ExamAttempt | null;
}

export interface ExamResult {
  status: 'awaiting' | 'approved' | 'rejected';
  grade: number | null;
  feedback: string | null;
}

// Mock result — simulates data from backend
export const MOCK_RESULT: ExamResult = {
  status: 'awaiting',
  grade: null,
  feedback: null,
};

// Simple obfuscation for localStorage (NOT real encryption)
export function obfuscate(data: string): string {
  return btoa(encodeURIComponent(data));
}

export function deobfuscate(data: string): string {
  try {
    return decodeURIComponent(atob(data));
  } catch {
    return '';
  }
}

export function saveToStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  localStorage.setItem(key, obfuscate(JSON.stringify(value)));
}

export function loadFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(deobfuscate(raw)) as T;
  } catch {
    return null;
  }
}
