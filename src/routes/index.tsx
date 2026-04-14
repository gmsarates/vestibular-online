import { createFileRoute } from '@tanstack/react-router';
import { LoginForm } from '@/components/LoginForm';
import { ExamSelector } from '@/components/ExamSelector';
import { useExam } from '@/context/ExamContext';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Vestibular Online — Plataforma de Redação' },
      { name: 'description', content: 'Plataforma de vestibular online focada em redação. Faça login e inicie sua prova.' },
      { property: 'og:title', content: 'Vestibular Online — Plataforma de Redação' },
      { property: 'og:description', content: 'Plataforma de vestibular online focada em redação.' },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const { user } = useExam();

  if (!user) return <LoginForm />;
  return <ExamSelector />;
}
