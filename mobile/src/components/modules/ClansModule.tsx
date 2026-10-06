import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView, Alert } from 'react-native';
import { Clan, ClanJoinRequest } from '../../types';
import { Colors } from '../../theme';
import { api } from '../../services/api';

interface ClansModuleProps {
  myClans: Clan[];
  discoverClans: Clan[];
  onRefreshClans: () => void;
  onOpenFilterChat?: (clanId: string, candidateUserId: string) => void;
  currentTheme?: 'dark' | 'light' | 'neon' | 'retro';
}

export const ClansModule: React.FC<ClansModuleProps> = ({
  myClans,
  discoverClans,
  onRefreshClans,
  onOpenFilterChat,
  currentTheme = 'dark',
}) => {
  const theme = Colors[currentTheme];
  const [activeTab, setActiveTab] = useState<'my' | 'discover' | 'create'>('my');

  // Create clan form states
  const [newTitle, setNewTitle] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMaxMembers, setNewMaxMembers] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Moderation state
  const [selectedClanForRequests, setSelectedClanForRequests] = useState<Clan | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ClanJoinRequest[]>([]);

  // Mathematical Quorum calculation from ТЗ: K = MAX(2, CEIL(N * 0.6))
  const calculateQuorum = (totalMembers: number) => {
    return Math.max(2, Math.ceil(totalMembers * 0.6));
  };

  const handleCreateClan = async () => {
    if (!newTitle.trim() || !newTag.trim()) {
      Alert.alert('Ошибка', 'Укажите название и тег клана');
      return;
    }

    if (myClans.length >= 5) {
      Alert.alert('Системный лимит', 'Вы уже состоите в 5 кланах. Это максимальное количество!');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createClan({
        title: newTitle.trim(),
        description: newDescription.trim(),
        tag: newTag.trim(),
        maxMembers: newMaxMembers,
      });
      Alert.alert('Успех', `Клан «${newTitle}» успешно создан!`);
      setNewTitle('');
      setNewTag('');
      setNewDescription('');
      setActiveTab('my');
      onRefreshClans();
    } catch (err: any) {
      Alert.alert('Ошибка создания', err.message || 'Не удалось создать клан');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinClan = async (clanId: string) => {
    if (myClans.length >= 5) {
      Alert.alert('Лимит кланов', 'Вы не можете вступить более чем в 5 кланов одновременно.');
      return;
    }

    try {
      await api.requestJoinClan(clanId);
      Alert.alert('Заявка отправлена', 'Лидер клана рассмотрит вашу заявку.');
      onRefreshClans();
    } catch (err: any) {
      Alert.alert('Ошибка вступления', err.message || 'Не удалось отправить заявку');
    }
  };

  const handleOpenModeration = async (clan: Clan) => {
    setSelectedClanForRequests(clan);
    try {
      const reqs = await api.getClanRequests(clan.id);
      setPendingRequests(reqs);
    } catch (err: any) {
      Alert.alert('Ошибка', 'Не удалось загрузить заявки');
    }
  };

  const handleModerate = async (requestId: string, approve: boolean) => {
    if (!selectedClanForRequests) return;
    try {
      await api.moderateClanRequest(selectedClanForRequests.id, requestId, approve);
      setPendingRequests(pendingRequests.filter((r) => r.id !== requestId));
      onRefreshClans();
      Alert.alert('Готово', approve ? 'Участник принят в клан!' : 'Заявка отклонена');
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Действие не выполнено');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Tabs with 5-Clan System Limit Counter */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[styles.tabBtn, { backgroundColor: activeTab === 'my' ? theme.accent : 'transparent' }]}
          onPress={() => {
            setActiveTab('my');
            setSelectedClanForRequests(null);
          }}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'my' ? '#FFFFFF' : theme.textSecondary }]}>
            Мои кланы ({myClans.length}/5)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, { backgroundColor: activeTab === 'discover' ? theme.accent : 'transparent' }]}
          onPress={() => {
            setActiveTab('discover');
            setSelectedClanForRequests(null);
          }}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'discover' ? '#FFFFFF' : theme.textSecondary }]}>
            Поиск движа
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, { backgroundColor: activeTab === 'create' ? theme.accent : 'transparent' }]}
          onPress={() => {
            setActiveTab('create');
            setSelectedClanForRequests(null);
          }}
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'create' ? '#FFFFFF' : theme.textSecondary }]}>
            + Создать
          </Text>
        </TouchableOpacity>
      </View>

      {/* Moderation Sheet */}
      {selectedClanForRequests ? (
        <View style={styles.moderationContainer}>
          <TouchableOpacity onPress={() => setSelectedClanForRequests(null)} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: theme.accent }]}>← Назад к моим кланам</Text>
          </TouchableOpacity>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Заявки в «{selectedClanForRequests.title}»
          </Text>

          <FlatList
            data={pendingRequests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.requestCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.requestUserName, { color: theme.textPrimary }]}>
                    {item.userName} {item.userIsVerified && '✓'}
                  </Text>
                  <Text style={[styles.requestDate, { color: theme.textMuted }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.requestActions}>
                  {onOpenFilterChat && (
                    <TouchableOpacity
                      style={[styles.filterChatBtn, { borderColor: theme.info }]}
                      onPress={() => onOpenFilterChat(selectedClanForRequests.id, item.userId)}
                    >
                      <Text style={[styles.filterChatBtnText, { color: theme.info }]}>Чат-фильтр</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionIconBtn, { backgroundColor: theme.accent }]}
                    onPress={() => handleModerate(item.id, true)}
                  >
                    <Text style={styles.iconBtnText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionIconBtn, { backgroundColor: theme.danger }]}
                    onPress={() => handleModerate(item.id, false)}
                  >
                    <Text style={styles.iconBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>Новых заявок пока нет.</Text>
              </View>
            }
          />
        </View>
      ) : activeTab === 'my' ? (
        /* 1. Tab: My Clans */
        <FlatList
          data={myClans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => {
            const quorum = calculateQuorum(item.memberCount);
            return (
              <View style={[styles.clanCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                <View style={styles.clanCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.clanTag, { color: theme.accent }]}>{item.tag}</Text>
                    <Text style={[styles.clanTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                  </View>
                  <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 87, 34, 0.15)', borderColor: theme.streakOrange }]}>
                    <Text style={[styles.streakText, { color: theme.streakOrange }]}>
                      🔥 {item.currentStreak} нед.
                    </Text>
                  </View>
                </View>

                {item.description ? (
                  <Text style={[styles.clanDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                {/* Mathematical Quorum & Streak Info Card */}
                <View style={[styles.quorumBox, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.quorumTitle, { color: theme.textSecondary }]}>
                    Кворум для зачета стрика (≤ 30м, 30 мин):
                  </Text>
                  <Text style={[styles.quorumFormula, { color: theme.accent }]}>
                    K = {quorum} из {item.memberCount} чел. (макс. {item.maxMembers})
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={[styles.leaderBadge, { color: theme.textMuted }]}>
                    {item.isCurrentUserLeader ? '👑 Вы лидер' : `Лидер: ${item.leaderName}`}
                  </Text>

                  {item.isCurrentUserLeader && (
                    <TouchableOpacity
                      style={[styles.moderationBtn, { borderColor: theme.accent }]}
                      onPress={() => handleOpenModeration(item)}
                    >
                      <Text style={[styles.moderationBtnText, { color: theme.accent }]}>Модерация заявок</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Вы пока не состоите ни в одном клане.{'\n'}Найдите движ или создайте свой!
              </Text>
            </View>
          }
        />
      ) : activeTab === 'discover' ? (
        /* 2. Tab: Discover Clans */
        <FlatList
          data={discoverClans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={[styles.clanCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
              <View style={styles.clanCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.clanTag, { color: theme.accent }]}>{item.tag}</Text>
                  <Text style={[styles.clanTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                </View>
                <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 87, 34, 0.15)', borderColor: theme.streakOrange }]}>
                  <Text style={[styles.streakText, { color: theme.streakOrange }]}>
                    🔥 {item.currentStreak} нед.
                  </Text>
                </View>
              </View>

              <Text style={[styles.clanDesc, { color: theme.textSecondary }]}>
                {item.description || 'Открытый сбор клана на улицах Бобруйска'}
              </Text>

              <View style={styles.discoverFooter}>
                <Text style={[styles.membersCount, { color: theme.textMuted }]}>
                  👥 {item.memberCount} / {item.maxMembers} участников
                </Text>

                {item.isCurrentUserMember ? (
                  <View style={[styles.joinedBadge, { backgroundColor: theme.surface }]}>
                    <Text style={{ color: theme.accent, fontSize: 12, fontWeight: '700' }}>✓ Вы состоите</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.joinBtn, { backgroundColor: theme.accent }]}
                    onPress={() => handleJoinClan(item.id)}
                  >
                    <Text style={styles.joinBtnText}>Вступить</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      ) : (
        /* 3. Tab: Create Clan */
        <ScrollView style={{ padding: 16 }}>
          <View style={[styles.clanCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 12 }]}>
              Новый клан в Бобруйске
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Название клана:</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Например: Движ на Социалке"
              placeholderTextColor={theme.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Тег клана (хэштег):</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="#прогулки, #стритбол, #кофе"
              placeholderTextColor={theme.textMuted}
              value={newTag}
              onChangeText={setNewTag}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Лимит участников (от 3 до 15):</Text>
            <View style={styles.limitsRow}>
              {[5, 8, 10, 15].map((lim) => (
                <TouchableOpacity
                  key={lim}
                  style={[
                    styles.limitBtn,
                    {
                      backgroundColor: newMaxMembers === lim ? theme.accent : theme.surface,
                      borderColor: newMaxMembers === lim ? theme.accent : theme.border,
                    },
                  ]}
                  onPress={() => setNewMaxMembers(lim)}
                >
                  <Text style={[styles.limitBtnText, { color: newMaxMembers === lim ? '#FFFFFF' : theme.textSecondary }]}>
                    {lim} чел.
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Описание и точка сбора:</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Опишите, где и когда обычно собираетесь..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={3}
              value={newDescription}
              onChangeText={setNewDescription}
            />

            <TouchableOpacity
              style={[styles.createSubmitBtn, { backgroundColor: theme.accent }]}
              onPress={handleCreateClan}
              disabled={isSubmitting}
            >
              <Text style={styles.createSubmitBtnText}>
                {isSubmitting ? 'Создание...' : 'Запустить клан'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    margin: 12,
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  clanCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  clanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clanTag: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  clanTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
  },
  clanDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  quorumBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
  },
  quorumTitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  quorumFormula: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  leaderBadge: {
    fontSize: 12,
  },
  moderationBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  moderationBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  discoverFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  membersCount: {
    fontSize: 12,
  },
  joinedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  textArea: {
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  limitsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  limitBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  limitBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  createSubmitBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  createSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  moderationContainer: {
    flex: 1,
    padding: 12,
  },
  backBtn: {
    marginBottom: 10,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  requestUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  requestDate: {
    fontSize: 11,
  },
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChatBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  filterChatBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
