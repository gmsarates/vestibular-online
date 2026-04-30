import { $ } from 'jquery';
import { wordCount } from './format.js';
import { getSelectedExam } from './exam.js';

export function updateEditorBanners(state) {
    var st = state.examState.status;
    $('#banner-submitted').toggleClass('hidden', st !== 'submitted');
    $('#banner-expired').toggleClass('hidden', st !== 'expired');
    $('#exam-actions').toggleClass('hidden', st !== 'in_progress');
}

export function updateEditorMeta(state) {
    var text = state.examState.essay || '';
    var words = wordCount(text);
    var chars = text.length;
    var exam = getSelectedExam(state);
    var minW = exam ? (exam.min_words || exam.minWords || 0) : 0;
    var progress = minW > 0 ? Math.min(100, (words / minW) * 100) : 0;

    $('#char-count').text(chars + ' caracteres');
    $('#word-count').text(words + ' palavras');
    $('#tab-count').text(state.examState.tabSwitchCount + ' trocas de abas');

    var fill = $('#progress-fill');
    fill.css('width', progress + '%');
    fill.toggleClass('complete', progress >= 100);
    $('#progress-label').text(words + '/' + minW + ' min');

    $('#btn-submit-essay').prop('disabled', words < 10);
}

