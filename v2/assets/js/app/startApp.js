import { $ } from 'jquery';
import { createState } from './createState.js';
import { renderAppHtml } from './templates.js';
import { Client } from '../client.js';
import { Api } from '../api.js';
import { Timer } from '../helpers/timer.js';
import { Login } from '../pages/login.js';
import { Register } from '../pages/register.js';
import { ExamSelector } from '../pages/examSelector.js';
import { Editor } from '../pages/editor.js';
import { ResultPage } from '../pages/result.js';
import { LogoutButton } from '../components/logoutButton.js';
import {
    hydrate,
    showScreen,
    hideModal,
    clearStorage,
    defaultExamState,
} from '../helper.js';

export function startApp() {
    $(function () {
        renderAppHtml();

        const state = createState();
        hydrate(state);

        const timer = new Timer(state);

        const logout = () => {
            state.user = null;
            state.token = null;
            state.tokenExpires = null;
            state.exams = [];
            state.examState = defaultExamState();
            state.examSessionId = null;

            try { sessionStorage.removeItem('exam_session_id'); } catch(e) {}

            timer.stop();
            clearStorage(['user_session', 'app_token', 'exam_state']);
            showScreen('login');
        };

        const httpClient = new Client(state, {
            onSessionExpired: () => {
                timer.stop();
            }
        });

        const api = new Api(httpClient);

        const result = new ResultPage(state, {
            onGoHome: () => selector.show(),
            onShowExam: () => editor.show(),
            onLogout: () => logout(),
        });

        const editor = new Editor(api, state, timer, {
            onGoHome: () => selector.show(),
            onShowResult: () => result.show(),
        });

        const selector = new ExamSelector(api, state, {
            onShowExam: () => editor.show(),
        });

        const login = new Login(api, state, {
            onLoggedIn: () => selector.show({ resumeExam: true }),
        });

        const register = new Register(api, state, {
            onLoggedIn: () => selector.show({ resumeExam: true }),
        });

        const logoutButton = new LogoutButton({ onLogout: () => logout() });

        $('#modal-overlay').on('click', function(e) {
            if ($(e.target).is('#modal-overlay'))
                hideModal();
        });

        login.init();
        register.init();
        selector.init();
        editor.init();
        result.init();
        logoutButton.init();

        console.log('[state]', state)

        if (state.user && state.token) {
            selector.show({ resumeExam: true });
        } else {
            showScreen('login');
        }

    });
}
