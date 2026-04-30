export {
    obfuscate,
    deobfuscate,
    saveStorage,
    loadStorage,
    clearStorage,
} from './helpers/storage.js';

export {
    defaultExamState,
    hydrate,
    persist,
} from './helpers/state.js';

export {
    toast,
    showScreen,
    showLoading,
    hideLoading,
    hideModal,
    showModal,
} from './helpers/ui.js';

export {
    formatCPF,
    validateCPF,
    formatPhone,
    formatDuration,
    wordCount,
    escHtml,
} from './helpers/format.js';

export {
    decodeHtmlEntities,
    sanitizeBasicHtml,
    sanitizeExamHtml,
} from './helpers/sanitize.js';

export {
    isUuid,
    extractAttemptUuid,
} from './helpers/uuid.js';

export {
    getOrCreateExamSessionId,
    getSelectedExam,
} from './helpers/exam.js';

export {
    updateEditorBanners,
    updateEditorMeta,
} from './helpers/editorUi.js';

