import { $ } from 'jquery';

export function toast(msg, type) {
    let t = $('<div class="toast"></div>').text(msg);

    if (type === 'error')
        t.addClass('error');

    if (type === 'success')
        t.addClass('success');

    $('#toast-container').append(t);

    setTimeout(function() {
        t.fadeOut(300, function() {
            $(this).remove();
        });
    }, 3500);
}

export function showScreen(name) {
    $('.screen').addClass('hidden');
    $('#screen-' + name).removeClass('hidden');
}

export function showLoading() {
    $('#global-loading').removeClass('hidden');
}

export function hideLoading() {
    $('#global-loading').addClass('hidden');
}

export function hideModal() {
    $('#modal-overlay').addClass('hidden');
}

export function showModal(opts) {
    opts = {
        title: '',
        description: '',
        actions: [
            {
                label: 'Fechar',
                cls: null,
                onClick: () => {}
            }
        ],
        ...opts,
    };

    $('#modal-title').text(opts.title);
    $('#modal-description').html(opts.description);

    let footer = $('#modal-footer').empty();

    $.each(opts.actions, function(_, a) {
        let btn = $('<button class="btn"></button>')
            .addClass(a.cls || 'btn-outline')
            .text(a.label);

        btn.on('click', function() {
            hideModal();

            if (a.onClick)
                a.onClick();
        });

        footer.append(btn);
    });
    $('#modal-overlay').removeClass('hidden');
}

