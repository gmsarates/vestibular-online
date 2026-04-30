export function obfuscate(str) {
    try {
        return btoa(encodeURIComponent(str));
    } catch(e) {
        return '';
    }
}

export function deobfuscate(str) {
    try {
        return decodeURIComponent(atob(str));
    } catch(e) {
        return '';
    }
}

export function saveStorage(key, val) {
    try {
        localStorage.setItem(key, obfuscate(JSON.stringify(val)));
    } catch(e) {}
}

export function loadStorage(key) {
    try {
        let r = localStorage.getItem(key);
        return r ? JSON.parse(deobfuscate(r)) : null;
    } catch(e) {
        return null;
    }
}

export function clearStorage(keys) {
    if (!keys) return;

    for (const key of keys) {
        try { localStorage.removeItem(key); } catch(e) {}
    }
}

