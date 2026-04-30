import { $ } from 'jquery';

export function formatCPF(val) {
    let d = val.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0,3) + '.' + d.slice(3);
    if (d.length <= 9) return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6);
    return d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6,9) + '-' + d.slice(9);
}

export function validateCPF(cpf) {
    let d = cpf.replace(/\D/g, '');
    if (d.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(d)) return false;
    let sum = 0, rem;
    for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
    rem = (sum * 10) % 11; if (rem === 10) rem = 0;
    if (rem !== parseInt(d[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
    rem = (sum * 10) % 11; if (rem === 10) rem = 0;
    return rem === parseInt(d[10]);
}

export function formatPhone(val) {
    let d = val.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return '(' + d.slice(0,2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0,2) + ') ' + d.slice(2,6) + '-' + d.slice(6);
    return '(' + d.slice(0,2) + ') ' + d.slice(2,7) + '-' + d.slice(7);
}

export function formatDuration(minutes) {
    let h = Math.floor(minutes / 60), m = minutes % 60, parts = [];
    if (h > 0) parts.push(('0' + h).slice(-2) + ' hora' + (h > 1 ? 's' : ''));
    if (m > 0) parts.push(('0' + m).slice(-2) + ' minuto' + (m > 1 ? 's' : ''));
    return parts.join(' e ');
}

export function wordCount(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function escHtml(str) {
    return $('<div>').text(str || '').html();
}

