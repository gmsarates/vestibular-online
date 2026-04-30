import { $ } from 'jquery';
import { loadStorage, saveStorage } from './storage.js';

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

export function hydrate(state) {
    state.user = loadStorage('user_session');
    state.token = loadStorage('app_token');
    let saved = loadStorage('exam_state');

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

