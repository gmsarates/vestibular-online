import { $ } from 'jquery';
import { showModal } from '../helper.js';

export class LogoutButton {
    constructor(opts = {}) {
        this.onLogout = opts.onLogout || null;
    }

    init() {
        $('#btn-logout').on('click', () => {
            showModal({
                title: 'Sair da plataforma',
                description: 'Tem certeza que deseja sair? Sua sessão será encerrada.',
                actions: [
                    { label: 'Cancelar', cls: 'btn-outline' },
                    { label: 'Sair', cls: 'btn-primary', onClick: () => this.onLogout && this.onLogout() }
                ]
            });
        });
    }
}

