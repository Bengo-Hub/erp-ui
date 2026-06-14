let sockets = {};

class RealtimeChannel {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.subscribers = new Set();
        this.connectionStateSubscribers = new Set();
        this.reconnectDelayMs = 2000;
        this.isConnected = false;
        this.connectionStatus = 'disconnected'; // disconnected, connecting, connected, error
        this._connect();
    }

    _notifyConnectionState(status, isConnected) {
        this.connectionStatus = status;
        this.isConnected = isConnected;
        this.connectionStateSubscribers.forEach((cb) => {
            try {
                cb({ status, isConnected });
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('[realtime] connection state subscriber error', e);
            }
        });
    }

    _connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            this._notifyConnectionState('connecting', false);
            this.ws = new WebSocket(this.url);
            this.ws.onopen = () => {
                this._notifyConnectionState('connected', true);
                // eslint-disable-next-line no-console
                console.log('[realtime] connected:', this.url);
            };
            this.ws.onmessage = (evt) => {
                let payload = evt.data;
                try {
                    payload = JSON.parse(evt.data);
                } catch (_) {}
                this.subscribers.forEach((cb) => {
                    try {
                        cb(payload);
                    } catch (e) {
                        // eslint-disable-next-line no-console
                        console.error('[realtime] subscriber error', e);
                    }
                });
            };
            this.ws.onclose = () => {
                this._notifyConnectionState('disconnected', false);
                // eslint-disable-next-line no-console
                console.warn('[realtime] disconnected, retrying in', this.reconnectDelayMs, 'ms');
                setTimeout(() => this._connect(), this.reconnectDelayMs);
            };
            this.ws.onerror = (e) => {
                this._notifyConnectionState('error', false);
                // eslint-disable-next-line no-console
                console.error('[realtime] error', e);
                try {
                    this.ws.close();
                } catch (_) {}
            };
        } catch (e) {
            this._notifyConnectionState('error', false);
            // eslint-disable-next-line no-console
            console.error('[realtime] failed to init', e);
        }
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.unsubscribe(callback);
    }

    unsubscribe(callback) {
        this.subscribers.delete(callback);
    }

    subscribeConnectionState(callback) {
        this.connectionStateSubscribers.add(callback);
        // Immediately call with current state
        try {
            callback({ status: this.connectionStatus, isConnected: this.isConnected });
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[realtime] connection state callback error', e);
        }
        return () => {
            this.connectionStateSubscribers.delete(callback);
        };
    }

    unsubscribeConnectionState(callback) {
        this.connectionStateSubscribers.delete(callback);
    }

    send(message) {
        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        try {
            this.ws?.send(payload);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[realtime] send failed', e);
        }
    }

    close() {
        try {
            this.ws?.close();
        } catch (_) {}
    }
}

/**
 * Get authentication token from sessionStorage or localStorage
 */
function getAuthToken() {
    if (typeof window === 'undefined') {
        return null;
    }
    return sessionStorage.getItem('token') || localStorage.getItem('token');
}

/**
 * Get or create a realtime channel for a given path.
 * The base ws URL is derived from window.$http (api base) by replacing protocol and path.
 * Includes authentication token as query parameter if available.
 */
export function getRealtimeChannel(path = '/ws/') {
    // Derive ws base from REST base (window.$http ends with /api/v1)
    const apiBase = typeof window !== 'undefined' ? window.$http || '' : '';
    let origin;
    try {
        const url = new URL(apiBase);
        const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
        origin = `${wsProto}//${url.host}`;
    } catch {
        // Fallback to window.location
        const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        origin = `${wsProto}//${window.location.host}`;
    }
    
    // Build URL with token query parameter
    let fullPath = path.startsWith('/') ? path : `/${path}`;
    const token = getAuthToken();
    if (token) {
        // Add token as query parameter
        const separator = fullPath.includes('?') ? '&' : '?';
        fullPath = `${fullPath}${separator}token=${encodeURIComponent(token)}`;
    }
    
    const fullUrl = `${origin}${fullPath}`;

    if (!sockets[fullUrl]) {
        sockets[fullUrl] = new RealtimeChannel(fullUrl);
    }
    return sockets[fullUrl];
}

export function closeRealtimeChannel(path = '/ws/') {
    const apiBase = typeof window !== 'undefined' ? window.$http || '' : '';
    let origin;
    try {
        const url = new URL(apiBase);
        const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
        origin = `${wsProto}//${url.host}`;
    } catch {
        const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        origin = `${wsProto}//${window.location.host}`;
    }
    
    // Build URL with token query parameter (same as getRealtimeChannel)
    let fullPath = path.startsWith('/') ? path : `/${path}`;
    const token = getAuthToken();
    if (token) {
        const separator = fullPath.includes('?') ? '&' : '?';
        fullPath = `${fullPath}${separator}token=${encodeURIComponent(token)}`;
    }
    
    const fullUrl = `${origin}${fullPath}`;
    if (sockets[fullUrl]) {
        sockets[fullUrl].close();
        delete sockets[fullUrl];
    }
}


