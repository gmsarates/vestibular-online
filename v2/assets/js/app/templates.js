import toastHtml from '../../html/toast.html?raw';
import modalHtml from '../../html/modal.html?raw';
import loginHtml from '../../html/screen-login.html?raw';
import registerHtml from '../../html/screen-register.html?raw';
import selectorHtml from '../../html/screen-selector.html?raw';
import examHtml from '../../html/screen-exam.html?raw';
import resultHtml from '../../html/screen-result.html?raw';
import globalLoadingHtml from '../../html/global-loading.html?raw';

export function renderAppHtml() {
    const root = document.getElementById('app');
    if (!root)
        throw new Error('Elemento #app não encontrado no index.html');

    root.innerHTML = [
        toastHtml,
        modalHtml,
        loginHtml,
        registerHtml,
        selectorHtml,
        examHtml,
        resultHtml,
        globalLoadingHtml,
    ].join('\n');
}

