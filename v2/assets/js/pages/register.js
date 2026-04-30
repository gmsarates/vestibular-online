import {
    formatCPF,
    showLoading,
    hideLoading,
    validateCPF,
    toast,
    persist,
    showScreen,
    renderExams,
    loadExamsAndGoSelector, formatPhone
} from "../helper.js";

import { $ } from "jquery";

export class Register {
    constructor(api, state) {
        this.api = api;
        this.state = state;
    }

    resetRegisterForm() {
        $('#reg-name, #reg-cpf, #reg-email, #reg-phone, #reg-otp').val('');
        $('#register-title').text('Criar Cadastro');
        $('#register-subtitle').text('Preencha seus dados para se cadastrar');
        $('#register-step1').removeClass('hidden');
        $('#register-step2').addClass('hidden');
    }

    init() {
        const _this = this;

        $('#reg-cpf').on('input', function() { $(this).val(formatCPF($(this).val())); });
        $('#reg-phone').on('input', function() { $(this).val(formatPhone($(this).val())); });
        $('#reg-otp').on('input', function() { $(this).val($(this).val().replace(/\D/g, '').slice(0, 6)); });

        $('#btn-back-login-from-register, #btn-back-login-from-otp').on('click', function() {
            _this.resetRegisterForm();
            showScreen('login');
        });

        $('#btn-register').on('click', function() {
            let name  = $.trim($('#reg-name').val());
            let cpf   = $('#reg-cpf').val();
            let email = $.trim($('#reg-email').val());
            let phone = $('#reg-phone').val();
            let cpfD  = cpf.replace(/\D/g, '');
            let phoneD= phone.replace(/\D/g, '');

            if (!validateCPF(cpf)) { toast('CPF inválido. Verifique os dígitos.', 'error'); return; }
            if (name.length < 3 || name.length > 255) { toast('Nome deve ter entre 3 e 255 caracteres.', 'error'); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Email inválido.', 'error'); return; }
            if (phoneD.length < 10 || phoneD.length > 11) { toast('Telefone deve ter 10 ou 11 dígitos.', 'error'); return; }

            showLoading();
            $('#btn-register').prop('disabled', true).text('Cadastrando...');

            _this.api.apiRegister(cpfD, name, email, phoneD).then(function() {
                toast('Cadastro realizado! Enviamos um código para seu email.', 'success');
                // Tentar enviar OTP automaticamente
                return _this.api.apiSendOtp(cpfD).catch(function() {});
            }).then(function() {
                $('#register-title').text('Verificar Código');
                $('#register-subtitle').text('Enviamos um código para ' + email + '. Insira-o abaixo.');
                $('#register-step1').addClass('hidden');
                $('#register-step2').removeClass('hidden');
            }).fail(function(err) {
                toast(err.message || 'Erro ao cadastrar.', 'error');
            }).always(function() {
                hideLoading();
                $('#btn-register').prop('disabled', false).text('Cadastrar');
            });
        });

        $('#btn-verify-otp').on('click', function() {
            let cpf = $('#reg-cpf').val().replace(/\D/g, '');
            let otp = $('#reg-otp').val().replace(/\D/g, '');
            if (!otp) { toast('Insira o código de verificação.', 'error'); return; }
            showLoading();
            $('#btn-verify-otp').prop('disabled', true).text('Verificando...');

            _this.api.apiValidateOtp(cpf, otp).then(function(res) {
                if (res && res.token) {
                    _this.state.token = res.token;
                    _this.state.tokenExpires = res.expires || null;
                    return apiMe().then(function(me) {
                        _this.state.user = { cpf: cpf, name: me.name, email: me.email, phone: me.phone, loggedInAt: Date.now() };
                        persist();
                        _this.resetRegisterForm();
                        loadExamsAndGoSelector();
                    });
                }
            }).fail(function() {
                toast('Código inválido. Tente novamente.', 'error');
            }).always(function() {
                hideLoading();
                $('#btn-verify-otp').prop('disabled', false).text('Verificar e entrar');
            });
        });

        $('#btn-resend-reg-otp').on('click', function() {
            let cpf = $('#reg-cpf').val().replace(/\D/g, '');
            showLoading();
            _this.api.apiSendOtp(cpf).then(function() {
                toast('Novo código enviado.', 'success');
            }).fail(function(err) {
                toast(err.message || 'Erro ao reenviar código.', 'error');
            }).always(hideLoading);
        });
    }
}