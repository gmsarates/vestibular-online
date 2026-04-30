import { $ } from 'jquery';
import { getSelectedExam, showScreen } from '../helper.js';

export class ResultPage {
    constructor(state, opts = {}) {
        this.state = state;
        this.onGoHome = opts.onGoHome || null;
        this.onShowExam = opts.onShowExam || null;
        this.onLogout = opts.onLogout || null;
    }

    show() {
        let result = this.state.examState.result || { status: 'awaiting', grade: null, feedback: null };
        let exam = getSelectedExam(this.state);

        $('#result-exam-info').text(exam ? exam.name + (exam.institution ? ' — ' + exam.institution : '') : '');

        let statusMap = {
            awaiting: 'Aguardando correção',
            approved: 'Aprovado',
            rejected: 'Reprovado',
        };
        let statusLabel = statusMap[result.status] || statusMap.awaiting;
        $('#result-status-text').text(statusLabel).attr('class', 'result-status ' + (result.status || 'awaiting'));

        let examStatusMap = { submitted: '✓ Enviada', expired: '⏱ Expirada', in_progress: 'Em andamento', idle: 'Não iniciada' };
        $('#result-exam-status').text(examStatusMap[this.state.examState.status] || 'Não iniciada');

        if (result.grade !== null && result.grade !== undefined) {
            $('#result-grade').html(result.grade + '<small>/1000</small>');
            $('#result-grade-wrap').removeClass('hidden');
        } else {
            $('#result-grade-wrap').addClass('hidden');
        }

        if (result.feedback) {
            $('#result-feedback').text(result.feedback);
            $('#result-feedback-wrap').removeClass('hidden');
        } else {
            $('#result-feedback-wrap').addClass('hidden');
        }

        showScreen('result');
    }

    init() {
        $('#btn-result-back').on('click', () => {
            if (this.state.examState.status === 'in_progress') {
                if (this.onShowExam) this.onShowExam();
            } else {
                if (this.onGoHome) this.onGoHome();
            }
        });

        $('#btn-result-logout').on('click', () => {
            if (this.onLogout) this.onLogout();
        });
    }
}

