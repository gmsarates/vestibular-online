import { $ } from "jquery";

const ALLOWED_TAGS = ['p','br','strong','em','b','i','u','span','ul','ol','li'];

export function defaultExamState() {
    return {
        essay: '',
        status: 'idle',
        selectedExamId: null,
        startTimestamp: null,
        attemptId: null,
        tabSwitchCount: 0,
        result: {
            status: 'awaiting',
            grade: null,
            feedback: null
        }
    };
}

export function obfuscate(str) {
    try {
        return btoa(encodeURIComponent(str));
    } catch(e) {
        return '';
    }
}

export function deobfuscate(str) {
    try {
        return decodeURIComponent(atob(str));
    } catch(e) {
        return '';
    }
}

export function saveStorage(key, val) {
    try {
        localStorage.setItem(key, obfuscate(JSON.stringify(val)));
    } catch(e) {

    }
}

export function loadStorage(key) {
    try {
        let r = localStorage.getItem(key);
        return r ? JSON.parse(deobfuscate(r)) : null;
    } catch(e) {
        return null;
    }
}

export function clearStorage(keys) {
    $.each(keys, function(_, k) {
        localStorage.removeItem(k);
    });
}

export function toast(msg, type) {
    let t = $('<div class="toast"></div>').text(msg);

    if (type === 'error')
        t.addClass('error');

    if (type === 'success')
        t.addClass('success');

    $('#toast-container').append(t);

    setTimeout(function() {
        t.fadeOut(300, function() {
            $(this).remove();
        });
    }, 3500);
}
export function showScreen(name) {
    $('.screen').addClass('hidden');
    $('#screen-' + name).removeClass('hidden');
}

export function hideModal() {
    $('#modal-overlay').addClass('hidden');
}

export function showModal(opts) {
    opts = {
        title: '',
        description: '',
        actions: [
            {
                label: 'Fechar',
                cls: null,
                onClick: () => {}
            }
        ],
        ...opts,
    }

    $('#modal-title').text(opts.title);
    $('#modal-description').html(opts.description);

    let footer = $('#modal-footer').empty();

    $.each(opts.actions, function(_, a) {
        let btn = $('<button class="btn"></button>')
            .addClass(a.cls || 'btn-outline')
            .text(a.label);

        btn.on('click', function() {
            hideModal();

            if (a.onClick)
                a.onClick();
        });

        footer.append(btn);
    });
    $('#modal-overlay').removeClass('hidden');
}

export function formatCPF(val) {
    let d = val.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0,3) + '.' + d.slice(3);
    if (d.length <= 9) return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6);
    return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6,9) + '-' + d.slice(9);
}

export function validateCPF(cpf) {
    let d = cpf.replace(/\D/g, '');
    if (d.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(d)) return false;
    let sum = 0, rem;
    for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
    rem = (sum * 10) % 11; if (rem === 10) rem = 0;
    if (rem !== parseInt(d[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
    rem = (sum * 10) % 11; if (rem === 10) rem = 0;
    return rem === parseInt(d[10]);
}

export function formatPhone(val) {
    let d = val.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return '(' + d.slice(0,2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0,2) + ') ' + d.slice(2,6) + '-' + d.slice(6);
    return '(' + d.slice(0,2) + ') ' + d.slice(2,7) + '-' + d.slice(7);
}

export function decodeHtmlEntities(str) {
    return str.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
        .replace(/&#(\d+);/g, function(_,d){ return String.fromCodePoint(parseInt(d)); })
        .replace(/&#x([0-9a-fA-F]+);/g, function(_,h){ return String.fromCodePoint(parseInt(h,16)); });
}

export function sanitizeBasicHtml(html) {
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    html = html.replace(/<\/?([a-zA-Z0-9-]+)(\s[^>]*)?>/g, function(full, tag) {
        let t = tag.toLowerCase();
        if (ALLOWED_TAGS.indexOf(t) === -1) return '';
        return full.startsWith('</') ? '</' + t + '>' : '<' + t + '>';
    });
    html = html.replace(/javascript:/gi, '');
    return html;
}

export function sanitizeExamHtml(raw) {
    return sanitizeBasicHtml(decodeHtmlEntities(raw));
}

export function isUuid(s) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export function extractAttemptUuid(payload) {
    if (!payload) return null;
    if (typeof payload === 'string' && isUuid(payload)) return payload;
    if (payload.uuid && isUuid(payload.uuid)) return payload.uuid;
    if (payload.id && isUuid(payload.id)) return payload.id;
    if (payload.data) {
        if (payload.data.uuid && isUuid(payload.data.uuid)) return payload.data.uuid;
        if (payload.data.id && isUuid(payload.data.id)) return payload.data.id;
    }
    return null;
}

export function formatDuration(minutes) {
    let h = Math.floor(minutes / 60), m = minutes % 60, parts = [];
    if (h > 0) parts.push(('0' + h).slice(-2) + ' hora' + (h > 1 ? 's' : ''));
    if (m > 0) parts.push(('0' + m).slice(-2) + ' minuto' + (m > 1 ? 's' : ''));
    return parts.join(' e ');
}

export function wordCount(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function escHtml(str) {
    return $('<div>').text(str || '').html();
}

export function showLoading() {
    $('#global-loading').removeClass('hidden');
}

export function hideLoading() {
    $('#global-loading').addClass('hidden');
}

export function getOrCreateExamSessionId(state) { // SESSION ID DA TENTATIVA (por aba)
    if (state.examSessionId) return state.examSessionId;
    let id = sessionStorage.getItem('exam_session_id');

    if (!id) {
        id = 'sess-' + Math.random().toString(36).substr(2, 12) + '-' + Date.now();
        sessionStorage.setItem('exam_session_id', id);
    }

    state.examSessionId = id;
    return id;
}

export function hydrate(state) {
    state.user      = loadStorage('user_session');
    state.token     = loadStorage('app_token');
    let saved       = loadStorage('exam_state');

    if (saved)
        state.examState = $.extend(true, state.examState, saved);

    if (!state.examState.result)
        state.examState.result = {
            status: 'awaiting',
            grade: null,
            feedback: null
        };
}

export function persist(state) {
    saveStorage('user_session', state.user);
    saveStorage('app_token', state.token);
    saveStorage('exam_state', state.examState);
}

export function renderExams(exams, state) {
    let list = $('#exams-list').empty();
    if (!exams || exams.length === 0) {
        list.append('<p style="text-align:center;color:var(--muted-foreground);padding:2.5rem 0;">Nenhuma prova disponível no momento.</p>');
        return;
    }

    $.each(exams, function(_, exam) {
        let disabled = exam.attempt != null;
        let selected = state.examState.selectedExamId === exam.id;
        let card = $('<div class="exam-card"></div>')
            .toggleClass('selected', selected)
            .toggleClass('disabled', disabled)
            .attr('data-id', exam.id);

        let minW = exam.min_words || exam.minWords || 0;
        let maxW = exam.max_words || exam.maxWords || 0;
        let dur  = exam.duration ? formatDuration(exam.duration) : '—';

        card.html(
            '<p class="exam-card-title">' + escHtml(exam.name) + '</p>' +
            '<div class="exam-card-meta">' +
            '<span><strong>Duração:</strong> ' + escHtml(dur) + '</span>' +
            '<span><strong>Conteúdo:</strong> de ' + minW + ' a ' + maxW + ' palavras</span>' +
            '</div>'
        );

        card.on('click', function() {
            if (disabled) {
                // Mostrar modal de tentativa em aberto
                let atStart = exam.attempt && exam.attempt.created_at_timestamp ? exam.attempt.created_at_timestamp : null;
                let dur = exam.duration || exam.durationMinutes || 0;
                let left = atStart ? Math.max(0, dur - Math.floor((Date.now() - atStart) / 60000)) : 0;
                showModal({
                    title: 'Tentativa em aberto',
                    description: 'Você já iniciou a realização da prova <strong>' + escHtml(exam.name) + '</strong> e não pode iniciar novamente. Você precisa esperar o tempo total da prova. Atualmente, faltam <strong>' + formatDuration(left) + '</strong>.',
                    actions: [{ label: 'Fechar', cls: 'btn-outline' }]
                });
            } else {
                state.examState.selectedExamId = exam.id;
                persist();
                $('.exam-card').removeClass('selected');
                card.addClass('selected');
                updateStartBar(state);
            }
        });

        list.append(card);
    });
}

export function updateStartBar(state) {
    if (state.examState.selectedExamId) {
        $('#start-exam-bar').removeClass('hidden');
    } else {
        $('#start-exam-bar').addClass('hidden');
    }
}

export function loadExamsAndGoSelector(api, state) {
    showScreen('selector');

    $('#greeting-name').text('Olá, ' + (state.user ? state.user.name : 'bem-vindo') + '!');
    renderExams([]);
    showLoading();

    api.apiListExams().then(function(list) {
        // Filtrar exames ativos
        state.exams = $.grep(list, function(e) { return e.active; });
        renderExams(state.exams);

        // Verificar se há seleção válida
        if (state.examState.selectedExamId) {
            var still = $.grep(state.exams, function(e) { return e.id === state.examState.selectedExamId; }).length > 0;
            if (!still) { state.examState.selectedExamId = null; persist(); }
            else { updateStartBar(); }
        }
    }).fail(function() {
        toast('Erro ao carregar provas. Verifique sua conexão.', 'error');
        renderExams([]);
    }).always(hideLoading);
}

export function getSelectedExam(state) {
    if (!state.examState.selectedExamId) return null;
    let found = null;
    $.each(state.exams, function(_, e) {
        if (e.id === state.examState.selectedExamId) {
            found = e; return false;
        }
    });

    return found;
}

export function showExamScreen(state, timer) {
    var exam = getSelectedExam();
    if (!exam) { showScreen('selector'); return; }

    $('#exam-header-name').text(exam.name);
    $('#exam-theme').text(exam.theme || '');
    $('#exam-instructions').html(exam.description ? sanitizeExamHtml(exam.description) : '');
    $('#essay-textarea').val(state.examState.essay).prop('disabled', state.examState.status !== 'in_progress');
    updateEditorMeta();
    updateEditorBanners();

    showScreen('exam');
    timer.startTimer();
    registerVisibilityListener();
    registerBeforeUnload();
}

export function updateEditorBanners(state) {
    var st = state.examState.status;
    $('#banner-submitted').toggleClass('hidden', st !== 'submitted');
    $('#banner-expired').toggleClass('hidden', st !== 'expired');
    $('#exam-actions').toggleClass('hidden', st !== 'in_progress');
}

export function updateEditorMeta() {
    var text = state.examState.essay;
    var words = wordCount(text);
    var chars = text.length;
    var exam = getSelectedExam();
    var minW = exam ? (exam.min_words || exam.minWords || 0) : 0;
    var progress = minW > 0 ? Math.min(100, (words / minW) * 100) : 0;

    $('#char-count').text(chars + ' caracteres');
    $('#word-count').text(words + ' palavras');
    $('#tab-count').text(state.examState.tabSwitchCount + ' trocas de abas');

    var fill = $('#progress-fill');
    fill.css('width', progress + '%');
    fill.toggleClass('complete', progress >= 100);
    $('#progress-label').text(words + '/' + minW + ' min');

    // Habilitar botão de enviar se >= 10 palavras
    $('#btn-submit-essay').prop('disabled', words < 10);
}
