import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { type ExamConfig, type ExamResult, EXAM_CONFIGS, MOCK_RESULT, saveToStorage, loadFromStorage } from '@/lib/mock-data';

export type ExamStatus = 'idle' | 'in_progress' | 'submitted' | 'expired';

interface UserSession {
  cpf: string;
  loggedInAt: number;
}

interface ExamState {
  essay: string;
  status: ExamStatus;
  selectedExamId: string | null;
  startTimestamp: number | null;
  tabSwitchCount: number;
  result: ExamResult | null;
}

interface ExamContextType {
  user: UserSession | null;
  examState: ExamState;
  selectedExam: ExamConfig | null;
  login: (cpf: string) => void;
  logout: () => void;
  selectExam: (id: string) => void;
  startExam: () => void;
  updateEssay: (text: string) => void;
  submitEssay: () => void;
  expireEssay: () => void;
  incrementTabSwitch: () => void;
  setResult: (result: ExamResult) => void;
  exams: ExamConfig[];
}

const ExamContext = createContext<ExamContextType | null>(null);

export function ExamProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(() => loadFromStorage('user_session'));
  const [examState, setExamState] = useState<ExamState>(() => loadFromStorage('exam_state') ?? {
    essay: '',
    status: 'idle' as ExamStatus,
    selectedExamId: null,
    startTimestamp: null,
    tabSwitchCount: 0,
    result: MOCK_RESULT,
  });

  const selectedExam = EXAM_CONFIGS.find(e => e.id === examState.selectedExamId) ?? null;

  useEffect(() => { saveToStorage('user_session', user); }, [user]);
  useEffect(() => { saveToStorage('exam_state', examState); }, [examState]);

  const login = useCallback((cpf: string) => {
    setUser({ cpf, loggedInAt: Date.now() });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setExamState({ essay: '', status: 'idle', selectedExamId: null, startTimestamp: null, tabSwitchCount: 0, result: MOCK_RESULT });
    localStorage.removeItem('user_session');
    localStorage.removeItem('exam_state');
  }, []);

  const selectExam = useCallback((id: string) => {
    setExamState(s => ({ ...s, selectedExamId: id }));
  }, []);

  const startExam = useCallback(() => {
    setExamState(s => ({ ...s, status: 'in_progress', startTimestamp: Date.now() }));
  }, []);

  const updateEssay = useCallback((text: string) => {
    setExamState(s => s.status === 'in_progress' ? { ...s, essay: text } : s);
  }, []);

  const submitEssay = useCallback(() => {
    setExamState(s => ({ ...s, status: 'submitted' }));
    // NOTE: In production, this would POST to a secure backend
    console.log('[MOCK WEBHOOK] Essay submitted:', { timestamp: Date.now() });
  }, []);

  const expireEssay = useCallback(() => {
    setExamState(s => ({ ...s, status: 'expired' }));
    console.log('[MOCK WEBHOOK] Essay expired:', { timestamp: Date.now() });
  }, []);

  const incrementTabSwitch = useCallback(() => {
    setExamState(s => ({ ...s, tabSwitchCount: s.tabSwitchCount + 1 }));
  }, []);

  const setResult = useCallback((result: ExamResult) => {
    setExamState(s => ({ ...s, result }));
  }, []);

  return (
    <ExamContext.Provider value={{
      user, examState, selectedExam, login, logout, selectExam, startExam,
      updateEssay, submitEssay, expireEssay, incrementTabSwitch, setResult,
      exams: EXAM_CONFIGS,
    }}>
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error('useExam must be used within ExamProvider');
  return ctx;
}
