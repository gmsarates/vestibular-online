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
    doStartExam
} from "../helper.js";

import { $ } from "jquery";

export class ExamSelector {
    constructor(api, state, timer) {
        this.api = api;
        this.state = state;
        this.timer = timer;
    }

    init() {

    }
}