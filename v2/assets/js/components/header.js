import {
    showScreen,
    defaultExamState,
    clearStorage,
    stopTimer,
    showModal
} from "../helper.js";

import { $ } from "jquery";

export class Header {
    constructor(api, state) {
        this.api = api;
        this.state = state;
    }

    doLogout() {
        this.state.user = null;
        this.state.token = null;
        this.state.exams = [];
        this.state.examState = defaultExamState();
        clearStorage(['user_session', 'app_token', 'exam_state']);
        stopTimer();
        showScreen('login');
    }

    init() {
        const _this = this;
        // Logout
        $('#btn-logout').on('click', function() {
            showModal({
                title: 'Sair da plataforma',
                description: 'Tem certeza que deseja sair? Sua sessão será encerrada.',
                actions: [
                    { label: 'Cancelar', cls: 'btn-outline' },
                    { label: 'Sair', cls: 'btn-primary', onClick: _this.doLogout }
                ]
            });
        });
    }
}