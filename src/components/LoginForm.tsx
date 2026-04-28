import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { formatCPF, validateCPF } from '@/lib/cpf';
import { useExam } from '@/context/ExamContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { appCandidateApi, setAppToken, setAppTokenExpires } from '@gmsarates/vestibular-api-client';
import { LoginRequest, ValidateOtpRequest } from '@gmsarates/vestibular-api-client';
import { RegisterForm } from './RegisterForm';

export function LoginForm() {
  const { login } = useExam();
  const [cpf, setCpf] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const handleCpfChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
    setError('');
  }, []);

  const sendOtp = useCallback(async () => {
    if (!validateCPF(cpf)) {
      toast.error('CPF inválido. Verifique os dígitos.');
      return;
    }

    try {
      await appCandidateApi.login({ 
        document: cpf,
        university_id: import.meta.env.VITE_UNIVERSITY_ID
      } as LoginRequest);
      
      toast.success('Código de verificação enviado para o seu email.');
      setOtpSent(true);
      setError('');  
    } catch (error: any) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error(error.toString())
      }
    }

  }, [cpf]);

  const handleLogin = useCallback(async () => {
    if (!otp) {
      toast.error('Insira o código de verificação para continuar.');
      return;
    }

    try {
      let logged = await appCandidateApi.validateOtp({ 
        document: cpf,
        code: otp,
        university_id: import.meta.env.VITE_UNIVERSITY_ID,
      } as ValidateOtpRequest);

      if (logged && logged.token) {
        setAppTokenExpires(logged.expires)
        setAppToken(logged.token);
        login(cpf.replace(/\D/g, ''));
      }
    } catch (error) {
      toast.error('Código de verificação inválido. Tente novamente.');
      return;
    }
  }, [otp, generatedOtp, login, cpf]);

  if (showRegister) {
    return <RegisterForm onBack={() => setShowRegister(false)} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Vestibular Online</CardTitle>
          <CardDescription>Plataforma de Redação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              maxLength={14}
              autoComplete="off"
            />
          </div>

          {!otpSent ? (
            <Button className="w-full" onClick={sendOtp}>
              Enviar código de verificação
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Código de verificação</Label>
                <Input
                  id="otp"
                  placeholder="000000"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  maxLength={6}
                  autoComplete="off"
                />
              </div>
              <Button className="w-full" onClick={handleLogin}>
                Entrar
              </Button>
              <button
                type="button"
                className="w-full text-sm text-muted-foreground hover:underline"
                onClick={sendOtp}
              >
                Reenviar código
              </button>
            </>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowRegister(true)}
          >
            Criar cadastro
          </Button>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
