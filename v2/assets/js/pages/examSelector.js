import { $ } from 'jquery';
import {
    showLoading,
    hideLoading,
    toast,
    persist,
    getSelectedExam,
    showModal,
    getOrCreateExamSessionId,
    extractAttemptUuid,
    showScreen,
    escHtml,
    formatDuration,
} from '../helper.js';

export class ExamSelector {
    constructor(api, state, opts = {}) {
        this.api = api;
        this.state = state;
        this.onShowExam = opts.onShowExam || null;
    }

    updateStartBar() {
        $('#start-exam-bar').toggleClass('hidden', !this.state.examState.selectedExamId);
    }

    renderExams(exams) {
        let list = $('#exams-list').empty();

        if (!exams || exams.length === 0) {
            list.append('<p style="text-align:center;color:var(--muted-foreground);padding:2.5rem 0;">Nenhuma prova disponível no momento.</p>');
            return;
        }

        $.each(exams, (_, exam) => {
            let disabled = exam.attempt != null && exam.attempt.status === 'ATTEMPT_IN_PROGRESS';
            let done = exam.attempt !== null && exam.attempt.status !== 'ATTEMPT_IN_PROGRESS'
            let selected = this.state.examState.selectedExamId === exam.id;
            let card = $('<div class="exam-card"></div>')
                .toggleClass('selected', selected)
                .toggleClass('disabled', disabled)
                .attr('data-id', exam.id);

            let minW = exam.min_words || exam.minWords || 0;
            let maxW = exam.max_words || exam.maxWords || 0;
            let dur = exam.duration ? formatDuration(exam.duration) : '—';

            card.html(
                '<p class="exam-card-title">' + escHtml(exam.name) + '</p>' +
                '<div class="exam-card-meta">' +
                '<span><strong>Duração:</strong> ' + escHtml(dur) + '</span>' +
                '<span><strong>Conteúdo:</strong> de ' + minW + ' a ' + maxW + ' palavras</span>' +
                '</div>'
            );

            card.on('click', () => {
                if (disabled) {
                    let attemptStart = exam.attempt && exam.attempt.created_at_timestamp ? exam.attempt.created_at_timestamp : null;
                    let durationMinutes = exam.duration || exam.durationMinutes || 0;
                    let left = attemptStart ? Math.max(0, durationMinutes - Math.floor((Date.now() - attemptStart) / 60000)) : 0;

                    showModal({
                        title: 'Tentativa em aberto',
                        description: 'Você já iniciou a realização da prova <strong>' + escHtml(exam.name) + '</strong> e não pode iniciar novamente. Você precisa esperar o tempo total da prova. Atualmente, faltam <strong>' + formatDuration(left) + '</strong>.',
                        actions: [{ label: 'Fechar', cls: 'btn-outline' }]
                    });
                    return;
                } else if (done) {
                    this.state.examState.selectedExamId = exam.id;
                    persist(this.state);
                    this.onShowExam();
                }

                this.state.examState.selectedExamId = exam.id;
                persist(this.state);
                $('.exam-card').removeClass('selected');
                card.addClass('selected');
                this.updateStartBar();
            });

            list.append(card);
        });
    }

    loadExams() {
        $('#exams-list').empty().append(
            '<div class="loading-spinner-wrap"><div class="spinner"></div></div>'
        );

        showLoading();
        return this.api.apiListExams().then((list) => {
            console.log('[examSelector.js] list', list)
            this.state.exams = $.grep(list, (e) => e.active);

            if (this.state.examState.selectedExamId) {
                let still = $.grep(this.state.exams, (e) => e.id === this.state.examState.selectedExamId).length > 0;
                if (!still) {
                    this.state.examState.selectedExamId = null;
                    persist(this.state);
                }
            }

            this.renderExams(this.state.exams);
            this.updateStartBar();
        }).fail(() => {
            toast('Erro ao carregar provas. Verifique sua conexão.', 'error');
            this.state.exams = [];
            this.renderExams([]);
            this.updateStartBar();
        }).always(hideLoading);
    }

    doStartExam() {
        let sessionId = getOrCreateExamSessionId(this.state);

        showLoading();
        return this.api.apiStartExam(this.state.examState.selectedExamId, sessionId).then((res) => {
            let attemptId = extractAttemptUuid(res);

            if (!attemptId)
                throw new Error('Falha ao iniciar a prova: tentativa inválida.');

            this.state.examState.status = 'in_progress';
            this.state.examState.startTimestamp = Date.now();
            this.state.examState.attemptId = attemptId;
            this.state.examState.essay = '';
            this.state.examState.tabSwitchCount = 0;
            persist(this.state);

            if (this.onShowExam)
                this.onShowExam();
        }).fail((err) => {
            let msg = err && err.message ? err.message : 'Falha ao iniciar a tentativa.';
            if (msg === 'Multiple attempts') toast('Você já possui uma tentativa em andamento.', 'error');
            else toast(msg, 'error');
        }).always(hideLoading);
    }

    show(opts = {}) {
        showScreen('selector');
        $('#greeting-name').text('Olá, ' + (this.state.user ? this.state.user.name : 'bem-vindo') + '!');
        this.updateStartBar();

        return this.loadExams().then(() => {
            if (opts.resumeExam && this.state.examState.status === 'in_progress' && getSelectedExam(this.state) && this.onShowExam)
                this.onShowExam();
        });
    }

    init() {
        $('#btn-start-exam').on('click', () => {
            let exam = getSelectedExam(this.state);

            if (!exam) {
                toast('Selecione um vestibular para iniciar.', 'error');
                return;
            }

            showModal({
                title: 'Iniciar Prova',
                description: 'Você está prestes a iniciar a prova <strong>"' + escHtml(exam.name) + '"</strong>. O cronômetro de ' + escHtml(exam.duration ? formatDuration(exam.duration) : '—') + ' começará imediatamente. <strong>Você pode realizar esta prova apenas uma vez</strong>.',
                actions: [
                    { label: 'Cancelar', cls: 'btn-outline' },
                    { label: 'Iniciar', cls: 'btn-primary', onClick: () => this.doStartExam() }
                ]
            });
        });
    }
}

