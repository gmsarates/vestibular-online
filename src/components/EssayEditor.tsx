import { useState, useEffect, useCallback, useRef } from 'react';
import { useExam } from '@/context/ExamContext';
import { ExamTimer } from '@/components/ExamTimer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import { sanitizeExamInstructionHtml } from '@/lib/html';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';

export function EssayEditor() {
  const { examState, selectedExam, updateEssay, syncEssay, submitEssay, incrementTabSwitch, resetExam } = useExam();
  const navigate = useNavigate();
  const [autoSaved, setAutoSaved] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save indicator
  // useEffect(() => {
  //   if (examState.status !== 'in_progress') return;
  //   const timer = setTimeout(() => {
  //     setAutoSaved(true);
  //     setTimeout(() => setAutoSaved(false), 2000);
  //   }, 1000);
  //   return () => clearTimeout(timer);
  // }, [examState.essay, examState.status]);

  // Page Visibility API — detect tab switching
  useEffect(() => {
    if (examState.status !== 'in_progress') return;

    const handleVisibility = () => {
      if (document.hidden) {
        incrementTabSwitch();
        setShowTabWarning(true);
        setTimeout(() => setShowTabWarning(false), 5000);
        syncEssay()
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [examState.status, incrementTabSwitch, syncEssay]);

  // Warn before leaving
  useEffect(() => {
    if (examState.status !== 'in_progress') return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [examState.status]);

  // const handlePaste = useCallback((e: React.ClipboardEvent) => {
  //   e.preventDefault();
  // }, []);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (updateTimeoutRef.current !== null) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      syncEssay()
        .then( () => {
          setAutoSaved(true);
          setTimeout(() => setAutoSaved(false), 2000);
        })
        .catch((error) => console.error('[EssayEditor] Falha ao sincronizar redação:', error));
    }, 5000);

    updateEssay(e.target.value);
  }, [updateEssay, syncEssay]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current !== null) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmitConfirmed = useCallback(() => {
    submitEssay();
    setShowSubmitConfirm(false);
  }, [submitEssay]);

  const handleExitConfirmed = useCallback(() => {
    resetExam();
    setShowExitConfirm(false);
    navigate({ to: '/' });
  }, [resetExam, navigate]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  if (!selectedExam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Nenhum vestibular selecionado.</p>
      </div>
    );
  }

  const words = examState.essay.trim() ? examState.essay.trim().split(/\s+/).length : 0;
  const chars = examState.essay.length;  
  const isEditable = examState.status === 'in_progress';
  const progress = Math.min(100, (words / selectedExam.minWords) * 100);

  return (
    <div className="min-h-screen bg-background"
      // onCopy={e => e.preventDefault()}
      // onCut={e => e.preventDefault()}
    >
      {/* Tab warning overlay */}
      {showTabWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-destructive/90">
          <div className="text-center text-destructive-foreground">
            <p className="text-2xl font-bold">⚠️ Atenção!</p>
            <p className="mt-2">Troca de aba detectada. Isso será registrado.</p>
            <p className="mt-1 text-sm">Trocas detectadas: {examState.tabSwitchCount}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">{selectedExam.name}</h1>
            {autoSaved && (
              <span className="text-xs text-muted-foreground animate-in fade-in">✓ Salvo</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ExamTimer />
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} title="Modo foco">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Status banners */}
        {examState.status === 'submitted' && (
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-lg font-semibold text-primary">✓ Redação enviada com sucesso!</p>
            <div className="mt-2 flex justify-center gap-3">
              <Button variant="link" onClick={() => navigate({ to: '/result' })}>
                Ver resultado →
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/' })}>
                Voltar para vestibulares
              </Button>
            </div>
          </div>
        )}
        {examState.status === 'expired' && (
          <div className="rounded-lg bg-destructive/10 p-4 text-center">
            <p className="text-lg font-semibold text-destructive">⏱ Tempo esgotado! Redação expirada.</p>
            <div className="mt-2 flex justify-center gap-3">
              <Button variant="link" onClick={() => navigate({ to: '/result' })}>
                Ver resultado →
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/' })}>
                Voltar para vestibulares
              </Button>
            </div>
          </div>
        )}

        {/* Theme card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Tema da redação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xl font-semibold text-foreground">{selectedExam.theme}</p>
            {selectedExam.instructions.length > 0 && (
              <div className="exam-description" dangerouslySetInnerHTML={{ __html: sanitizeExamInstructionHtml(selectedExam.instructions) }}></div>
              // <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
              //   {selectedExam.instructions.map((inst, i) => (
              //     <li key={i} dangerouslySetInnerHTML={{ __html: sanitizeExamInstructionHtml(inst) }} />
              //   ))}
              // </ul>
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            className="w-full min-h-[400px] rounded-lg border border-input bg-background px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="Comece a escrever sua redação aqui..."
            value={examState.essay}
            onChange={handleTextChange}
            // onPaste={handlePaste}
            disabled={!isEditable}
            spellCheck
            style={{ userSelect: isEditable ? 'auto' : 'none' }}
          />

          {/* Counters and progress */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex gap-4">
              <span>{chars} caracteres</span>
              <span>{words} palavras</span>
              <span>{examState.tabSwitchCount} trocas de abas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    progress >= 100 ? 'bg-primary' : 'bg-muted-foreground/50'
                  }`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <span className="text-xs">
                {words}/{selectedExam.minWords} min
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isEditable && (
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowExitConfirm(true)}>Sair da Prova</Button>
            <Button onClick={() => setShowSubmitConfirm(true)} disabled={words < 10}>
              Enviar Redação
            </Button>
          </div>
        )}
      </main>

      {/* Confirm submit */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar Redação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja enviar sua redação? Esta ação não pode ser desfeita.
              Você escreveu {words} palavras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitConfirmed}>Enviar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm exit */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da Prova</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair? Seu progresso será perdido e você voltará para a lista de vestibulares.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Prova</AlertDialogCancel>
            <AlertDialogAction onClick={handleExitConfirmed}>Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
