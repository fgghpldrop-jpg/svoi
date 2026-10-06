import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
} from 'react-native';
import {
  UserProfile,
  Clan,
  CityNewsItem,
  PartnerPromocode,
  ChatSummary,
  ChatMessage,
  MapTheme,
  AiPersona,
} from '../types';
import { Colors } from '../theme';
import { ProfileModule } from './modules/ProfileModule';
import { MessengerModule } from './modules/MessengerModule';
import { ClansModule } from './modules/ClansModule';
import { CityPulseModule } from './modules/CityPulseModule';
import { MarketModule } from './modules/MarketModule';
import { SettingsModule } from './modules/SettingsModule';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85; // Strictly 85% width according to TZ!

type ModuleType = 'profile' | 'messenger' | 'clans' | 'pulse' | 'market' | 'settings';

interface LeftDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdateUser: (u: UserProfile) => void;
  chats: ChatSummary[];
  activeMessages: ChatMessage[];
  selectedChat: ChatSummary | null;
  onSelectChat: (chat: ChatSummary) => void;
  onBackToChatList: () => void;
  onSendMessage: (chatId: string, text: string) => void;
  myClans: Clan[];
  discoverClans: Clan[];
  onRefreshClans: () => void;
  news: CityNewsItem[];
  promocodes: PartnerPromocode[];
  onPointsUpdated: (bal: number) => void;
  currentTheme: MapTheme;
  onChangeTheme: (t: MapTheme) => void;
  ringColorKey: string;
  onChangeRingColor: (c: string) => void;
  aiPersona: AiPersona;
  onChangeAiPersona: (p: AiPersona) => void;
  onOpenFilterChat?: (clanId: string, candidateUserId: string) => void;
}

export const LeftDrawer: React.FC<LeftDrawerProps> = ({
  visible,
  onClose,
  user,
  onUpdateUser,
  chats,
  activeMessages,
  selectedChat,
  onSelectChat,
  onBackToChatList,
  onSendMessage,
  myClans,
  discoverClans,
  onRefreshClans,
  news,
  promocodes,
  onPointsUpdated,
  currentTheme,
  onChangeTheme,
  ringColorKey,
  onChangeRingColor,
  aiPersona,
  onChangeAiPersona,
  onOpenFilterChat,
}) => {
  const [activeModule, setActiveModule] = useState<ModuleType>('profile');
  const theme = Colors[currentTheme];

  const modulesList: { id: ModuleType; title: string; icon: string }[] = [
    { id: 'profile', title: 'Профиль', icon: '👤' },
    { id: 'messenger', title: 'Мессенджер', icon: '💬' },
    { id: 'clans', title: 'Кланы', icon: '🛡️' },
    { id: 'pulse', title: 'Пульс', icon: '🔥' },
    { id: 'market', title: 'Маркет', icon: '🎁' },
    { id: 'settings', title: 'Настройки', icon: '⚙️' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        {/* Left Drawer Container taking 85% screen width */}
        <View style={[styles.drawerContent, { width: DRAWER_WIDTH, backgroundColor: theme.drawerBg }]}>
          {/* Header of Drawer */}
          <View style={[styles.drawerHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.logoRow}>
              <Text style={[styles.logoText, { color: theme.accent }]}>«СВОИ»</Text>
              <Text style={[styles.cityText, { color: theme.textSecondary }]}>Бобруйск</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Module Switcher Bar (Replaces bottom navigation entirely!) */}
          <View style={[styles.moduleNav, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navScroll}>
              {modulesList.map((m) => {
                const isSelected = activeModule === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.moduleTab,
                      {
                        borderBottomColor: isSelected ? theme.accent : 'transparent',
                        backgroundColor: isSelected ? theme.surfaceHover : 'transparent',
                      },
                    ]}
                    onPress={() => setActiveModule(m.id)}
                  >
                    <Text style={styles.moduleTabIcon}>{m.icon}</Text>
                    <Text
                      style={[
                        styles.moduleTabText,
                        {
                          color: isSelected ? theme.accent : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {m.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Active Module Container */}
          <View style={styles.moduleBody}>
            {activeModule === 'profile' && (
              <ProfileModule
                user={user}
                onUpdateUser={onUpdateUser}
                currentTheme={currentTheme}
                ringColorKey={ringColorKey}
                aiPersona={aiPersona}
              />
            )}

            {activeModule === 'messenger' && (
              <MessengerModule
                chats={chats}
                activeMessages={activeMessages}
                currentUserId={user?.id}
                selectedChat={selectedChat}
                onSelectChat={onSelectChat}
                onBackToChatList={onBackToChatList}
                onSendMessage={onSendMessage}
                currentTheme={currentTheme}
              />
            )}

            {activeModule === 'clans' && (
              <ClansModule
                myClans={myClans}
                discoverClans={discoverClans}
                onRefreshClans={onRefreshClans}
                onOpenFilterChat={(clanId, candidateUserId) => {
                  if (onOpenFilterChat) {
                    onOpenFilterChat(clanId, candidateUserId);
                    setActiveModule('messenger');
                  }
                }}
                currentTheme={currentTheme}
              />
            )}

            {activeModule === 'pulse' && (
              <CityPulseModule news={news} currentTheme={currentTheme} />
            )}

            {activeModule === 'market' && (
              <MarketModule
                pointsBalance={user?.pointsBalance || 0}
                promocodes={promocodes}
                myClans={myClans}
                onPointsUpdated={onPointsUpdated}
                currentTheme={currentTheme}
              />
            )}

            {activeModule === 'settings' && (
              <SettingsModule
                currentTheme={currentTheme}
                onChangeTheme={onChangeTheme}
                ringColorKey={ringColorKey}
                onChangeRingColor={onChangeRingColor}
                aiPersona={aiPersona}
                onChangeAiPersona={onChangeAiPersona}
              />
            )}
          </View>
        </View>

        {/* Tap outside to close drawer (Remaining 15% width) */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.outsideOverlay} />
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawerContent: {
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 16,
  },
  outsideOverlay: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cityText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  moduleNav: {
    borderBottomWidth: 1,
  },
  navScroll: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  moduleTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
  },
  moduleTabIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  moduleTabText: {
    fontSize: 13,
  },
  moduleBody: {
    flex: 1,
  },
});
