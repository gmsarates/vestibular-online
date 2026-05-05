import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { LoginForm } from '@/components/LoginForm';
import { ExamSelector } from '@/components/ExamSelector';
import { useExam } from '@/context/ExamContext';
import { useState, useEffect, useCallback } from 'react';
import { appCandidateApi, setAppToken, setAppTokenExpires, setRedirectUri, ValidateOtpRequest } from '@gmsarates/vestibular-api-client';
import toast from 'react-hot-toast';
import { useRef } from 'react';


export const Route = createFileRoute('/redirect')({
  head: () => ({
    meta: [
      { title: 'Vestibular Online — Plataforma de Redação' },
      { name: 'description', content: 'Plataforma de vestibular online focada em redação. Faça login e inicie sua prova.' },
      { property: 'og:title', content: 'Vestibular Online — Plataforma de Redação' },
      { property: 'og:description', content: 'Plataforma de vestibular online focada em redação.' },
    ],
  }),
  component: IndexPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
});

function IndexPage() {
  const { user, login, logout, redirectExam, setRedirectExam } = useExam();
  const [hydrated, setHydrated] = useState(false);
  const { token } = useSearch({ from: '/redirect' });
  const [hasLogged, setHasLogged] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      setLoading(true);

      let logged = await appCandidateApi.loginLink(token, import.meta.env.VITE_UNIVERSITY_ID);

      if (logged && logged.token) {
        setRedirectUri('/login')
        setAppTokenExpires(logged.expires)
        setAppToken(logged.token);
        setRedirectExam(logged.exam_id ?? null)
        login(logged.document ? logged.document.replace(/\D/g, '') : '');
      }
    } catch (error) {
      toast.error('Link de login inválido. Tente novamente ou acesse com seu CPF.');
      logout()
      navigate({ to: '/' });
    } finally {
      setLoading(false);
    }
  }, [token, login, logout, navigate, setRedirectExam]);

  const hasRun = useRef(false);

  useEffect(() => {
    if (!token || hasRun.current) return;

    hasRun.current = true;
    handleLogin();
  }, [token, handleLogin]);

  // During SSR and before hydration, show a minimal loading state
  // to avoid hydration mismatch when localStorage has a user session
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!token) return <LoginForm />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <ExamSelector />;
}
