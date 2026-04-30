const ALLOWED_TAGS = ['p','br','strong','em','b','i','u','span','ul','ol','li'];

export function decodeHtmlEntities(str) {
    return str.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
        .replace(/&#(\d+);/g, function(_,d){ return String.fromCodePoint(parseInt(d)); })
        .replace(/&#x([0-9a-fA-F]+);/g, function(_,h){ return String.fromCodePoint(parseInt(h,16)); });
}

export function sanitizeBasicHtml(html) {
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    html = html.replace(/<\/?([a-zA-Z0-9-]+)(\s[^>]*)?>/g, function(full, tag) {
        let t = tag.toLowerCase();
        if (ALLOWED_TAGS.indexOf(t) === -1) return '';
        return full.startsWith('</') ? '</' + t + '>' : '<' + t + '>';
    });
    html = html.replace(/javascript:/gi, '');
    return html;
}

export function sanitizeExamHtml(raw) {
    return sanitizeBasicHtml(decodeHtmlEntities(raw));
}

