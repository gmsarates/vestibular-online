import { $ } from 'jquery';
import {
    showLoading,
    hideLoading,
    toast,
    persist,
    getSelectedExam,
    showModal,
    getOrCreateExamSessionId,
    wordCount,
    updateEditorBanners,
    defaultExamState,
    showScreen,
    updateEditorMeta,
    sanitizeExamHtml,
} from '../helper.js';

export class Editor {
    constructor(api, state, timer, opts = {}) {
        this.api = api;
        this.state = state;
        this.timer = timer;

        this.onGoHome = opts.onGoHome || null;
        this.onShowResult = opts.onShowResult || null;

        this._boundVisibility = () => this.handleVisibility();
        this._boundBeforeUnload = (e) => this.handleBeforeUnload(e);
    }

    registerGuards() {
        document.addEventListener('visibilitychange', this._boundVisibility);
        window.addEventListener('beforeunload', this._boundBeforeUnload);
    }

    removeGuards() {
        document.removeEventListener('visibilitychange', this._boundVisibility);
        window.removeEventListener('beforeunload', this._boundBeforeUnload);
    }

    handleVisibility() {
        if (!document.hidden)
            return;

        if (this.state.examState.status !== 'in_progress')
            return;

        this.state.examState.tabSwitchCount++;
        persist(this.state);
        updateEditorMeta(this.state);
        this.syncEssay().catch(function() {});

        $('#tab-switch-warning-count').text('Trocas detectadas: ' + this.state.examState.tabSwitchCount);
        $('#tab-warning').removeClass('hidden');
        setTimeout(function() { $('#tab-warning').addClass('hidden'); }, 5000);
    }

    handleBeforeUnload(e) {
        if (this.state.examState.status !== 'in_progress')
            return;
        e.preventDefault();
        e.returnValue = '';
    }

    syncEssay() {
        let exam = getSelectedExam(this.state);
        if (!exam)
            return $.Deferred().reject(new Error('Sem prova selecionada')).promise();

        let sessionId = getOrCreateExamSessionId(this.state);
        let words = wordCount(this.state.examState.essay || '');
        let elapsed = this.state.examState.startTimestamp ? Date.now() - this.state.examState.startTimestamp : 0;
        persist(this.state);

        return this.api.apiUpdateExam(exam.id, {
            attempt_id: this.state.examState.attemptId,
            session_id: sessionId,
            text: this.state.examState.essay,
            words_count: words,
            time_taken: elapsed,
            tabs_count: this.state.examState.tabSwitchCount,
        });
    }

    showAutosaveBadge() {
        $('#autosave-badge').removeClass('hidden');
        setTimeout(function() {
            $('#autosave-badge').addClass('hidden');
        }, 2000);
    }

    handleExpire() {
        if (this.state.examState.status !== 'expired')
            return;

        this.removeGuards();
        $('#essay-textarea').prop('disabled', true);
        updateEditorBanners(this.state);
        this.syncEssay().catch(function() {});
    }

    doSubmit() {
        let exam = getSelectedExam(this.state);
        if (!exam)
            return;

        let sessionId = getOrCreateExamSessionId(this.state);
        showLoading();
        this.api.apiSubmitExam(exam.id, this.state.examState.attemptId, sessionId).then(() => {
            this.state.examState.status = 'submitted';
            persist(this.state);
            this.timer.stop();
            this.removeGuards();

            $('#essay-textarea').prop('disabled', true);
            updateEditorBanners(this.state);
        }).fail((err) => {
            toast((err && err.message) || 'Erro ao enviar redação.', 'error');
        }).always(hideLoading);
    }

    doExitExam() {
        this.state.examState = defaultExamState();
        persist(this.state);
        this.timer.stop();
        this.removeGuards();

        if (this.onGoHome)
            this.onGoHome();
    }

    show() {
        let exam = getSelectedExam(this.state);
        if (!exam) {
            if (this.onGoHome) this.onGoHome();
            return;
        }

        $('#exam-header-name').text(exam.name);
        $('#exam-theme').text(exam.theme || '');
        $('#exam-instructions').html(exam.description ? sanitizeExamHtml(exam.description) : '');
        $('#essay-textarea')
            .val(this.state.examState.essay || '')
            .prop('disabled', this.state.examState.status !== 'in_progress');

        updateEditorMeta(this.state);
        updateEditorBanners(this.state);

        showScreen('exam');

        if (this.state.examState.status === 'in_progress') {
            this.registerGuards();
            this.timer.start({ onExpire: () => this.handleExpire() });
        } else {
            this.removeGuards();
            this.timer.stop();
        }
    }

    init() {
        // Textarea: editar redação
        $('#essay-textarea').on('input', () => {
            if (this.state.examState.status !== 'in_progress')
                return;

            this.state.examState.essay = $('#essay-textarea').val();
            updateEditorMeta(this.state);

            if (this.state.syncTimeout) clearTimeout(this.state.syncTimeout);
            this.state.syncTimeout = setTimeout(() => {
                this.syncEssay().then(() => {
                    this.showAutosaveBadge();
                }).catch(function() {});
            }, 3000);
        });

        // Bloquear paste/copy/cut
        $('#essay-textarea').on('paste', function(e) { e.preventDefault(); });
        $('#screen-exam').on('copy cut', function(e) { e.preventDefault(); });

        // Fullscreen
        $('#btn-fullscreen').on('click', function() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen && document.exitFullscreen();
            }
        });

        // Enviar redação
        $('#btn-submit-essay').on('click', () => {
            let words = wordCount(this.state.examState.essay || '');
            showModal({
                title: 'Enviar Redação',
                description: 'Tem certeza que deseja enviar sua redação? Esta ação não pode ser desfeita. Você escreveu <strong>' + words + ' palavras</strong>.',
                actions: [
                    { label: 'Cancelar', cls: 'btn-outline' },
                    { label: 'Enviar', cls: 'btn-primary', onClick: () => this.doSubmit() }
                ]
            });
        });

        // Sair da prova
        $('#btn-exit-exam').on('click', () => {
            showModal({
                title: 'Sair da Prova',
                description: 'Tem certeza que deseja sair? Seu progresso será perdido e você voltará para a lista de vestibulares.',
                actions: [
                    { label: 'Continuar Prova', cls: 'btn-outline' },
                    { label: 'Sair', cls: 'btn-primary', onClick: () => this.doExitExam() }
                ]
            });
        });

        // Banners: ir para resultado / voltar
        $('#btn-go-result-from-submitted, #btn-go-result-from-expired').on('click', () => {
            if (this.onShowResult) this.onShowResult();
        });
        $('#btn-go-home-from-submitted, #btn-go-home-from-expired').on('click', () => {
            if (this.onGoHome) this.onGoHome();
        });
    }
}

