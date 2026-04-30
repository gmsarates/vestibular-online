export class Api {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }

    // Login: enviar OTP
    apiSendOtp(cpf) {
        return this.httpClient.post('/candidate/auth/login', { document: cpf, university_id: config.universityId });
    }

    // Login: validar OTP
    apiValidateOtp(cpf, code) {
        return this.httpClient.post('/candidate/auth/login/verify', { document: cpf, code: code, university_id: config.universityId });
    }

    // Cadastro
    apiRegister(cpf, name, email, phone) {
        return this.httpClient.post('/candidate', { university_id: config.universityId, document: cpf, name: name, email: email, phone: phone });
    }

    // Me
    apiMe() {
        return this.httpClient.get('/candidate/me');
    }

    // Listar provas
    apiListExams() {
        return this.httpClient.get('/candidate/exam');
    }

    // Iniciar tentativa
    apiStartExam(examId, sessionId) {
        return this.httpClient.post('/exam/' + examId + '/start', { session_id: sessionId });
    }

    // Atualizar tentativa (sync)
    apiUpdateExam(examId, payload) {
        return this.httpClient.put('/exam/' + examId, payload);
    }

    // Submeter redação
    apiSubmitExam(examId, attemptId, sessionId) {
        return this.httpClient.post('/exam/' + examId + '/submit', { attempt_id: attemptId, session_id: sessionId });
    }
}