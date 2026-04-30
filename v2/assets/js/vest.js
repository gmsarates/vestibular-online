import { config } from './config'
import { Client } from "./client.js";
import { Api } from "./api.js";
import { Timer } from "./helpers/timer.js";
import { Login } from "./pages/login.js";
import { Register } from "./pages/register.js";
import { $ } from 'jquery'
import {
    clearStorage,
    hideModal,
    formatCPF,
    validateCPF,
    formatPhone,
    sanitizeExamHtml,
    extractAttemptUuid,
    formatDuration,
    wordCount,
    hydrate,
    showScreen,
    loadExamsAndGoSelector,

} from './helper.js';

$(function () {
    const state = {
        user: null,         // { cpf, name, email, phone, loggedInAt }
        token: null,
        tokenExpires: null,
        examState: {
            essay: '',
            status: 'idle',   // 'idle' | 'in_progress' | 'submitted' | 'expired'
            selectedExamId: null,
            startTimestamp: null,
            attemptId: null,
            tabSwitchCount: 0,
            result: { status: 'awaiting', grade: null, feedback: null },
        },
        exams: [],          // ExamConfig[]
        examSessionId: null,
        timerInterval: null,
        syncTimeout: null,
    };

    const httpClient = new Client(state)
    const api = new Api(httpClient)
    const timer = new Timer(state)



    $('#modal-overlay').on('click', function(e) {
        if ($(e.target).is('#modal-overlay'))
            hideModal();
    });


    function init() {
        hydrate(state);

        const login = new Login(api, state)
        login.init()

        if (state.user && state.token) {
            // Recarregar exames e ir para seleção
            loadExamsAndGoSelector(api, state);
        } else {
            showScreen('login');
        }
    }


    // =========================================================
    // TELA: EDITOR DE REDAÇÃO
    // =========================================================





    // =========================================================
    // TIMER
    // =========================================================


    // =========================================================
    // VISIBILIDADE (troca de aba)
    // =========================================================
    function handleVisibility() {
        if (document.hidden && state.examState.status === 'in_progress') {
            state.examState.tabSwitchCount++;
            persist();
            updateEditorMeta();
            syncEssay().catch(function() {});

            $('#tab-switch-warning-count').text('Trocas detectadas: ' + state.examState.tabSwitchCount);
            $('#tab-warning').removeClass('hidden');
            setTimeout(function() { $('#tab-warning').addClass('hidden'); }, 5000);
        }
    }

    function registerVisibilityListener() {
        document.addEventListener('visibilitychange', handleVisibility);
    }
    function removeVisibilityListener() {
        document.removeEventListener('visibilitychange', handleVisibility);
    }

    // =========================================================
    // BEFORE UNLOAD
    // =========================================================
    function handleBeforeUnload(e) {
        if (state.examState.status === 'in_progress') {
            e.preventDefault();
            e.returnValue = '';
        }
    }
    function registerBeforeUnload() { window.addEventListener('beforeunload', handleBeforeUnload); }
    function removeBeforeUnload()  { window.removeEventListener('beforeunload', handleBeforeUnload); }

    // =========================================================
    // TELA: RESULTADO
    // =========================================================
    function showResultScreen() {
        var result = state.examState.result || { status: 'awaiting', grade: null, feedback: null };
        var exam = getSelectedExam();

        $('#result-exam-info').text(exam ? exam.name + (exam.institution ? ' — ' + exam.institution : '') : '');

        // Status
        var statusMap = {
            awaiting: 'Aguardando correção',
            approved: 'Aprovado',
            rejected: 'Reprovado',
        };
        var statusLabel = statusMap[result.status] || statusMap.awaiting;
        $('#result-status-text').text(statusLabel).attr('class', 'result-status ' + (result.status || 'awaiting'));

        // Exam status
        var examStatusMap = { submitted: '✓ Enviada', expired: '⏱ Expirada', in_progress: 'Em andamento', idle: 'Não iniciada' };
        $('#result-exam-status').text(examStatusMap[state.examState.status] || 'Não iniciada');

        // Grade
        if (result.grade !== null && result.grade !== undefined) {
            $('#result-grade').html(result.grade + '<small>/1000</small>');
            $('#result-grade-wrap').removeClass('hidden');
        } else {
            $('#result-grade-wrap').addClass('hidden');
        }

        // Feedback
        if (result.feedback) {
            $('#result-feedback').text(result.feedback);
            $('#result-feedback-wrap').removeClass('hidden');
        } else {
            $('#result-feedback-wrap').addClass('hidden');
        }

        showScreen('result');
    }

    $('#btn-result-back').on('click', function() {
        if (state.examState.status === 'in_progress') { showExamScreen(); }
        else { loadExamsAndGoSelector(); }
    });

    $('#btn-result-logout').on('click', doLogout);

    // =========================================================
    // UTILITÁRIO: Escape HTML
    // =========================================================


    // =========================================================
    // INICIALIZAÇÃO
    // =========================================================
    init();

});
