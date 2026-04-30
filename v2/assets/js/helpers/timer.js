import { $ } from "jquery";
import {
    getSelectedExam,
} from "../helper";

export class Timer {
    constructor(state) {
        this.state = state;
    }

    startTimer() {
        this.stopTimer();
        if (this.state.examState.status !== 'in_progress') return;
        this.updateTimer();
        this.state.timerInterval = setInterval(this.updateTimer, 1000);
    }

    stopTimer() {
        if (this.state.timerInterval) { clearInterval(this.state.timerInterval); this.state.timerInterval = null; }
    }

    updateTimer() {
        let exam = getSelectedExam(this.state);
        if (!exam || this.state.examState.status !== 'in_progress') {
            $('#exam-timer').text('');
            this.stopTimer();
            return;
        }
        let dur = (exam.duration || exam.durationMinutes || 0) * 60 * 1000;
        let elapsed = this.state.examState.startTimestamp ? Date.now() - this.state.examState.startTimestamp : 0;
        let left = Math.max(0, dur - elapsed);
        let totalSec = Math.ceil(left / 1000);
        let h = Math.floor(totalSec / 3600);
        let m = Math.floor((totalSec % 3600) / 60);
        let s = totalSec % 60;
        let pad = function(n) { return ('0' + n).slice(-2); };

        let timerEl = $('#exam-timer');
        let display = (h > 0 ? pad(h) + ':' : '') + pad(m) + ':' + pad(s);
        timerEl.html('<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"/></svg> ' + display);

        timerEl.removeClass('low critical');
        if (totalSec < 60) timerEl.addClass('critical');
        else if (totalSec < 300) timerEl.addClass('low');

        if (left <= 0) {
            this.state.examState.status = 'expired';
            persist();
            this.stopTimer();
            $('#essay-textarea').prop('disabled', true);
            updateEditorBanners();
            // Tentar submeter automaticamente no backend
            syncEssay().catch(function() {});
        }
    }
}