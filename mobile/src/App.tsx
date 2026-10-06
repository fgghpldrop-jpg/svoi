import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView, Alert } from 'react-native';
import {
  UserProfile,
  Clan,
  PointOfInterest,
  HeatmapPolygon,
  CityNewsItem,
  ChatSummary,
  ChatMessage,
  PartnerPromocode,
  MapTheme,
  AiPersona,
} from './types';
import { Colors } from './theme';
import { api } from './services/api';
import { signalRService } from './services/signalr';
import { MapScreen } from './components/MapScreen';
import { LeftDrawer } from './components/LeftDrawer';

export const App: React.FC = () => {
  // Theme & Personalization
  const [currentTheme, setCurrentTheme] = useState<MapTheme>('dark');
  const [ringColorKey, setRingColorKey] = useState<string>('emerald');
  const [aiPersona, setAiPersona] = useState<AiPersona>('дружелюбный');

  // UI Navigation
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // User Profile
  const [user, setUser] = useState<UserProfile | null>({
    id: '11111111-2222-3333-4444-555555555555',
    phoneNumber: '+375291234567',
    firstName: 'Алексей (СВОЙ)',
    birthDate: '2004-05-15',
    bio: 'Социалка, ночной Бобруйск, кофе в «1387». Собираю клан для вечерних прогулок!',
    isVerified: true,
    institutionName: 'БГТУ (Бобруйск)',
    pointsBalance: 250,
    statusIsWalking: true,
    statusExpiresAt: new Date(Date.now() + 7200000).toISOString(),
    isIncognito: false,
    createdAt: new Date().toISOString(),
  });

  // City & Map Data
  const [walkersCount, setWalkersCount] = useState<number>(34);
  const [heatmap, setHeatmap] = useState<HeatmapPolygon[]>([
    {
      h3Index: '891eb2649b7ffff',
      userCount: 18,
      intensity: 'Green',
      coordinates: [
        [29.2245, 53.1378],
        [29.2255, 53.1385],
        [29.2265, 53.1378],
        [29.2255, 53.1370],
        [29.2245, 53.1378],
      ],
    },
    {
      h3Index: '891eb264983ffff',
      userCount: 28,
      intensity: 'Orange',
      coordinates: [
        [29.2420, 53.1340],
        [29.2435, 53.1348],
        [29.2445, 53.1340],
        [29.2435, 53.1332],
        [29.2420, 53.1340],
      ],
    },
  ]);

  const [pois, setPois] = useState<PointOfInterest[]>([
    {
      id: 'poi-1',
      title: 'Пешеходная Социалка',
      category: 'Прогулки и движ',
      discountDescription: 'Эпицентр вечерних встреч молодежи, музыканты, уличный кофе.',
      hasDiscount: true,
      latitude: 53.1378,
      longitude: 29.2245,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'poi-2',
      title: 'Тайм-клуб «1387»',
      category: 'Кафе и коворкинг',
      discountDescription: 'Скидка 20% на весь кофе при показе статуса «Я гуляю» в приложении СВОИ.',
      hasDiscount: true,
      latitude: 53.1390,
      longitude: 29.2230,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'poi-3',
      title: 'Скульптура Бобра',
      category: 'Достопримечательности',
      discountDescription: 'Главный фотоспот города. Место старта клановых квестов.',
      hasDiscount: false,
      latitude: 53.1375,
      longitude: 29.2240,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'poi-4',
      title: 'Бобруйск-Арена',
      category: 'Спорт и активности',
      discountDescription: 'Скидка 10% на массовое катание для кланов от 3 человек.',
      hasDiscount: true,
      latitude: 53.1415,
      longitude: 29.2450,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'poi-5',
      title: 'Бобруйская Крепость & Березина',
      category: 'Природа и закаты',
      discountDescription: 'Вид на реку, романтические прогулки и вечерние сборы.',
      hasDiscount: false,
      latitude: 53.1340,
      longitude: 29.2420,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'poi-6',
      title: 'Додо Пицца (ул. Минская)',
      category: 'Еда и напитки',
      discountDescription: 'Скидка 15% на комбо для кланов со стриком от 3 недель!',
      hasDiscount: true,
      latitude: 53.1420,
      longitude: 29.2190,
      createdAt: new Date().toISOString(),
    },
  ]);

  // Clans Data
  const [myClans, setMyClans] = useState<Clan[]>([
    {
      id: 'clan-1',
      leaderId: '11111111-2222-3333-4444-555555555555',
      leaderName: 'Алексей',
      title: 'Бобруйские Бродяги',
      description: 'Гуляем вечерами по Социалке и Набережной. Любим живую музыку и кофе.',
      tag: '#социалка',
      maxMembers: 10,
      memberCount: 7,
      currentStreak: 4,
      streakExpiresAt: new Date(Date.now() + 500000000).toISOString(),
      isOpenForJoin: true,
      createdAt: new Date().toISOString(),
      isCurrentUserMember: true,
      isCurrentUserLeader: true,
    },
    {
      id: 'clan-2',
      leaderId: '22222222-3333-4444-5555-666666666666',
      leaderName: 'Влад',
      title: 'Стрит-воркаут Крепость',
      description: 'Турники, брусья, вечерние пробежки до ледового дворца.',
      tag: '#спорт',
      maxMembers: 8,
      memberCount: 5,
      currentStreak: 2,
      streakExpiresAt: new Date(Date.now() + 200000000).toISOString(),
      isOpenForJoin: true,
      createdAt: new Date().toISOString(),
      isCurrentUserMember: true,
      isCurrentUserLeader: false,
    },
  ]);

  const [discoverClans, setDiscoverClans] = useState<Clan[]>([
    {
      id: 'clan-3',
      leaderId: '33333333-4444-5555-6666-777777777777',
      leaderName: 'Катя',
      title: 'Кофейные Эксперты 1387',
      description: 'Изучаем лучшие кофейные точки Бобруйска и играем в настолки.',
      tag: '#кофе',
      maxMembers: 12,
      memberCount: 6,
      currentStreak: 5,
      streakExpiresAt: new Date(Date.now() + 400000000).toISOString(),
      isOpenForJoin: true,
      createdAt: new Date().toISOString(),
      isCurrentUserMember: false,
      isCurrentUserLeader: false,
    },
  ]);

  // News & Promocodes
  const [news, setNews] = useState<CityNewsItem[]>([
    {
      id: 'news-1',
      title: '🔥 Flash: Акустический вечер на Социалке!',
      content: 'Сегодня с 19:30 уличные гитаристы играют на пешеходке. Собирай клан и выходи!',
      isFlashEvent: true,
      expiresAt: new Date(Date.now() + 10800000).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'news-2',
      title: 'Массовое катание на Бобруйск-Арене',
      content: 'В эту субботу для кланов со стриком от 2 недель — скидки на прокат коньков.',
      isFlashEvent: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);

  const [promocodes, setPromocodes] = useState<PartnerPromocode[]>([
    {
      id: 'p-1',
      poiTitle: 'Тайм-клуб «1387»',
      title: 'Бесплатный фильтр-кофе',
      costInPoints: 150,
      promoCode: 'SVOI-COFFEE-1387',
      isRedeemed: false,
    },
    {
      id: 'p-2',
      poiTitle: 'Додо Пицца',
      title: 'Скидка 25% на большую пиццу',
      costInPoints: 250,
      promoCode: 'SVOI-DODO-BOBR25',
      isRedeemed: false,
    },
    {
      id: 'p-3',
      poiTitle: 'Бобруйск-Арена',
      title: 'Вход на сеанс катания',
      costInPoints: 300,
      promoCode: 'SVOI-ARENA-SKATE',
      isRedeemed: false,
    },
  ]);

  // Chats & Messages
  const [chats, setChats] = useState<ChatSummary[]>([
    {
      id: 'chat-clan-1',
      isClanChat: true,
      clanId: 'clan-1',
      title: 'Клан: Бобруйские Бродяги',
      lastMessage: 'Сегодня сбор в 20:00 у бобра на Социалке!',
      lastMessageTime: new Date(Date.now() - 1200000).toISOString(),
      unreadCount: 2,
    },
    {
      id: 'chat-direct-1',
      isClanChat: false,
      title: 'Илья (Кандидат)',
      lastMessage: 'Привет! Хочу вступить в ваш клан, часто гуляю по вечерам.',
      lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
      unreadCount: 1,
    },
  ]);

  const [selectedChat, setSelectedChat] = useState<ChatSummary | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      chatId: 'chat-clan-1',
      senderId: '22222222-3333-4444-5555-666666666666',
      senderName: 'Максим',
      textContent: 'Всем привет! Кто сегодня выходит на Социалку?',
      sentAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'm-2',
      chatId: 'chat-clan-1',
      senderId: '11111111-2222-3333-4444-555555555555',
      senderName: 'Алексей (СВОЙ)',
      textContent: 'Сегодня сбор в 20:00 у бобра на Социалке! Нам нужен кворум для продления стрика 🔥',
      sentAt: new Date(Date.now() - 1200000).toISOString(),
    },
  ]);

  // Initial load and SignalR initialization
  useEffect(() => {
    // Start SignalR
    signalRService.startConnections(
      (msg) => {
        setActiveMessages((prev) => [...prev, msg]);
      },
      (count) => {
        setWalkersCount(count);
      },
      (newHeatmap) => {
        setHeatmap(newHeatmap);
      }
    );

    // Initial background geo ping (converts to H3 index without saving raw GPS)
    api.sendGeoPing(53.1378, 29.2245, 10, 'Walking').catch(() => {});

    return () => {
      signalRService.stopConnections();
    };
  }, []);

  const handleSendMessage = (chatId: string, text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatId,
      senderId: user?.id || 'me',
      senderName: user?.firstName || 'Я',
      textContent: text,
      sentAt: new Date().toISOString(),
    };

    setActiveMessages((prev) => [...prev, newMsg]);
    signalRService.sendMessage(chatId, text).catch(() => {});
  };

  const handleOpenFilterChat = async (clanId: string, candidateUserId: string) => {
    try {
      const res = await api.openCandidateFilterChat(clanId, candidateUserId);
      const newFilterChat: ChatSummary = {
        id: res.chatId,
        isClanChat: false,
        title: 'Чат-фильтр с кандидатом',
        lastMessage: 'Чат открыт',
        unreadCount: 0,
      };
      setChats((prev) => [newFilterChat, ...prev]);
      setSelectedChat(newFilterChat);
    } catch (_) {
      // Offline fallback
      const dummyChat: ChatSummary = {
        id: `filter-${candidateUserId}`,
        isClanChat: false,
        title: 'Чат-фильтр с кандидатом',
        lastMessage: 'Диалог для предварительного общения перед одобрением',
        unreadCount: 0,
      };
      setSelectedChat(dummyChat);
    }
  };

  const theme = Colors[currentTheme];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={currentTheme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.background}
      />

      <View style={styles.rootContainer}>
        {/* Main Screen: Full-Screen Map (NO BOTTOM NAVIGATION!) */}
        <MapScreen
          walkersCount={walkersCount}
          heatmap={heatmap}
          pois={pois}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          currentTheme={currentTheme}
        />

        {/* Left Drawer Navigation (Occupies strictly 85% width) */}
        <LeftDrawer
          visible={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          user={user}
          onUpdateUser={(updated) => setUser(updated)}
          chats={chats}
          activeMessages={activeMessages}
          selectedChat={selectedChat}
          onSelectChat={(chat) => setSelectedChat(chat)}
          onBackToChatList={() => setSelectedChat(null)}
          onSendMessage={handleSendMessage}
          myClans={myClans}
          discoverClans={discoverClans}
          onRefreshClans={async () => {
            try {
              const my = await api.getMyClans();
              setMyClans(my);
              const disc = await api.discoverClans();
              setDiscoverClans(disc);
            } catch (_) {}
          }}
          news={news}
          promocodes={promocodes}
          onPointsUpdated={(newBal) => {
            if (user) setUser({ ...user, pointsBalance: newBal });
          }}
          currentTheme={currentTheme}
          onChangeTheme={(t) => setCurrentTheme(t)}
          ringColorKey={ringColorKey}
          onChangeRingColor={(c) => setRingColorKey(c)}
          aiPersona={aiPersona}
          onChangeAiPersona={(p) => setAiPersona(p)}
          onOpenFilterChat={handleOpenFilterChat}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  rootContainer: {
    flex: 1,
    position: 'relative',
  },
});
