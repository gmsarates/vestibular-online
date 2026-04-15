import { createFileRoute } from '@tanstack/react-router';
import { LoginForm } from '@/components/LoginForm';
import { ExamSelector } from '@/components/ExamSelector';
import { useExam } from '@/context/ExamContext';
import { useState, useEffect } from 'react';

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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // During SSR and before hydration, show a minimal loading state
  // to avoid hydration mismatch when localStorage has a user session
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <LoginForm />;
  return <ExamSelector />;
}
