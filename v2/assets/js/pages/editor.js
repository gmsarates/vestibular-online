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
    removeVisibilityListener,
    removeBeforeUnload,
    loadExamsAndGoSelector,
    updateEditorMeta,

} from "../helper.js";

import { $ } from "jquery";

export class Editor {
    constructor(api, state, timer) {
        this.api = api;
        this.state = state;
        this.timer = timer;
    }

    syncEssay() {
        let exam = getSelectedExam(this.state);

        if (!exam)
            return $.Deferred().reject(new Error('Sem prova selecionada')).promise();

        let sessionId = getOrCreateExamSessionId(this.state);
        let words = wordCount(this.state.examState.essay);
        let elapsed = this.state.examState.startTimestamp ? Date.now() - this.state.examState.startTimestamp : 0;
        persist();

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

    doSubmit() {
        const _this = this;
        let exam = getSelectedExam(this.state);

        if (!exam)
            return;

        let sessionId = getOrCreateExamSessionId(this.state);
        showLoading();
        this.api.apiSubmitExam(exam.id, this.state.examState.attemptId, sessionId).then(function() {
            _this.state.examState.status = 'submitted';
            persist();
            _this.timer.stopTimer();
            $('#essay-textarea').prop('disabled', true);
            updateEditorBanners(_this.state);
        }).fail(function(err) {
            toast(err.message || 'Erro ao enviar redação.', 'error');
        }).always(hideLoading);
    }

    doExitExam() {
        this.state.examState = defaultExamState();
        persist();
        this.timer.stopTimer();
        removeVisibilityListener();
        removeBeforeUnload();
        loadExamsAndGoSelector(this.api, this.state);
    }

    init() {
        // Textarea: editar redação
        $('#essay-textarea').on('input', function() {
            if (this.state.examState.status !== 'in_progress') return;
            this.state.examState.essay = $(this).val();
            updateEditorMeta();

            // Auto-sync com debounce de 5s
            if (this.state.syncTimeout) clearTimeout(this.state.syncTimeout);
            this.state.syncTimeout = setTimeout(function() {
                syncEssay().then(function() {
                    showAutosaveBadge();
                }).catch(function() {});
            }, 5000);
        });

        // Bloquear paste
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
        $('#btn-submit-essay').on('click', function() {
            let words = wordCount(state.examState.essay);
            showModal({
                title: 'Enviar Redação',
                description: 'Tem certeza que deseja enviar sua redação? Esta ação não pode ser desfeita. Você escreveu <strong>' + words + ' palavras</strong>.',
                actions: [
                    { label: 'Cancelar', cls: 'btn-outline' },
                    { label: 'Enviar', cls: 'btn-primary', onClick: doSubmit }
                ]
            });
        });

        // Sair da prova
        $('#btn-exit-exam').on('click', function() {
            showModal({
                title: 'Sair da Prova',
                description: 'Tem certeza que deseja sair? Seu progresso será perdido e você voltará para a lista de vestibulares.',
                actions: [
                    { label: 'Continuar Prova', cls: 'btn-outline' },
                    { label: 'Sair', cls: 'btn-primary', onClick: doExitExam }
                ]
            });
        });

        // Banners: ir para resultado / voltar
        $('#btn-go-result-from-submitted, #btn-go-result-from-expired').on('click', function() { showResultScreen(); });
        $('#btn-go-home-from-submitted, #btn-go-home-from-expired').on('click', function() { loadExamsAndGoSelector(); });
    }
}