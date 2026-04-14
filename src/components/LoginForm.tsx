import { useState, useCallback } from 'react';
import { formatCPF, validateCPF } from '@/lib/cpf';
import { useExam } from '@/context/ExamContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const { login } = useExam();
  const [cpf, setCpf] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');

  const handleCpfChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
    setError('');
  }, []);

  const sendOtp = useCallback(() => {
    if (!validateCPF(cpf)) {
      setError('CPF inválido. Verifique os dígitos.');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpSent(true);
    setError('');
    // In production, this would send via SMS/email
    console.log(`[MOCK OTP] Código enviado: ${code}`);
    alert(`Código de verificação (mock): ${code}`);
  }, [cpf]);

  const handleLogin = useCallback(() => {
    if (!otp || otp !== generatedOtp) {
      setError('Código de verificação incorreto.');
      return;
    }
    login(cpf.replace(/\D/g, ''));
  }, [otp, generatedOtp, login, cpf]);

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

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
