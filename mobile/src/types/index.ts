export type ActivityTimerOption = '1_hour' | '2_hours' | 'till_evening';

export type MapTheme = 'dark' | 'light' | 'neon' | 'retro';

export type AiPersona = 'дерзкий' | 'дружелюбный' | 'краткий' | 'ироничный';

export interface UserProfile {
  id: string;
  phoneNumber: string;
  telegramChatId?: number;
  firstName: string;
  birthDate: string;
  bio?: string;
  avatarUrl?: string;
  verificationVideoUrl?: string;
  isVerified: boolean;
  institutionName?: string; // "БГТУ", "БГЛК"
  pointsBalance: number;
  statusIsWalking: boolean;
  statusExpiresAt?: string;
  isIncognito: boolean;
  lastKnownH3Index?: string;
  createdAt: string;
}

export interface Clan {
  id: string;
  leaderId: string;
  leaderName: string;
  title: string;
  description?: string;
  tag: string;
  maxMembers: number;
  memberCount: number;
  currentStreak: number;
  streakExpiresAt?: string;
  isOpenForJoin: boolean;
  createdAt: string;
  isCurrentUserMember: boolean;
  isCurrentUserLeader: boolean;
}

export interface ClanJoinRequest {
  id: string;
  clanId: string;
  clanTitle: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  userIsVerified: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface HeatmapPolygon {
  h3Index: string;
  userCount: number;
  intensity: 'Green' | 'Orange' | 'Red';
  coordinates: number[][]; // [[lng, lat], ...]
}

export interface PointOfInterest {
  id: string;
  title: string;
  category: string;
  discountDescription?: string;
  hasDiscount: boolean;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface CityNewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  isFlashEvent: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface ChatSummary {
  id: string;
  isClanChat: boolean;
  clanId?: string;
  title: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  textContent: string;
  sentAt: string;
}

export interface PartnerPromocode {
  id: string;
  poiId?: string;
  poiTitle?: string;
  title: string;
  costInPoints: number;
  promoCode: string;
  isRedeemed: boolean;
}

export interface AiBioRequest {
  personality: AiPersona;
  tags: string[];
  hobbies?: string;
  favoriteSpotsInBobruisk?: string;
  musicOrVibe?: string;
}
