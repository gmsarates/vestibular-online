// Mock data for the exam platform
// NOTE: In a real application, this data would come from a secure backend API.
// Client-side data should NEVER be trusted for security-critical decisions.

export interface ExamConfig {
  id: string;
  name: string;
  institution: string;
  theme: string;
  instructions: string[];
  durationMinutes: number;
  minWords: number;
  maxWords: number;
}

export interface ExamResult {
  status: 'awaiting' | 'approved' | 'rejected';
  grade: number | null;
  feedback: string | null;
}

export const EXAM_CONFIGS: ExamConfig[] = [
  {
    id: 'vest-2025-1',
    name: 'Vestibular 2025.1',
    institution: 'Universidade Federal',
    theme: 'Os desafios da inclusão digital no Brasil contemporâneo',
    instructions: [
      'Produza um texto dissertativo-argumentativo sobre o tema proposto.',
      'A redação deve ter entre 20 e 30 linhas.',
      'Utilize a norma padrão da língua portuguesa.',
      'Não copie trechos dos textos motivadores.',
      'Apresente uma proposta de intervenção que respeite os direitos humanos.',
    ],
    durationMinutes: 60,
    minWords: 150,
    maxWords: 500,
  },
  {
    id: 'vest-2025-2',
    name: 'Vestibular 2025.2',
    institution: 'Instituto Federal',
    theme: 'O papel da educação financeira na formação dos jovens brasileiros',
    instructions: [
      'Elabore uma redação dissertativo-argumentativa em norma padrão.',
      'O texto deve ter no mínimo 150 palavras.',
      'Apresente argumentos coerentes e fundamentados.',
      'Proponha uma solução viável para o problema apresentado.',
    ],
    durationMinutes: 90,
    minWords: 150,
    maxWords: 600,
  },
];

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
  localStorage.setItem(key, obfuscate(JSON.stringify(value)));
}

export function loadFromStorage<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(deobfuscate(raw)) as T;
  } catch {
    return null;
  }
}
