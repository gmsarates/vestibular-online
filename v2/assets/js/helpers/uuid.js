export function isUuid(s) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export function extractAttemptUuid(payload) {
    if (!payload) return null;
    if (typeof payload === 'string' && isUuid(payload)) return payload;
    if (payload.uuid && isUuid(payload.uuid)) return payload.uuid;
    if (payload.id && isUuid(payload.id)) return payload.id;
    if (payload.data) {
        if (payload.data.uuid && isUuid(payload.data.uuid)) return payload.data.uuid;
        if (payload.data.id && isUuid(payload.data.id)) return payload.data.id;
    }
    return null;
}
