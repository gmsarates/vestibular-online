import { useRef, useState } from 'react';
import { useExam } from '@/context/ExamContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';

export function ExamSelector() {
  const { user, exams, selectExam, examState, login, logout, startExam, resetExam } = useExam();
  const navigate = useNavigate();
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const startRequestedRef = useRef(false);
  

  const selectedExam = exams.find(e => e.id === examState.selectedExamId);

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
      const message = error instanceof Error ? error.message : 'Falha ao iniciar a tentativa.';
      toast.error(message);
      resetExam();
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
