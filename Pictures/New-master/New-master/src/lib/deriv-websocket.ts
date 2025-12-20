type TCallback = (data: any) => void;

class DerivWebSocket {
    private ws: WebSocket | null = null;
    private appId: string;
    private listeners: Map<string, Set<TCallback>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private endpoint = 'wss://ws.derivws.com/websockets/v3';

    constructor(appId = '1089') {
        this.appId = appId;
    }

    public connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(`${this.endpoint}?app_id=${this.appId}`);

                this.ws.onopen = () => {
                    console.log('[DerivWebSocket] Connected');
                    this.reconnectAttempts = 0;
                    resolve();
                };

                this.ws.onmessage = event => {
                    const data = JSON.parse(event.data);
                    const msgType = data.msg_type;
                    if (msgType && this.listeners.has(msgType)) {
                        this.listeners.get(msgType)?.forEach(callback => callback(data));
                    }
                };

                this.ws.onerror = error => {
                    console.error('[DerivWebSocket] Error:', error);
                    reject(error);
                };

                this.ws.onclose = () => {
                    console.log('[DerivWebSocket] Disconnected');
                    this.handleReconnect();
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`[DerivWebSocket] Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(), delay);
        }
    }

    public disconnect(): void {
        if (this.ws) {
            this.ws.onclose = null; // Prevent auto-reconnect
            this.ws.close();
            this.ws = null;
        }
    }

    public subscribeTicks(symbol: string): void {
        this.send({
            ticks: symbol,
            subscribe: 1,
        });
    }

    public unsubscribeTicks(): void {
        this.send({
            forget_all: 'ticks',
        });
    }

    public send(message: any): void {
        if (this.isConnected()) {
            this.ws?.send(JSON.stringify(message));
        } else {
            console.warn('[DerivWebSocket] Cannot send message: Not connected');
        }
    }

    public subscribe(msgType: string, callback: TCallback): () => void {
        if (!this.listeners.has(msgType)) {
            this.listeners.set(msgType, new Set());
        }
        this.listeners.get(msgType)?.add(callback);

        return () => {
            this.listeners.get(msgType)?.delete(callback);
        };
    }

    public isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

export default DerivWebSocket;
