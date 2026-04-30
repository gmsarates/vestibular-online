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

export function getSelectedExam(state) {
    if (!state.examState.selectedExamId) return null;

    for (const exam of (state.exams || [])) {
        if (exam && exam.id === state.examState.selectedExamId)
            return exam;
    }

    return null;
}

