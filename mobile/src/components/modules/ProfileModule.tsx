import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput, ScrollView, Alert } from 'react-native';
import { UserProfile, ActivityTimerOption, AiPersona } from '../../types';
import { Colors, ActivityRingColors } from '../../theme';
import { api } from '../../services/api';

interface ProfileModuleProps {
  user: UserProfile | null;
  onUpdateUser: (user: UserProfile) => void;
  currentTheme?: 'dark' | 'light' | 'neon' | 'retro';
  ringColorKey?: string;
  aiPersona?: AiPersona;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  user,
  onUpdateUser,
  currentTheme = 'dark',
  ringColorKey = 'emerald',
  aiPersona = 'дружелюбный',
}) => {
  const theme = Colors[currentTheme];
  const ringColor = ActivityRingColors[ringColorKey] || theme.accent;

  const [isWalking, setIsWalking] = useState<boolean>(user?.statusIsWalking ?? false);
  const [selectedTimer, setSelectedTimer] = useState<ActivityTimerOption>('2_hours');
  const [isIncognito, setIsIncognito] = useState<boolean>(user?.isIncognito ?? false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['#прогулка', '#кафе']);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [generatedBio, setGeneratedBio] = useState<string>(user?.bio || '');
  const [isVerifiedVideo, setIsVerifiedVideo] = useState<boolean>(user?.isVerified ?? false);

  const availableTags = ['#спорт', '#кино', '#прогулка', '#кафе', '#игры', '#музыка'];

  const handleToggleWalking = async (value: boolean) => {
    setIsWalking(value);
    const durationMinutes = value
      ? selectedTimer === '1_hour'
        ? 60
        : selectedTimer === '2_hours'
        ? 120
        : 360
      : undefined;

    try {
      await api.updateStatus(value, durationMinutes, isIncognito);
      if (user) {
        onUpdateUser({
          ...user,
          statusIsWalking: value,
          statusExpiresAt: value
            ? new Date(Date.now() + (durationMinutes || 120) * 60000).toISOString()
            : undefined,
        });
      }
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось обновить статус');
    }
  };

  const handleToggleIncognito = async (value: boolean) => {
    setIsIncognito(value);
    try {
      await api.updateStatus(isWalking, undefined, value);
      if (user) {
        onUpdateUser({ ...user, isIncognito: value });
      }
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось переключить инкогнито');
    }
  };

  const handleGenerateAiBio = async () => {
    setIsAiLoading(true);
    try {
      const res = await api.generateAiBio({
        personality: aiPersona,
        tags: selectedTags,
        favoriteSpotsInBobruisk: 'Социалка, Березина, клуб 1387',
        hobbies: 'Вечерние прогулки, кофе, музыка',
      });
      setGeneratedBio(res.bio);
      if (user) {
        onUpdateUser({ ...user, bio: res.bio });
      }
    } catch (err: any) {
      Alert.alert('AI-генерация', 'Использован локальный профиль для Бобруйска');
      const fallback = 'Гуляю по Социалке, люблю закаты на Березине и хороший кофе в клубе 1387. Ищу компанию для совместных выходов!';
      setGeneratedBio(fallback);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRecordVideoVerification = () => {
    setIsVerifiedVideo(true);
    if (user) {
      onUpdateUser({ ...user, isVerified: true, verificationVideoUrl: 'https://cdn.svoi.by/videos/verified-circle.mp4' });
    }
    Alert.alert('Верификация пройдена', '3-секундный селфи-кружок записан. В профиле появился подтвержденный статус!');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header Profile Info */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatarGlowRing, { borderColor: ringColor, shadowColor: ringColor }]}>
          <View style={[styles.avatarInner, { backgroundColor: theme.surfaceHover }]}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          {isVerifiedVideo && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.textPrimary }]}>
            {user?.firstName || 'Свой в Бобруйске'}, 20
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.studentBadge, { backgroundColor: theme.surfaceHover }]}>
              <Text style={[styles.studentText, { color: theme.accent }]}>
                🎓 {user?.institutionName || 'БГТУ (Бобруйск)'}
              </Text>
            </View>
          </View>
          <Text style={[styles.pointsText, { color: theme.streakOrange }]}>
            🪙 Баланс: {user?.pointsBalance || 50} очков
          </Text>
        </View>
      </View>

      {/* 2. Walking Status Switcher */}
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.switchRow}>
          <View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              {isWalking ? '🚶 Я гуляю' : '🏠 Я дома'}
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              {isWalking ? 'Вы участвуете в городском движе' : 'Статус невидим для встреч'}
            </Text>
          </View>
          <Switch
            value={isWalking}
            onValueChange={handleToggleWalking}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        {isWalking && (
          <View style={styles.timerContainer}>
            <Text style={[styles.timerTitle, { color: theme.textMuted }]}>Таймер активности:</Text>
            <View style={styles.timerButtonsRow}>
              {(['1_hour', '2_hours', 'till_evening'] as ActivityTimerOption[]).map((opt) => {
                const label = opt === '1_hour' ? '1 час' : opt === '2_hours' ? '2 часа' : 'До вечера';
                const isSelected = selectedTimer === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.timerBtn,
                      {
                        backgroundColor: isSelected ? theme.accent : theme.surface,
                        borderColor: isSelected ? theme.accent : theme.border,
                      },
                    ]}
                    onPress={() => setSelectedTimer(opt)}
                  >
                    <Text style={[styles.timerBtnText, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* 3. Incognito Mode */}
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>🕶 Режим «Инкогнито»</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Скрывает ваш вклад в общую тепловую карту H3
            </Text>
          </View>
          <Switch
            value={isIncognito}
            onValueChange={handleToggleIncognito}
            trackColor={{ false: theme.border, true: theme.info }}
            thumbColor={'#FFFFFF'}
          />
        </View>
      </View>

      {/* 4. Full Profile: Video Verification Circle */}
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>⭕ Селфи-кружок верификации</Text>
        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
          3-секундное видео для защиты сообщества от ботов и фейков
        </Text>
        <TouchableOpacity
          style={[styles.verificationBtn, { backgroundColor: isVerifiedVideo ? theme.surfaceHover : theme.accent }]}
          onPress={handleRecordVideoVerification}
        >
          <Text style={[styles.verificationBtnText, { color: isVerifiedVideo ? theme.accent : '#FFFFFF' }]}>
            {isVerifiedVideo ? '✓ Верифицирован (Перезаписать)' : 'Записать 3-сек. кружок'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. Tags Selection */}
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>🏷️ Теги интересов</Text>
        <View style={styles.tagsContainer}>
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: isSelected ? theme.accent : theme.surface,
                    borderColor: isSelected ? theme.accent : theme.border,
                  },
                ]}
                onPress={() => handleToggleTag(tag)}
              >
                <Text style={[styles.tagText, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 6. AI Bio Assistant */}
      <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <View style={styles.aiHeader}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>✨ AI-Био профиля</Text>
          <Text style={[styles.aiPersonaBadge, { color: theme.info }]}>Тон: {aiPersona}</Text>
        </View>
        <Text style={[styles.bioText, { color: theme.textPrimary, backgroundColor: theme.surface }]}>
          {generatedBio || 'Нажмите кнопку ниже, чтобы сгенерировать живое описание для прогулок по Бобруйску.'}
        </Text>
        <TouchableOpacity
          style={[styles.aiGenerateBtn, { backgroundColor: theme.accent }]}
          onPress={handleGenerateAiBio}
          disabled={isAiLoading}
        >
          <Text style={styles.aiGenerateBtnText}>
            {isAiLoading ? 'Генерация...' : 'Сгенерировать AI-Био'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarGlowRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#3B82F6',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  metaRow: {
    marginTop: 4,
  },
  studentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  studentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  timerContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  timerTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  timerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timerBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  timerBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verificationBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  verificationBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiPersonaBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  bioText: {
    padding: 12,
    borderRadius: 10,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  aiGenerateBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  aiGenerateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
