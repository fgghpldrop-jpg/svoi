import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { CityNewsItem } from '../../types';
import { Colors } from '../../theme';

interface CityPulseModuleProps {
  news: CityNewsItem[];
  currentTheme?: 'dark' | 'light' | 'neon' | 'retro';
}

export const CityPulseModule: React.FC<CityPulseModuleProps> = ({
  news,
  currentTheme = 'dark',
}) => {
  const theme = Colors[currentTheme];

  const flashEvents = news.filter((n) => n.isFlashEvent);
  const regularNews = news.filter((n) => !n.isFlashEvent);

  return (
    <FlatList
      data={regularNews}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 14 }}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <Text style={[styles.moduleTitle, { color: theme.textPrimary }]}>Городской пульс • Бобруйск</Text>
          <Text style={[styles.moduleSubtitle, { color: theme.textSecondary }]}>
            Локальная лента событий, уличная музыка и акции
          </Text>

          {/* Flash Events Section */}
          {flashEvents.map((flash) => (
            <View
              key={flash.id}
              style={[
                styles.flashCard,
                { backgroundColor: 'rgba(255, 87, 34, 0.12)', borderColor: theme.streakOrange },
              ]}
            >
              <View style={styles.flashHeader}>
                <View style={[styles.flashBadge, { backgroundColor: theme.streakOrange }]}>
                  <Text style={styles.flashBadgeText}>⚡ FLASH EVENT</Text>
                </View>
                {flash.expiresAt && (
                  <Text style={[styles.expiresText, { color: theme.streakOrange }]}>
                    До конца: ~3 ч.
                  </Text>
                )}
              </View>
              <Text style={[styles.flashTitle, { color: theme.textPrimary }]}>{flash.title}</Text>
              <Text style={[styles.flashContent, { color: theme.textSecondary }]}>{flash.content}</Text>
            </View>
          ))}

          <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>События и движ города</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.newsCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <View style={styles.newsContent}>
            <Text style={[styles.newsTitle, { color: theme.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.newsText, { color: theme.textSecondary }]}>{item.content}</Text>
            <Text style={[styles.newsTime, { color: theme.textMuted }]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Бобруйск
            </Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>Событий пока нет. Будьте первыми!</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 12,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  moduleSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  flashCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  flashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  flashBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  flashBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  expiresText: {
    fontSize: 12,
    fontWeight: '700',
  },
  flashTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  flashContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  newsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  newsText: {
    fontSize: 13,
    lineHeight: 18,
  },
  newsTime: {
    fontSize: 11,
    marginTop: 8,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
});
