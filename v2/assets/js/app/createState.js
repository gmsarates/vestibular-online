import { defaultExamState } from '../helper.js';

export function createState() {
    return {
        user: null,
        token: null,
        tokenExpires: null,
        examState: defaultExamState(),
        exams: [],
        examSessionId: null,
        timerInterval: null,
        syncTimeout: null,
    };
}

