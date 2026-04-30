import { config } from './config'
import { $ } from 'jquery'
import { clearStorage, toast, showScreen, defaultExamState } from './helper'

export class Client {
    constructor(state) {
        this.state = state;
    }

    handleExpiredSession() {
        this.state.token = null;
        this.state.user = null;
        this.state.exams = [];
        this.state.examState = defaultExamState();

        clearStorage(['user_session', 'app_token', 'exam_state']);
        showScreen('login');
        toast('Sua sessão expirou. Faça login novamente.', 'error');
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
            return res;
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