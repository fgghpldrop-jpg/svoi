import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '../theme';

interface HeaderOverlayProps {
  walkersCount: number;
  onOpenDrawer: () => void;
  onLocateMe: () => void;
  currentTheme?: 'dark' | 'light' | 'neon' | 'retro';
}

export const HeaderOverlay: React.FC<HeaderOverlayProps> = ({
  walkersCount,
  onOpenDrawer,
  onLocateMe,
  currentTheme = 'dark',
}) => {
  const theme = Colors[currentTheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.mapOverlayBg, borderColor: theme.border }]}>
      {/* Left: Hamburger menu */}
      <TouchableOpacity
        style={[styles.iconButton, { backgroundColor: theme.surface }]}
        onPress={onOpenDrawer}
        activeOpacity={0.7}
      >
        <Text style={[styles.hamburgerIcon, { color: theme.textPrimary }]}>☰</Text>
      </TouchableOpacity>

      {/* Center: Live counter badge */}
      <View style={[styles.counterBadge, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
        <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
        <Text style={[styles.counterText, { color: theme.textPrimary }]}>
          Сейчас гуляют: <Text style={{ color: theme.accent, fontWeight: '700' }}>{walkersCount}</Text> чел.
        </Text>
      </View>

      {/* Right: GPS Location button */}
      <TouchableOpacity
        style={[styles.iconButton, { backgroundColor: theme.surface }]}
        onPress={onLocateMe}
        activeOpacity={0.7}
      >
        <Text style={[styles.gpsIcon, { color: theme.accent }]}>⌖</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  gpsIcon: {
    fontSize: 22,
    fontWeight: '900',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
