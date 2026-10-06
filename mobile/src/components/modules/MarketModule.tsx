import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { PartnerPromocode, Clan } from '../../types';
import { Colors } from '../../theme';
import { api } from '../../services/api';

interface MarketModuleProps {
  pointsBalance: number;
  promocodes: PartnerPromocode[];
  myClans: Clan[];
  onPointsUpdated: (newBalance: number) => void;
  currentTheme?: 'dark' | 'light' | 'neon' | 'retro';
}

export const MarketModule: React.FC<MarketModuleProps> = ({
  pointsBalance,
  promocodes,
  myClans,
  onPointsUpdated,
  currentTheme = 'dark',
}) => {
  const theme = Colors[currentTheme];
  const [selectedClanForShield, setSelectedClanForShield] = useState<string>(myClans[0]?.id || '');
  const [isBuyingShield, setIsBuyingShield] = useState(false);

  const handleBuyShield = async () => {
    if (!selectedClanForShield) {
      Alert.alert('Внимание', 'Выберите клан для активации заморозки стрика');
      return;
    }

    if (pointsBalance < 100) {
      Alert.alert('Недостаточно очков', 'Для покупки «Щита» требуется 100 очков прогулок.');
      return;
    }

    setIsBuyingShield(true);
    try {
      const res: any = await api.buyShield(selectedClanForShield);
      Alert.alert('🛡️ Щит активирован!', res.message || 'Стрик клана заморожен на 7 дней.');
      onPointsUpdated(res.newPointsBalance);
    } catch (err: any) {
      Alert.alert('Ошибка покупки', err.message || 'Не удалось активировать щит');
    } finally {
      setIsBuyingShield(false);
    }
  };

  const handleRedeemCoupon = async (item: PartnerPromocode) => {
    if (pointsBalance < item.costInPoints) {
      Alert.alert('Недостаточно очков', `Требуется ${item.costInPoints} очков, у вас ${pointsBalance}`);
      return;
    }

    try {
      const res: any = await api.redeemCoupon(item.id);
      Alert.alert('Купон получен!', `Ваш промокод: ${res.code}\nПокажите его сотруднику заведения.`);
      item.isRedeemed = true;
      onPointsUpdated(res.pointsBalance);
    } catch (err: any) {
      Alert.alert('Ошибка', err.message || 'Не удалось получить купон');
    }
  };

  return (
    <FlatList
      data={promocodes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 14 }}
      ListHeaderComponent={
        <View style={styles.header}>
          {/* Walking Points Balance Card */}
          <View style={[styles.balanceCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Ваш баланс за прогулки</Text>
            <View style={styles.balanceValueRow}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={[styles.balanceValue, { color: theme.accent }]}>{pointsBalance}</Text>
              <Text style={[styles.balanceUnit, { color: theme.textMuted }]}>очков</Text>
            </View>
            <Text style={[styles.balanceHint, { color: theme.textMuted }]}>
              +50 очков за каждый успешный совместный выход клана (от 30 мин)
            </Text>
          </View>

          {/* Clan Shield Freeze Card */}
          <View style={[styles.shieldCard, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: theme.info }]}>
            <View style={styles.shieldHeader}>
              <Text style={styles.shieldIcon}>🛡️</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.shieldTitle, { color: theme.textPrimary }]}>Внутриигровой «Щит»</Text>
                <Text style={[styles.shieldDesc, { color: theme.textSecondary }]}>
                  Заморозка кланового стрика на 7 дней, если нет времени выйти
                </Text>
              </View>
            </View>

            {myClans.length > 0 ? (
              <View style={styles.shieldActionRow}>
                <TouchableOpacity
                  style={[styles.buyShieldBtn, { backgroundColor: theme.info }]}
                  onPress={handleBuyShield}
                  disabled={isBuyingShield}
                >
                  <Text style={styles.buyShieldBtnText}>
                    {isBuyingShield ? 'Покупка...' : 'Купить Щит (100 очков)'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={[styles.noClanText, { color: theme.textMuted }]}>
                Вступите в клан, чтобы активировать защиту стрика
              </Text>
            )}
          </View>

          <Text style={[styles.catalogTitle, { color: theme.textPrimary }]}>Купоны и акции в Бобруйске</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.couponCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.couponPoiTitle, { color: theme.accent }]}>
              {item.poiTitle || 'Партнер «СВОИ»'}
            </Text>
            <Text style={[styles.couponTitle, { color: theme.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.couponCost, { color: theme.streakOrange }]}>
              Стоимость: {item.costInPoints} очков
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.redeemBtn,
              {
                backgroundColor: item.isRedeemed ? theme.surfaceHover : theme.accent,
              },
            ]}
            onPress={() => handleRedeemCoupon(item)}
            disabled={item.isRedeemed}
          >
            <Text style={[styles.redeemBtnText, { color: item.isRedeemed ? theme.textMuted : '#FFFFFF' }]}>
              {item.isRedeemed ? 'Получен' : 'Забрать'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 12,
  },
  balanceCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  coinIcon: {
    fontSize: 26,
    marginRight: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '900',
    marginRight: 8,
  },
  balanceUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceHint: {
    fontSize: 11,
    marginTop: 4,
  },
  shieldCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  shieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIcon: {
    fontSize: 28,
  },
  shieldTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  shieldDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  shieldActionRow: {
    marginTop: 12,
  },
  buyShieldBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyShieldBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  noClanText: {
    fontSize: 11,
    marginTop: 8,
  },
  catalogTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  couponPoiTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  couponCost: {
    fontSize: 12,
    fontWeight: '800',
  },
  redeemBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 10,
  },
  redeemBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
