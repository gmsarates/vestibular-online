import { config } from './config.js'
import { $ } from 'jquery'
import { clearStorage, toast, showScreen, defaultExamState } from './helper.js'

export class Client {
    constructor(state, opts = {}) {
        this.state = state;
        this.onSessionExpired = opts.onSessionExpired || null;
    }

    handleExpiredSession() {
        this.state.token = null;
        this.state.user = null;
        this.state.exams = [];
        this.state.examState = defaultExamState();

        clearStorage(['user_session', 'app_token', 'exam_state']);
        showScreen('login');
        toast('Sua sessão expirou. Faça login novamente.', 'error');

        if (this.onSessionExpired)
            this.onSessionExpired();
    }

    handleResponse(response) {
        console.log('[client.js] Response:', response);
        if (response.data) {
            if (response.data.attributes) {
                return {
                    id: response.data.id,
                    ...response.data.attributes
                }
            } else if (response.data.length) {
                return response.data.map(item => ({
                    id: item.id,
                    ...item.attributes
                }))
            }
        }

        return response
    }

    http(method, path, data) {
        const _this = this;

        let headers = { 'Content-Type': 'application/json' };

        if (this.state.token)
            headers['Authorization'] = 'Bearer ' + this.state.token;

        return $.ajax({
            url: config.apiUrl + path,
            method: method,
            contentType: 'application/json',
            data: data ? JSON.stringify(data) : undefined,
            headers: headers,
        }).then(function(res) {
            return _this.handleResponse(res);
        }, function(xhr) {
            var msg = 'Erro de conexão.';
            try { msg = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : msg; } catch(e) {}
            if (msg === 'Sessão expirada' || xhr.status === 401) { _this.handleExpiredSession(); }
            return $.Deferred().reject(new Error(msg)).promise();
        });
    }

    get(path) {
        return this.http('GET', path);
    }
    post(path, data) {
        return this.http('POST', path, data);
    }
    put(path, data) {
        return this.http('PUT', path, data);
    }
}
