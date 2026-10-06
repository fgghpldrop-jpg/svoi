import * as signalR from '@microsoft/signalr';
import { api } from './api';
import { ChatMessage, HeatmapPolygon } from '../types';

class SignalRService {
  private chatConnection: signalR.HubConnection | null = null;
  private mapConnection: signalR.HubConnection | null = null;

  async startConnections(
    onReceiveMessage?: (msg: ChatMessage) => void,
    onActiveWalkersUpdate?: (count: number) => void,
    onHeatmapUpdate?: (heatmap: HeatmapPolygon[]) => void
  ) {
    const token = api.getToken();

    // 1. Chat Hub Connection
    if (!this.chatConnection && token) {
      this.chatConnection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5000/hubs/chat', {
          accessTokenFactory: () => api.getToken() || '',
        })
        .withAutomaticReconnect()
        .build();

      if (onReceiveMessage) {
        this.chatConnection.on('ReceiveMessage', (message: ChatMessage) => {
          onReceiveMessage(message);
        });
      }

      try {
        await this.chatConnection.start();
        console.log('SignalR ChatHub Connected');
      } catch (err) {
        console.warn('SignalR ChatHub Connection failed:', err);
      }
    }

    // 2. Map Hub Connection
    if (!this.mapConnection) {
      this.mapConnection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5000/hubs/map')
        .withAutomaticReconnect()
        .build();

      if (onActiveWalkersUpdate) {
        this.mapConnection.on('ActiveWalkersCount', (count: number) => {
          onActiveWalkersUpdate(count);
        });
      }

      if (onHeatmapUpdate) {
        this.mapConnection.on('HeatmapData', (heatmap: HeatmapPolygon[]) => {
          onHeatmapUpdate(heatmap);
        });
      }

      try {
        await this.mapConnection.start();
        console.log('SignalR MapHub Connected');
        // Initial requests
        await this.mapConnection.invoke('RequestActiveWalkersCount');
        await this.mapConnection.invoke('RequestHeatmap');
      } catch (err) {
        console.warn('SignalR MapHub Connection failed:', err);
      }
    }
  }

  async joinChat(chatId: string) {
    if (this.chatConnection && this.chatConnection.state === signalR.HubConnectionState.Connected) {
      await this.chatConnection.invoke('JoinChat', chatId);
    }
  }

  async leaveChat(chatId: string) {
    if (this.chatConnection && this.chatConnection.state === signalR.HubConnectionState.Connected) {
      await this.chatConnection.invoke('LeaveChat', chatId);
    }
  }

  async sendMessage(chatId: string, textContent: string) {
    if (this.chatConnection && this.chatConnection.state === signalR.HubConnectionState.Connected) {
      await this.chatConnection.invoke('SendMessage', chatId, textContent);
    }
  }

  stopConnections() {
    this.chatConnection?.stop();
    this.mapConnection?.stop();
    this.chatConnection = null;
    this.mapConnection = null;
  }
}

export const signalRService = new SignalRService();
