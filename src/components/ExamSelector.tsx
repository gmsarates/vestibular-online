import { useRef, useState } from 'react';
import { formatDuration, useExam } from '@/context/ExamContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';

export function ExamSelector() {
  const { user, exams, selectExam, examState, currentExamState, login, logout, startExam, resetExam } = useExam();
  const navigate = useNavigate();
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showMultipleAttempts, setShowMultipleAttempts] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const startRequestedRef = useRef(false);
  
  const selectedExam = exams.find(e => e.id === examState.selectedExamId);
  const currentStartedExam = exams.find(e => e.id === currentExamState?.selectedExamId);

  const handleStart = async () => {
    if (!selectedExam) {
      toast.error('Selecione um vestibular para iniciar.');
      return;
    }
    if (startRequestedRef.current) return;
    startRequestedRef.current = true;

    try {
      await startExam();
      setShowStartConfirm(false);
      navigate({ to: '/exam' });
    } catch (error) {
      console.log(currentExamState, currentStartedExam)
      const message = error instanceof Error ? error.message : 'Falha ao iniciar a tentativa.';
      if (message === 'Multiple attempts' && currentStartedExam !== null) {
        const startedDate = new Date(currentExamState?.startTimestamp ?? '')
        const now = new Date()
        const elapsedTime = Math.floor((now - startedDate) / (1000 * 60))
        
        setTimeLeft((currentStartedExam?.durationMinutes ?? 0) - elapsedTime)
        setShowMultipleAttempts(true)
      } else {
        toast.error(message);
      }
      //resetExam();
      startRequestedRef.current = false;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Olá, {user?.name ?? 'bem vindo!'}</h1>
          <Button variant="ghost" onClick={() => setShowLogoutConfirm(true)}>Sair</Button>
        </div>
        <p className="text-[0.8rem] text-muted-foreground text-center">Verifique abaixo os vestibulares disponíveis para seu perfil.</p>

        <div className="grid gap-4">
          {exams.map(exam => (
            <Card
              key={exam.id}
              className={`cursor-pointer transition-shadow hover:shadow-lg ${examState.selectedExamId === exam.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => selectExam(exam.id)}
            >
              <CardHeader>
                <CardTitle>{exam.name}</CardTitle>
                {/* <CardDescription>{exam.institution}</CardDescription> */}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <strong>Duração:</strong> {exam.duration}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Conteúdo:</strong> de {exam.minWords} a {exam.maxWords} palavras
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {examState.selectedExamId && (
          <div className="flex justify-center">
            <Button size="lg" onClick={() => setShowStartConfirm(true)}>
              Iniciar Prova
            </Button>
          </div>
        )}
      </div>

      {/* Multiple attempts alert */}
      <AlertDialog open={showMultipleAttempts} onOpenChange={setShowMultipleAttempts}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tentativa em aberto</AlertDialogTitle>
            <AlertDialogDescription>
              Você já iniciou anteriormente a realização da prova <strong>{currentStartedExam?.name}</strong> e não pode
              iniciar novamente. 
              Você precisa esperar o tempo total da prova para poder iniciar um novo teste. 
              Atualmente, faltam <strong>{formatDuration(timeLeft)}</strong> para finalizar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Confirm start exam */}
      <AlertDialog open={showStartConfirm} onOpenChange={setShowStartConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar Prova</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a iniciar a prova <strong>"{selectedExam?.name}"</strong>.
              O cronômetro de {selectedExam?.duration} começará imediatamente.
              Tem certeza que deseja continuar? <strong>Você pode realizar esta prova apenas uma vez</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleStart}>
              Iniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm logout */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da plataforma</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair? Sua sessão será encerrada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={logout}>Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
