import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { WatchpartyService } from '../../services/watchparty.service';
import {
  RealtimeChatMessage,
  SignalMessage,
  WatchpartyRealtimeService
} from '../../services/watchparty-realtime.service';

interface ChatMessage {
  author: string;
  initials: string;
  text: string;
  time: string;
  isMe: boolean;
  type?: 'CHAT' | 'JOIN' | 'LEAVE' | 'REACTION' | 'GIF' | 'VOICE';
  reaction?: string;
  gifUrl?: string;
  audioUrl?: string;
}

interface JoinRequest {
  userId: string;
  watchPartyId: string;
  watchPartyTitre: string;
  timestamp: number;
  status: string;
}

interface GifItem {
  id: string;
  label: string;
  url: string;
}

@Component({
  selector: 'app-watchparty-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './watchparty-session.component.html',
  styleUrls: ['./watchparty-session.component.css']
})
export class WatchpartySessionComponent implements OnInit, OnDestroy {
  @ViewChild('chatContainer') chatContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  session: any = null;
  loading = true;
  errorMessage = '';
  successMessage = '';
  activeTab: 'members' | 'chat' = 'members';
  chatInput = '';
  chatMessages: ChatMessage[] = [];
  sessionLinkCopied = false;
  realtimeConnected = false;

  approvalStatus: 'waiting' | 'approved' | 'rejected' | 'host' = 'waiting';
  pendingJoinRequests: JoinRequest[] = [];

  showHostLeaveModal = false;
  leavingInProgress = false;

  isCameraReady = false;
  isMicEnabled = true;
  isCameraEnabled = true;

  showReactionPicker = false;
  showGifPicker = false;
 isRecordingVoice = false;
pendingVoiceBlob: Blob | null = null;
pendingVoiceUrl = '';

private voiceRecorder: MediaRecorder | null = null;
private voiceChunks: Blob[] = [];

async startVoiceRecording(): Promise<void> {
  if (!this.realtimeConnected || this.isRecordingVoice) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.voiceChunks = [];
    this.pendingVoiceBlob = null;
    this.pendingVoiceUrl = '';

    this.voiceRecorder = new MediaRecorder(stream);

    this.voiceRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.voiceChunks.push(event.data);
      }
    };

    this.voiceRecorder.onstop = () => {
      const audioBlob = new Blob(this.voiceChunks, { type: 'audio/webm' });

      stream.getTracks().forEach(track => track.stop());

      if (audioBlob.size > 0) {
        this.pendingVoiceBlob = audioBlob;
        this.pendingVoiceUrl = URL.createObjectURL(audioBlob);
      }

      this.voiceRecorder = null;
      this.voiceChunks = [];
    };

    this.voiceRecorder.start();
    this.isRecordingVoice = true;
    this.closePickers();
  } catch (error) {
    console.error('Microphone error:', error);
    this.showSuccess('Microphone not available.');
  }
}

stopVoiceRecording(): void {
  if (!this.voiceRecorder || !this.isRecordingVoice) return;

  this.isRecordingVoice = false;
  this.voiceRecorder.stop();
}

toggleVoiceRecording(): void {
  if (this.isRecordingVoice) {
    this.stopVoiceRecording();
  } else {
    this.startVoiceRecording();
  }
}

cancelPendingVoice(): void {
  this.pendingVoiceBlob = null;
  this.pendingVoiceUrl = '';
}

 
  readonly reactions: string[] = ['❤️', '😂', '👍', '🔥', '😮', '😢', '👏', '😍'];

  readonly gifList: GifItem[] = [
    {
      id: 'gif-1',
      label: 'Happy',
      url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif'
    },
    {
      id: 'gif-2',
      label: 'Clap',
      url: 'https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif'
    },
    {
      id: 'gif-3',
      label: 'Laugh',
      url: 'https://media.giphy.com/media/3o6ozvv0zsJskzOCbu/giphy.gif'
    },
    {
      id: 'gif-4',
      label: 'Wow',
      url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif'
    },
    {
      id: 'gif-5',
      label: 'Love',
      url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif'
    },
    {
      id: 'gif-6',
      label: 'Party',
      url: 'https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif'
    }
  ];

  memberColors = [
    { bg: 'rgba(124,92,252,0.25)', text: '#a78bfa' },
    { bg: 'rgba(34,211,160,0.2)', text: '#22d3a0' },
    { bg: 'rgba(251,146,60,0.2)', text: '#fb923c' },
    { bg: 'rgba(239,68,68,0.2)', text: '#f87171' },
    { bg: 'rgba(59,130,246,0.2)', text: '#60a5fa' }
  ];

  private sessionId = '';
  private currentUserId = '';
  private currentUserName = '';
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  private peerConnection: RTCPeerConnection | null = null;
  private peerUserId: string | null = null;
  private hasSentReadySignal = false;

  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private notifPollTimer: ReturnType<typeof setInterval> | null = null;
  private successTimer: ReturnType<typeof setTimeout> | null = null;
  private subscriptions: Subscription[] = [];
  private hasSentJoinRealtime = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly watchpartyService: WatchpartyService,
    private readonly realtimeService: WatchpartyRealtimeService
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.currentUserId = this.resolveCurrentUserId();
    this.currentUserName = this.resolveCurrentUserName();

    if (!this.sessionId) {
      this.loading = false;
      this.errorMessage = 'Missing watchparty session id.';
      return;
    }

    this.setupRealtimeListeners();
    this.bootstrapSessionAccess();
  }

  ngOnDestroy(): void {
    if (this.realtimeConnected && (this.approvalStatus === 'approved' || this.approvalStatus === 'host')) {
      this.sendSystemMessage('LEAVE', `${this.currentUserName} left the session`);
    }

    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.realtimeService.disconnect();
    this.clearAllTimers();
    this.closePeerConnection();
    this.stopLocalMedia();
  }

  private clearAllTimers(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.notifPollTimer) {
      clearInterval(this.notifPollTimer);
      this.notifPollTimer = null;
    }

    if (this.successTimer) {
      clearTimeout(this.successTimer);
      this.successTimer = null;
    }
  }

  private setupRealtimeListeners(): void {
    const connSub = this.realtimeService.connectionState$.subscribe((connected) => {
      this.realtimeConnected = connected;

      if (connected && !this.hasSentJoinRealtime && (this.approvalStatus === 'approved' || this.approvalStatus === 'host')) {
        this.hasSentJoinRealtime = true;
        this.sendSystemMessage('JOIN', `${this.currentUserName} joined the session`);
        this.trySendReadySignal();
      }
    });

    const msgSub = this.realtimeService.messages$.subscribe((msg) => {
      this.chatMessages.push(this.mapRealtimeToUiMessage(msg));
      this.scrollChatToBottom();
    });

    const signalSub = this.realtimeService.signals$.subscribe((signal) => {
      this.handleSignal(signal);
    });

    this.subscriptions.push(connSub, msgSub, signalSub);
  }

  private connectRealtimeChat(): void {
    if (!this.sessionId) return;
    this.realtimeService.connect(this.sessionId);
  }

  private async initCamera(): Promise<void> {
    try {
      if (this.localStream) {
        this.tryAttachLocalStream();
        this.trySendReadySignal();
        return;
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      this.isCameraReady = true;
      this.tryAttachLocalStream();
      this.trySendReadySignal();
    } catch (error) {
      console.error('❌ Error accessing camera/microphone:', error);
      this.isCameraReady = false;
      this.successMessage = 'Camera not available, but you can still use chat.';
    }
  }

  private tryAttachLocalStream(): void {
    setTimeout(() => {
      if (this.localVideo?.nativeElement && this.localStream) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }
    }, 100);
  }

  toggleMic(): void {
    if (!this.localStream) return;

    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    this.isMicEnabled = !this.isMicEnabled;
    audioTracks.forEach(track => track.enabled = this.isMicEnabled);
  }

  toggleCamera(): void {
    if (!this.localStream) return;

    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length === 0) return;

    this.isCameraEnabled = !this.isCameraEnabled;
    videoTracks.forEach(track => track.enabled = this.isCameraEnabled);
  }

  private stopLocalMedia(): void {
    if (!this.localStream) return;

    this.localStream.getTracks().forEach(track => track.stop());
    this.localStream = null;
    this.isCameraReady = false;
  }

  private bootstrapSessionAccess(): void {
    this.watchpartyService.getById(this.sessionId).subscribe({
      next: (data: any) => {
        this.session = data;
        this.loading = false;

        if (data.statut === 'CLOSED' || data.statut === 'CANCELLED') {
          this.errorMessage = 'This WatchParty is closed or cancelled.';
          return;
        }

        const participants: string[] = Array.isArray(data.participantIds) ? data.participantIds : [];
        const hostId = data.clientId || data.adminId || '';

        if (this.currentUserId === hostId) {
          this.approvalStatus = 'host';
          this.connectRealtimeChat();
          setTimeout(() => this.initCamera(), 300);
          this.startSessionPolling();
          this.startJoinRequestPolling();
          return;
        }

        if (participants.includes(this.currentUserId)) {
          this.approvalStatus = 'approved';
          this.connectRealtimeChat();
          setTimeout(() => this.initCamera(), 300);
          this.startSessionPolling();
          return;
        }

        this.approvalStatus = 'waiting';

        this.watchpartyService.createJoinRequest(this.sessionId).subscribe({
          next: () => this.startPollingApproval(),
          error: () => this.startPollingApproval()
        });
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.status === 404
          ? 'This WatchParty no longer exists or has been deleted.'
          : 'Unable to load watchparty session.';
      }
    });
  }

  leaveSession(): void {
    if (this.approvalStatus === 'host') {
      this.showHostLeaveModal = true;
      return;
    }

    this.performLeaveOnlyMe();
  }

  closeHostLeaveModal(): void {
    this.showHostLeaveModal = false;
  }

  leaveOnlyMeAsHost(): void {
    this.showHostLeaveModal = false;
    this.performLeaveOnlyMe();
  }

  closeForEveryoneAsHost(): void {
    this.showHostLeaveModal = false;

    if (this.realtimeConnected) {
      this.sendSystemMessage('LEAVE', `${this.currentUserName} closed the session`);
    }

    this.leavingInProgress = true;

    this.watchpartyService.closeSessionForAll(this.sessionId).subscribe({
      next: () => {
        this.leavingInProgress = false;
        this.router.navigate(['/user/watchparty']);
      },
      error: () => {
        this.leavingInProgress = false;
        this.router.navigate(['/user/watchparty']);
      }
    });
  }

  private performLeaveOnlyMe(): void {
    if (this.realtimeConnected) {
      this.sendSystemMessage('LEAVE', `${this.currentUserName} left the session`);
    }

    this.leavingInProgress = true;

    this.watchpartyService.leaveWatchParty(this.sessionId).subscribe({
      next: () => {
        this.leavingInProgress = false;
        this.router.navigate(['/user/watchparty']);
      },
      error: () => {
        this.leavingInProgress = false;
        this.router.navigate(['/user/watchparty']);
      }
    });
  }

  approveRequest(request: JoinRequest): void {
    this.watchpartyService.approveJoinRequest(request.watchPartyId, request.userId).subscribe({
      next: () => {
        this.pendingJoinRequests = this.pendingJoinRequests.filter(
          r => !(r.userId === request.userId && r.watchPartyId === request.watchPartyId)
        );
        this.loadSession();
        this.showSuccess('✅ User approved and joined the session!');
      },
      error: () => {
        this.errorMessage = 'Failed to approve request.';
      }
    });
  }

  rejectRequest(request: JoinRequest): void {
    this.watchpartyService.rejectJoinRequest(request.watchPartyId, request.userId).subscribe({
      next: () => {
        this.pendingJoinRequests = this.pendingJoinRequests.filter(
          r => !(r.userId === request.userId && r.watchPartyId === request.watchPartyId)
        );
        this.showSuccess('❌ Request rejected.');
      },
      error: () => {
        this.errorMessage = 'Failed to reject request.';
      }
    });
  }

  private startJoinRequestPolling(): void {
    if (this.notifPollTimer) {
      clearInterval(this.notifPollTimer);
      this.notifPollTimer = null;
    }

    this.notifPollTimer = setInterval(() => {
      this.watchpartyService.getJoinRequests(this.sessionId).subscribe({
        next: (requests: any[]) => {
          this.pendingJoinRequests = (requests || []).filter(r => r.status === 'pending');
        },
        error: () => {
          this.pendingJoinRequests = [];
        }
      });
    }, 2000);
  }

  private startPollingApproval(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.pollTimer = setInterval(() => {
      this.checkApprovalStatus();
    }, 2000);
  }

  private checkApprovalStatus(): void {
    this.watchpartyService.getById(this.sessionId).subscribe({
      next: (data: any) => {
        const participants: string[] = Array.isArray(data.participantIds) ? data.participantIds : [];

        if (data.statut === 'CLOSED' || data.statut === 'CANCELLED') {
          if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
          }
          this.errorMessage = 'This WatchParty is closed or cancelled.';
          return;
        }

        if (participants.includes(this.currentUserId)) {
          if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
          }

          this.approvalStatus = 'approved';
          this.session = data;
          this.connectRealtimeChat();
          setTimeout(() => this.initCamera(), 300);
          this.startSessionPolling();
          this.showSuccess('You were approved and joined the session.');
          return;
        }

        this.watchpartyService.getJoinRequests(this.sessionId).subscribe({
          next: (requests: any[]) => {
            const myRequest = (requests || []).find((r) => r.userId === this.currentUserId);
            if (myRequest?.status === 'rejected') {
              if (this.pollTimer) {
                clearInterval(this.pollTimer);
                this.pollTimer = null;
              }
              this.approvalStatus = 'rejected';
            }
          },
          error: () => {}
        });
      },
      error: (err: any) => {
        if (err?.status === 404) {
          this.approvalStatus = 'rejected';
          setTimeout(() => this.router.navigate(['/user/watchparty']), 3000);
        }
      }
    });
  }

  private startSessionPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    this.pollTimer = setInterval(() => {
      this.watchpartyService.getById(this.sessionId).subscribe({
        next: (data: any) => {
          this.session = data;

          if (data.statut === 'CLOSED' || data.statut === 'CANCELLED') {
            this.errorMessage = 'This WatchParty is closed or cancelled.';
            this.clearAllTimers();
            setTimeout(() => this.router.navigate(['/user/watchparty']), 2000);
          }
        },
        error: () => {}
      });
    }, 5000);
  }

  private loadSession(): void {
    this.watchpartyService.getById(this.sessionId).subscribe({
      next: (data: any) => {
        this.session = data;
        if (data.statut === 'CLOSED' || data.statut === 'CANCELLED') {
          this.errorMessage = 'This WatchParty is closed or cancelled.';
        }
      },
      error: () => {}
    });
  }

 private sendVoiceMessage(audioBlob: Blob): void {
  const reader = new FileReader();

  reader.onloadend = () => {
    const audioBase64 = reader.result as string;

    const voiceMessage = {
      watchPartyId: this.sessionId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      content: audioBase64,
      type: 'VOICE'
    };

    // afficher d'abord localement
    this.chatMessages.push(this.mapRealtimeToUiMessage(voiceMessage));
    this.scrollChatToBottom();

    // nettoyer l'aperçu
    this.pendingVoiceBlob = null;
    this.pendingVoiceUrl = '';

    // envoyer ensuite via websocket
    try {
      this.realtimeService.sendChatMessage(voiceMessage as any);
    } catch (error) {
      console.error('Voice WebSocket send error:', error);
      this.showSuccess('Voice displayed locally, but WebSocket send failed.');
    }
  };

  reader.readAsDataURL(audioBlob);
}
sendMessage(): void {
  // Prioritize voice message if exists
  if (this.pendingVoiceBlob) {
    console.log('=== SEND MESSAGE ===');
    console.log('Voice pending detected, forwarding to sendVoiceMessage');
    this.sendPendingVoice();
    return;
  }

  const text = this.chatInput.trim();

  if (!text) {
    console.log('❌ Empty message');
    return;
  }

  if (!this.realtimeConnected) {
    console.log('❌ WebSocket not connected');
    return;
  }

  console.log('=== SEND TEXT MESSAGE ===');
  console.log('Message:', text);

  this.realtimeService.sendChatMessage({
    watchPartyId: this.sessionId,
    senderId: this.currentUserId,
    senderName: this.currentUserName,
    content: text,
    type: 'CHAT'
  } as any);

  this.chatInput = '';
  this.closePickers();
}

sendPendingVoice(): void {
  if (!this.pendingVoiceBlob) return;
  this.sendVoiceMessage(this.pendingVoiceBlob);
}

  sendReaction(reaction: string): void {
    if (!reaction || !this.realtimeConnected) return;

    this.realtimeService.sendChatMessage({
      watchPartyId: this.sessionId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      content: reaction,
      type: 'REACTION',
      reaction
    } as any);

    this.showReactionPicker = false;
  }

  sendGif(gifUrl: string): void {
    if (!gifUrl || !this.realtimeConnected) return;

    this.realtimeService.sendChatMessage({
      watchPartyId: this.sessionId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      content: gifUrl,
      type: 'GIF',
      gifUrl
    } as any);

    this.showGifPicker = false;
  }

  toggleReactionPicker(): void {
    this.showReactionPicker = !this.showReactionPicker;
    if (this.showReactionPicker) {
      this.showGifPicker = false;
    }
  }

  toggleGifPicker(): void {
    this.showGifPicker = !this.showGifPicker;
    if (this.showGifPicker) {
      this.showReactionPicker = false;
    }
  }

  closePickers(): void {
    this.showReactionPicker = false;
    this.showGifPicker = false;
  }

  private sendSystemMessage(type: 'JOIN' | 'LEAVE', content: string): void {
    if (!this.realtimeConnected) return;

    this.realtimeService.sendChatMessage({
      watchPartyId: this.sessionId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      content,
      type
    } as any);
  }

  private mapRealtimeToUiMessage(msg: RealtimeChatMessage | any): ChatMessage {
    const date = msg.timestamp ? new Date(msg.timestamp) : new Date();
    const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    const isMe = msg.senderId === this.currentUserId;
    const messageType = (msg.type || 'CHAT') as 'CHAT' | 'JOIN' | 'LEAVE' | 'REACTION' | 'GIF' | 'VOICE';

    return {
      author: messageType === 'CHAT' || messageType === 'REACTION' || messageType === 'GIF' || messageType === 'VOICE'
        ? (msg.senderName || msg.senderId || 'User')
        : 'System',
      initials: messageType === 'CHAT' || messageType === 'REACTION' || messageType === 'GIF' || messageType === 'VOICE'
        ? (msg.senderName || msg.senderId || 'US').slice(0, 2).toUpperCase()
        : 'SY',
      text: msg.content || '',
      time,
      isMe,
      type: messageType,
      reaction: msg.reaction || (messageType === 'REACTION' ? msg.content : ''),
      gifUrl: msg.gifUrl || (messageType === 'GIF' ? msg.content : ''),
      audioUrl: messageType === 'VOICE' ? msg.content : ''
    };
  }

  private scrollChatToBottom(): void {
    setTimeout(() => {
      if (this.chatContainer?.nativeElement) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }

  private trySendReadySignal(): void {
    if (!this.realtimeConnected || !this.localStream || this.hasSentReadySignal) return;

    this.hasSentReadySignal = true;

    this.realtimeService.sendSignal({
      watchPartyId: this.sessionId,
      senderId: this.currentUserId,
      type: 'READY',
      data: {
        senderName: this.currentUserName
      }
    });
  }

  private async handleSignal(signal: SignalMessage): Promise<void> {
    if (!signal || signal.senderId === this.currentUserId) return;
    if (signal.receiverId && signal.receiverId !== this.currentUserId) return;

    switch (signal.type) {
      case 'READY':
        await this.handleReadySignal(signal);
        break;
      case 'OFFER':
        await this.handleOfferSignal(signal);
        break;
      case 'ANSWER':
        await this.handleAnswerSignal(signal);
        break;
      case 'ICE_CANDIDATE':
        await this.handleIceCandidateSignal(signal);
        break;
    }
  }

  private async handleReadySignal(signal: SignalMessage): Promise<void> {
    if (!this.localStream) return;
    if (this.approvalStatus !== 'host') return;
    if (this.peerConnection || this.peerUserId) return;

    this.peerUserId = signal.senderId;
    await this.createPeerConnection(signal.senderId);

    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);

    this.realtimeService.sendSignal({
      watchPartyId: this.sessionId,
      senderId: this.currentUserId,
      receiverId: signal.senderId,
      type: 'OFFER',
      data: offer
    });
  }

  private async handleOfferSignal(signal: SignalMessage): Promise<void> {
    if (!this.localStream) {
      await this.initCamera();
    }

    this.peerUserId = signal.senderId;
    await this.createPeerConnection(signal.senderId);

    await this.peerConnection!.setRemoteDescription(
      new RTCSessionDescription(signal.data)
    );

    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);

    this.realtimeService.sendSignal({
      watchPartyId: this.sessionId,
      senderId: this.currentUserId,
      receiverId: signal.senderId,
      type: 'ANSWER',
      data: answer
    });
  }

  private async handleAnswerSignal(signal: SignalMessage): Promise<void> {
    if (!this.peerConnection) return;

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(signal.data)
    );
  }

  private async handleIceCandidateSignal(signal: SignalMessage): Promise<void> {
    if (!this.peerConnection || !signal.data) return;

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.data));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  private async createPeerConnection(targetUserId: string): Promise<void> {
    if (this.peerConnection) return;

    this.peerConnection = new RTCPeerConnection(this.rtcConfig);
    this.peerUserId = targetUserId;
    this.remoteStream = new MediaStream();

    if (this.remoteVideo?.nativeElement) {
      this.remoteVideo.nativeElement.srcObject = this.remoteStream;
    } else {
      setTimeout(() => {
        if (this.remoteVideo?.nativeElement && this.remoteStream) {
          this.remoteVideo.nativeElement.srcObject = this.remoteStream;
        }
      }, 100);
    }

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.peerUserId) {
        this.realtimeService.sendSignal({
          watchPartyId: this.sessionId,
          senderId: this.currentUserId,
          receiverId: this.peerUserId,
          type: 'ICE_CANDIDATE',
          data: event.candidate
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      event.streams[0].getTracks().forEach(track => {
        const alreadyExists = this.remoteStream!
          .getTracks()
          .some(existing => existing.id === track.id);

        if (!alreadyExists) {
          this.remoteStream!.addTrack(track);
        }
      });

      if (this.remoteVideo?.nativeElement) {
        this.remoteVideo.nativeElement.srcObject = this.remoteStream;
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Peer connection state:', this.peerConnection?.connectionState);
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }
  }

  private closePeerConnection(): void {
    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null;
      this.peerConnection.ontrack = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.peerUserId = null;

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    if (this.remoteVideo?.nativeElement) {
      this.remoteVideo.nativeElement.srcObject = null;
    }
  }

  copySessionLink(): void {
    const link = `${window.location.origin}/watchparty/${this.sessionId}`;
    navigator.clipboard.writeText(link).then(() => {
      this.sessionLinkCopied = true;
      setTimeout(() => { this.sessionLinkCopied = false; }, 3000);
    });
  }

  close(): void {
    this.router.navigate(['/user/watchparty']);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    if (this.successTimer) {
      clearTimeout(this.successTimer);
      this.successTimer = null;
    }
    this.successTimer = setTimeout(() => { this.successMessage = ''; }, 4000);
  }

  private resolveCurrentUserId(): string {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) {
          return String(payload.sub);
        }
      }
    } catch {}
    return '';
  }

  private resolveCurrentUserName(): string {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return String(
          payload.username ||
          payload.preferred_username ||
          payload.name ||
          payload.sub ||
          'User' 
        );
      }
    } catch {}
    return this.currentUserId || 'User';
  }


}