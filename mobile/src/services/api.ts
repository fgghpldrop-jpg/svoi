import {
  UserProfile,
  Clan,
  ClanJoinRequest,
  HeatmapPolygon,
  PointOfInterest,
  CityNewsItem,
  ChatSummary,
  ChatMessage,
  PartnerPromocode,
  AiBioRequest,
} from '../types';

const BASE_URL = 'http://localhost:5000/api/v1';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorMessage = errorJson.error;
      } catch (_) {}
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth
  async requestCode(phoneNumber: string, telegramChatId?: number) {
    return this.request<{ message: string; phoneNumber: string }>('/auth/request-code', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, telegramChatId }),
    });
  }

  async verifyCode(phoneNumber: string, code: string) {
    const res = await this.request<{ token: string; user: UserProfile; isNewUser: boolean }>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, code }),
    });
    this.setToken(res.token);
    return res;
  }

  // Profile
  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/profile/me');
  }

  async updateStatus(isWalking: boolean, durationMinutes?: number, isIncognito?: boolean) {
    return this.request('/profile/status', {
      method: 'PUT',
      body: JSON.stringify({ statusIsWalking: isWalking, durationMinutes, isIncognito }),
    });
  }

  async generateAiBio(data: AiBioRequest): Promise<{ bio: string }> {
    return this.request<{ bio: string }>('/profile/ai-bio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Geo & Map
  async sendGeoPing(latitude: number, longitude: number, accuracyMeters?: number, activityType?: string) {
    return this.request('/geo/ping', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, accuracyMeters, activityType }),
    });
  }

  async getHeatmap(): Promise<HeatmapPolygon[]> {
    return this.request<HeatmapPolygon[]>('/map/heatmap');
  }

  async getWalkersCount(): Promise<{ activeWalkersInBobruisk: number }> {
    return this.request<{ activeWalkersInBobruisk: number }>('/map/walkers-count');
  }

  async getPOIs(): Promise<PointOfInterest[]> {
    return this.request<PointOfInterest[]>('/map/poi');
  }

  // News
  async getNews(): Promise<CityNewsItem[]> {
    return this.request<CityNewsItem[]>('/news');
  }

  // Clans
  async getMyClans(): Promise<Clan[]> {
    return this.request<Clan[]>('/clans/my');
  }

  async discoverClans(): Promise<Clan[]> {
    return this.request<Clan[]>('/clans/discover');
  }

  async createClan(data: { title: string; description: string; tag: string; maxMembers: number }) {
    return this.request('/clans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestJoinClan(clanId: string) {
    return this.request(`/clans/${clanId}/join-request`, {
      method: 'POST',
    });
  }

  async getClanRequests(clanId: string): Promise<ClanJoinRequest[]> {
    return this.request<ClanJoinRequest[]>(`/clans/${clanId}/requests`);
  }

  async moderateClanRequest(clanId: string, requestId: string, approve: boolean) {
    return this.request(`/clans/${clanId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ requestId, approve }),
    });
  }

  // Market & Promocodes
  async getPromocodes(): Promise<PartnerPromocode[]> {
    return this.request<PartnerPromocode[]>('/market/promocodes');
  }

  async buyShield(clanId: string) {
    return this.request('/market/buy-shield', {
      method: 'POST',
      body: JSON.stringify({ clanId }),
    });
  }

  async redeemCoupon(couponId: string) {
    return this.request(`/market/redeem/${couponId}`, {
      method: 'POST',
    });
  }

  // Chats
  async getMyChats(): Promise<ChatSummary[]> {
    return this.request<ChatSummary[]>('/chats');
  }

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    return this.request<ChatMessage[]>(`/chats/${chatId}/messages`);
  }

  async openCandidateFilterChat(clanId: string, candidateUserId: string) {
    return this.request<{ chatId: string; message: string }>('/chats/candidate-filter-chat', {
      method: 'POST',
      body: JSON.stringify({ clanId, candidateUserId }),
    });
  }
}

export const api = new ApiService();
