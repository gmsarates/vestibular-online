import {
    showLoading,
    hideLoading,
    toast,
    persist,
    getSelectedExam,
    showModal,
    getOrCreateExamSessionId,
    extractAttemptUuid,
    showExamScreen,
    escHtml,
    formatDuration,
} from "../helper.js";

import { $ } from "jquery";

export class ExamSelector {
    constructor(api, state, timer) {
        this.api = api;
        this.state = state;
        this.timer = timer;
    }

    doStartExam() {
        const _this = this;
        let sessionId = getOrCreateExamSessionId();
        showLoading();
        this.api.apiStartExam(this.state.examState.selectedExamId, sessionId).then(function(res) {
            let attemptId = extractAttemptUuid(res);

            if (!attemptId)
                throw new Error('Falha ao iniciar a prova: tentativa inválida.');

            _this.state.examState.status = 'in_progress';
            _this.state.examState.startTimestamp = Date.now();
            _this.state.examState.attemptId = attemptId;
            _this.state.examState.essay = '';
            _this.state.examState.tabSwitchCount = 0;
            persist();
            showExamScreen(this.state, this.timer);
        }).fail(function(err) {
            let msg = err.message || 'Falha ao iniciar a tentativa.';
            if (msg === 'Multiple attempts') {
                toast('Você já possui uma tentativa em andamento.', 'error');
            } else {
                toast(msg, 'error');
            }
        }).always(hideLoading);
    }

    init() {
        const _this = this;

        // Botão Iniciar Prova
        $('#btn-start-exam').on('click', function() {
            let exam = getSelectedExam();

            if (!exam) {
                toast('Selecione um vestibular para iniciar.', 'error');
                return;
            }

            showModal({
                title: 'Iniciar Prova',
                description: 'Você está prestes a iniciar a prova <strong>"' + escHtml(exam.name) + '"</strong>. O cronômetro de ' + escHtml(exam.duration ? formatDuration(exam.duration) : '—') + ' começará imediatamente. <strong>Você pode realizar esta prova apenas uma vez</strong>.',
                actions: [
                    { label: 'Cancelar', cls: 'btn-outline' },
                    { label: 'Iniciar', cls: 'btn-primary', onClick: _this.doStartExam }
                ]
            });
        });
    }
}