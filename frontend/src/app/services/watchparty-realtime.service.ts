import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, Subject } from 'rxjs';

export interface RealtimeChatMessage {
  watchPartyId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'REACTION' | 'GIF' | 'VOICE';
  timestamp?: string;
}

export interface SignalMessage {
  watchPartyId: string;
  senderId: string;
  receiverId?: string;
  type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'JOIN' | 'LEAVE' | 'READY';
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class WatchpartyRealtimeService {
  private client: Client | null = null;
  private connected = false;
  private currentRoomId: string | null = null;

  private messagesSubject = new Subject<RealtimeChatMessage>();
  messages$ = this.messagesSubject.asObservable();

  private signalsSubject = new Subject<SignalMessage>();
  signals$ = this.signalsSubject.asObservable();

  private connectionStateSubject = new BehaviorSubject<boolean>(false);
  connectionState$ = this.connectionStateSubject.asObservable();

  connect(watchPartyId: string): void {
    if (this.connected && this.currentRoomId === watchPartyId) {
      return;
    }

    this.disconnect();
    this.currentRoomId = watchPartyId;

    this.client = new Client({
      brokerURL: 'ws://localhost:8090/ws-watchparty',
      reconnectDelay: 5000,
      debug: (str) => console.log('[STOMP]', str)
    });

    this.client.onConnect = () => {
      console.log('✅ WebSocket connecté');
      this.connected = true;
      this.connectionStateSubject.next(true);

      this.client?.subscribe(
        `/topic/watchparty/${watchPartyId}/chat`,
        (message: IMessage) => {
          try {
            const body: RealtimeChatMessage = JSON.parse(message.body);
            this.messagesSubject.next(body);
          } catch (error) {
            console.error('Erreur parsing chat:', error);
          }
        }
      );

      this.client?.subscribe(
        `/topic/watchparty/${watchPartyId}/signal`,
        (message: IMessage) => {
          try {
            const body: SignalMessage = JSON.parse(message.body);
            this.signalsSubject.next(body);
          } catch (error) {
            console.error('Erreur parsing signal:', error);
          }
        }
      );
    };

    this.client.onStompError = (frame) => {
      console.error('Erreur STOMP:', frame.headers['message']);
      console.error(frame.body);
    };

    this.client.onWebSocketClose = (event) => {
      console.error('❌ WebSocket fermé', event);
      this.connected = false;
      this.connectionStateSubject.next(false);
    };

    this.client.onWebSocketError = (error) => {
      console.error('Erreur WebSocket:', error);
      this.connected = false;
      this.connectionStateSubject.next(false);
    };

    this.client.activate();
  }

  sendChatMessage(message: RealtimeChatMessage): void {
    if (!this.client || !this.connected) {
      console.warn('WebSocket non connecté');
      return;
    }

    this.client.publish({
      destination: '/app/watchparty.chat',
      body: JSON.stringify(message)
    });
  }

  sendSignal(message: SignalMessage): void {
    if (!this.client || !this.connected) {
      console.warn('WebSocket non connecté');
      return;
    }

    this.client.publish({
      destination: '/app/watchparty.signal',
      body: JSON.stringify(message)
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.connected = false;
    this.connectionStateSubject.next(false);
    this.currentRoomId = null;
  }

  isConnected(): boolean {
    return this.connected;
  }
}