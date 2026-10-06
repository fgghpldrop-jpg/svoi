import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { MapTheme, AiPersona } from '../../types';
import { Colors, ActivityRingColors } from '../../theme';

interface SettingsModuleProps {
  currentTheme: MapTheme;
  onChangeTheme: (theme: MapTheme) => void;
  ringColorKey: string;
  onChangeRingColor: (colorKey: string) => void;
  aiPersona: AiPersona;
  onChangeAiPersona: (persona: AiPersona) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  currentTheme,
  onChangeTheme,
  ringColorKey,
  onChangeRingColor,
  aiPersona,
  onChangeAiPersona,
}) => {
  const theme = Colors[currentTheme];
  const [backgroundTracking, setBackgroundTracking] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [telegram2fa, setTelegram2fa] = useState(true);

  const mapThemes: { key: MapTheme; label: string }[] = [
    { key: 'dark', label: 'Тёмная' },
    { key: 'light', label: 'Светлая' },
    { key: 'neon', label: 'Неоновая' },
    { key: 'retro', label: 'Ретро' },
  ];

  const ringColorsList = [
    { key: 'emerald', label: 'Изумруд' },
    { key: 'cyan', label: 'Бирюза' },
    { key: 'violet', label: 'Фиолет' },
    { key: 'sunset', label: 'Закат' },
    { key: 'gold', label: 'Золото' },
  ];

  const personas: AiPersona[] = ['дерзкий', 'дружелюбный', 'краткий', 'ироничный'];

  const handleSos = () => {
    Alert.alert(
      '🚨 Экстренное оповещение SOS',
      'Оповещение с вашим текущим H3-сектором отправлено доверенным контактам и клану в Telegram!',
      [{ text: 'Понятно', style: 'default' }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={[styles.moduleTitle, { color: theme.textPrimary }]}>Настройки</Text>
      <Text style={[styles.moduleSubtitle, { color: theme.textSecondary }]}>
        Персонализация интерфейса и безопасность
      </Text>

      {/* 1. Personalization Section */}
      <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>🎨 Персонализация</Text>

        {/* Map Theme */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Тема оформления карты:</Text>
        <View style={styles.optionsRow}>
          {mapThemes.map((t) => {
            const isSelected = currentTheme === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: isSelected ? theme.accent : theme.surface,
                    borderColor: isSelected ? theme.accent : theme.border,
                  },
                ]}
                onPress={() => onChangeTheme(t.key)}
              >
                <Text style={[styles.optionBtnText, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Activity Ring Color */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Цвет светящегося кольца активности:</Text>
        <View style={styles.colorsRow}>
          {ringColorsList.map((c) => {
            const colorHex = ActivityRingColors[c.key];
            const isSelected = ringColorKey === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.colorCircle,
                  {
                    backgroundColor: colorHex,
                    borderColor: isSelected ? '#FFFFFF' : 'transparent',
                  },
                ]}
                onPress={() => onChangeRingColor(c.key)}
              />
            );
          })}
        </View>

        {/* AI Bio Persona */}
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Характер AI-генератора профиля:</Text>
        <View style={styles.optionsRow}>
          {personas.map((p) => {
            const isSelected = aiPersona === p;
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.optionBtn,
                  {
                    backgroundColor: isSelected ? theme.accent : theme.surface,
                    borderColor: isSelected ? theme.accent : theme.border,
                  },
                ]}
                onPress={() => onChangeAiPersona(p)}
              >
                <Text style={[styles.optionBtnText, { color: isSelected ? '#FFFFFF' : theme.textSecondary }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notification Sound */}
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: theme.textPrimary }]}>Звуки уведомлений клана</Text>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor={'#FFFFFF'}
          />
        </View>
      </View>

      {/* 2. Security & Privacy Section */}
      <View style={[styles.sectionCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
        <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>🛡️ Безопасность</Text>

        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.switchLabel, { color: theme.textPrimary }]}>2FA через Telegram-бота</Text>
            <Text style={[styles.switchSub, { color: theme.textSecondary }]}>
              Защита аккаунта без дорогостоящих SMS
            </Text>
          </View>
          <Switch
            value={telegram2fa}
            onValueChange={setTelegram2fa}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={[styles.switchLabel, { color: theme.textPrimary }]}>Энергоэффективный сбор геоданных</Text>
            <Text style={[styles.switchSub, { color: theme.textSecondary }]}>
              Точный GPS только при нахождении в клановой встрече (≤ 30м)
            </Text>
          </View>
          <Switch
            value={backgroundTracking}
            onValueChange={setBackgroundTracking}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor={'#FFFFFF'}
          />
        </View>

        {/* Trusted SOS Button */}
        <View style={styles.sosContainer}>
          <Text style={[styles.sosTitle, { color: theme.danger }]}>Экстренная помощь</Text>
          <Text style={[styles.sosDesc, { color: theme.textSecondary }]}>
            Мгновенная отправка сигнала тревоги доверенным контактам в Бобруйске
          </Text>
          <TouchableOpacity style={[styles.sosBtn, { backgroundColor: theme.danger }]} onPress={handleSos}>
            <Text style={styles.sosBtnText}>🚨 КНОПКА SOS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  moduleSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  colorsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 11,
    marginTop: 2,
  },
  sosContainer: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  sosTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  sosDesc: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 12,
  },
  sosBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  sosBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
  },
});
