import {
    formatCPF,
    showLoading,
    hideLoading,
    validateCPF,
    toast,
    persist,
    showScreen,
    renderExams,
    loadExamsAndGoSelector
} from "../helper.js";

import { $ } from "jquery";



export class Login {
    constructor(api, state) {
        this.api = api;
        this.state = state;
    }

    init() {
        $('#login-cpf').on('input', function() {
            let pos = this.selectionStart;
            let prev = $(this).val();
            let formatted = formatCPF($(this).val());

            $(this).val(formatted);

            try {
                this.setSelectionRange(pos + (formatted.length - prev.length), pos + (formatted.length - prev.length));
            } catch(e) {

            }
        });

        // Enviar OTP
        $('#btn-send-otp').on('click', function() {
            let cpf = $('#login-cpf').val();

            if (!validateCPF(cpf)) {
                toast('CPF inválido. Verifique os dígitos.', 'error');
                return;
            }

            showLoading();

            this.api.apiSendOtp(cpf.replace(/\D/g, '')).then(function() {
                toast('Código de verificação enviado para o seu email.', 'success');
                $('#login-step1').addClass('hidden');
                $('#login-step2').removeClass('hidden');
            }).fail(function(err) {
                toast(err.message || 'Erro ao enviar código.', 'error');
            }).always(hideLoading);
        });

        // Reenviar OTP
        $('#btn-resend-otp').on('click', function() {
            let cpf = $('#login-cpf').val();

            if (!validateCPF(cpf)) {
                toast('CPF inválido.', 'error');
                return;
            }

            showLoading();

            this.api.apiSendOtp(cpf.replace(/\D/g, '')).then(function() {
                toast('Código reenviado.', 'success');
            }).fail(function(err) {
                toast(err.message || 'Erro ao reenviar.', 'error');
            }).always(hideLoading);
        });

        // Login com OTP
        $('#btn-login').on('click', function() {
            const _this = this;

            let cpf = $('#login-cpf').val().replace(/\D/g, '');
            let otp = $('#login-otp').val().replace(/\D/g, '');

            if (!otp) {
                toast('Insira o código de verificação.', 'error');
                return;
            }

            showLoading();

            this.api.apiValidateOtp(cpf, otp).then(function(res) {
                if (res && res.token) {
                    _this.state.token = res.token;
                    _this.state.tokenExpires = res.expires || null;

                    return _this.api.apiMe().then(function(me) {
                        _this.state.user = {
                            cpf: cpf,
                            name: me.name,
                            email: me.email,
                            phone: me.phone,
                            loggedInAt: Date.now()
                        };

                        persist();
                        resetLoginForm();
                        loadExamsAndGoSelector(this.api);
                    });
                } else {
                    throw new Error('Resposta inválida do servidor.');
                }
            }).fail(function(err) {
                toast(err.message || 'Código de verificação inválido. Tente novamente.', 'error');
            }).always(hideLoading);
        });

        // OTP: somente dígitos
        $('#login-otp').on('input', function() {
            $(this).val($(this).val().replace(/\D/g, '').slice(0, 6));
        });

        // Enter nos campos de login
        $('#login-cpf').on('keypress', function(e) { if (e.which === 13) $('#btn-send-otp').click(); });
        $('#login-otp').on('keypress', function(e) { if (e.which === 13) $('#btn-login').click(); });

        function resetLoginForm() {
            $('#login-cpf').val('');
            $('#login-otp').val('');
            $('#login-step1').removeClass('hidden');
            $('#login-step2').addClass('hidden');
        }

        // Ir para cadastro
        $('#btn-show-register').on('click', function() { showScreen('register'); });
    }
}