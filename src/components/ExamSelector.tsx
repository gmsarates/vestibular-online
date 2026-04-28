import { useState } from 'react';
import { useExam } from '@/context/ExamContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ExamSelector() {
  const { user, exams, selectExam, examState, login, logout } = useExam();
  const navigate = useNavigate();
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const selectedExam = exams.find(e => e.id === examState.selectedExamId);

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
                <CardDescription>{exam.institution}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Duração: {exam.durationMinutes} minutos · {exam.minWords}–{exam.maxWords} palavras
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
              Você está prestes a iniciar a prova "{selectedExam?.name}".
              O cronômetro de {selectedExam?.durationMinutes} minutos começará imediatamente.
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate({ to: '/exam' })}>
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
