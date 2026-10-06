/**
 * СВОИ — DrawerMenu Component
 * Urban Glassmorphism · Telegram-level quality
 *
 * Dependencies:
 *   @react-native-community/blur (BlurView)
 *   react-native-reanimated
 *   react-native-svg (for Lucide-style icons)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
  SlideInLeft,
} from 'react-native-reanimated';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { colors, spacing, radius, typography, animation, shadow } from '../theme/tokens';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface UserProfile {
  id: string;
  firstName: string;
  phoneNumber: string;
  institutionName?: string;
  pointsBalance: number;
  isVerified: boolean;
  statusIsWalking: boolean;
  bio?: string;
  avatarUrl?: string;
}

interface DrawerMenuProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
  onToggleWalking: () => void;
  unreadChats?: number;
  activeStreak?: number;
  walkTimerMinutes?: number;
}

// ═══════════════════════════════════════════
// LUCIDE-STYLE SVG ICONS (inline vectors)
// ═══════════════════════════════════════════

const Icon = {
  MessageCircle: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </Svg>
  ),
  Shield: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </Svg>
  ),
  Flame: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Svg>
  ),
  Gift: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <Path d="M3 9h18" /><Path d="M12 21V9" />
      <Path d="M7.5 9A2.5 2.5 0 0 1 5 6.5 2.5 2.5 0 0 1 7.5 4c1.82 0 3.28 1.18 4.5 3 1.22-1.82 2.68-3 4.5-3A2.5 2.5 0 0 1 19 6.5 2.5 2.5 0 0 1 16.5 9" />
    </Svg>
  ),
  Settings: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <SvgCircle cx="12" cy="12" r="3" />
    </Svg>
  ),
  EyeOff: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <Path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <Path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <Path d="m2 2 20 20" />
    </Svg>
  ),
  Walk: ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <SvgCircle cx="14" cy="5" r="2" />
      <Path d="M18 17v5M10 17l-2 5M12 12V2" />
      <Path d="M6 12l4-1 3 3 3-1" />
    </Svg>
  ),
};

// ═══════════════════════════════════════════
// WALKING STATUS RING (pulsing animation)
// ═══════════════════════════════════════════

const StatusRing: React.FC<{ isWalking: boolean; size?: number }> = ({ isWalking, size = 64 }) => {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isWalking) {
      const interval = setInterval(() => {
        pulseScale.value = withSpring(1.15, { damping: 8, stiffness: 100 });
        setTimeout(() => {
          pulseScale.value = withSpring(1, { damping: 12, stiffness: 200 });
        }, 600);
      }, 1500);
      return () => clearInterval(interval);
    }
    pulseScale.value = withTiming(1, { duration: 200 });
  }, [isWalking]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.15], [0.4, 0]),
  }));

  return (
    <View style={[styles.avatarContainer, { width: size, height: size }]}>
      {isWalking && (
        <Animated.View
          style={[
            styles.pulseRing,
            { width: size + 12, height: size + 12, borderRadius: (size + 12) / 2 },
            pulseStyle,
          ]}
        />
      )}
      <View
        style={[
          styles.avatarRing,
          { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 },
          isWalking && styles.avatarRingActive,
        ]}
      >
        <View style={[styles.avatarInner, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
      </View>
      {isWalking && (
        <View style={styles.statusDot}>
          <View style={styles.statusDotInner} />
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════
// MENU ITEM ROW
// ═══════════════════════════════════════════

interface MenuItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  badge?: number | string;
  badgeColor?: string;
  onPress: () => void;
  index: number;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon, iconBg, title, subtitle, badge, badgeColor, onPress, index,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, animation.spring);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animation.spring);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300).springify()}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
        <Animated.View style={[styles.menuItem, animatedStyle]}>
          <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>
            {icon}
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>{title}</Text>
            {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
          </View>
          {badge !== undefined && (
            <View style={[styles.badge, badgeColor ? { backgroundColor: badgeColor } : {}]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
          <Text style={styles.menuChevron}>›</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════
// SEGMENTED CONTROL (Walk / Home)
// ═══════════════════════════════════════════

const WalkSegment: React.FC<{ isWalking: boolean; timerMin?: number; onToggle: () => void }> = ({
  isWalking, timerMin, onToggle,
}) => {
  const indicator = useSharedValue(isWalking ? 1 : 0);

  useEffect(() => {
    indicator.value = withSpring(isWalking ? 1 : 0, animation.springBouncy);
  }, [isWalking]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: interpolate(indicator.value, [0, 1], [2, 2]),
    right: interpolate(indicator.value, [0, 1], [2, 2]),
    transform: [{ translateX: interpolate(indicator.value, [0, 1], [0, 1]) }],
    // For simplicity, we use full width toggle
  }));

  return (
    <TouchableOpacity
      style={[styles.segment, isWalking && styles.segmentActive]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View style={styles.segmentContent}>
        <View style={[styles.segmentDot, isWalking && styles.segmentDotActive]} />
        <Text style={[styles.segmentLabel, isWalking && styles.segmentLabelActive]}>
          {isWalking ? `Я гуляю · ${timerMin ?? 120} мин` : 'Я дома'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════
// MAIN DRAWER COMPONENT
// ═══════════════════════════════════════════

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  user, isOpen, onClose, onNavigate, onToggleWalking,
  unreadChats = 0, activeStreak = 0, walkTimerMinutes,
}) => {
  const translateX = useSharedValue(-Dimensions.get('window').width);
  const overlayOpacity = useSharedValue(0);
  const drawerWidth = Dimensions.get('window').width * 0.85;

  useEffect(() => {
    if (isOpen) {
      translateX.value = withSpring(0, animation.spring);
      overlayOpacity.value = withTiming(1, { duration: animation.timing.normal });
    } else {
      translateX.value = withSpring(-drawerWidth, animation.spring);
      overlayOpacity.value = withTiming(0, { duration: animation.timing.fast });
    }
  }, [isOpen]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    pointerEvents: isOpen ? 'auto' as const : 'none' as const,
  }));

  const menuItems = [
    {
      key: 'chats',
      icon: <Icon.MessageCircle color={colors.semantic.chat.icon} />,
      iconBg: colors.semantic.chat.bg,
      title: 'Мессенджер',
      subtitle: 'Клановые и личные чаты',
      badge: unreadChats > 0 ? unreadChats : undefined,
      badgeColor: colors.semantic.chat.icon,
    },
    {
      key: 'clans',
      icon: <Icon.Shield color={colors.semantic.clans.icon} />,
      iconBg: colors.semantic.clans.bg,
      title: 'Мои кланы',
      subtitle: 'Стрики и участники',
      badge: activeStreak > 0 ? `🔥${activeStreak}` : undefined,
      badgeColor: colors.semantic.pulse.bg,
    },
    {
      key: 'pulse',
      icon: <Icon.Flame color={colors.semantic.pulse.icon} />,
      iconBg: colors.semantic.pulse.bg,
      title: 'Пульс Бобруйска',
      subtitle: 'Flash-события и движ',
    },
    {
      key: 'market',
      icon: <Icon.Gift color={colors.semantic.market.icon} />,
      iconBg: colors.semantic.market.bg,
      title: 'Маркет наград',
      subtitle: `${user.pointsBalance} очков`,
      badgeColor: colors.semantic.market.icon,
    },
    {
      key: 'settings',
      icon: <Icon.Settings color={colors.semantic.settings.icon} />,
      iconBg: colors.semantic.settings.bg,
      title: 'Настройки',
      subtitle: 'Приватность и безопасность',
    },
  ];

  return (
    <>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { width: drawerWidth }, drawerStyle]}>
        {/* Glass background — using solid dark + border for now, 
            replace with <BlurView blurType="dark" blurAmount={40}> in production */}
        <View style={styles.drawerBg} />

        {/* ── HEADER: User Card ── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <StatusRing isWalking={user.statusIsWalking} size={56} />
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>{user.firstName}</Text>
                {user.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedIcon}>✓</Text>
                  </View>
                )}
              </View>
              {user.institutionName && (
                <View style={styles.instBadge}>
                  <Text style={styles.instText}>{user.institutionName}</Text>
                </View>
              )}
              <Text style={styles.phoneText}>{user.phoneNumber}</Text>
            </View>
          </View>

          {/* Walk segment control */}
          <WalkSegment
            isWalking={user.statusIsWalking}
            timerMin={walkTimerMinutes}
            onToggle={onToggleWalking}
          />
        </View>

        {/* ── MENU LIST ── */}
        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <MenuItem
              key={item.key}
              icon={item.icon}
              iconBg={item.iconBg}
              title={item.title}
              subtitle={item.subtitle}
              badge={item.badge}
              badgeColor={item.badgeColor}
              onPress={() => onNavigate(item.key)}
              index={index}
            />
          ))}
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.incognitoBtn} activeOpacity={0.7}>
            <Icon.EyeOff color={colors.text.tertiary} size={16} />
            <Text style={styles.incognitoText}>Режим инкогнито</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>СВОИ · v1.0 · Бобруйск</Text>
        </View>
      </Animated.View>
    </>
  );
};

// ═══════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════

const styles = StyleSheet.create({
  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 90,
  },

  // Drawer
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  drawerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg.glass,
    borderRightWidth: 1,
    borderRightColor: colors.border.subtle,
  },

  // Header
  header: {
    paddingTop: 60, // Safe area
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userName: {
    fontSize: typography.size.title3,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '900',
  },
  instBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.dim,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
    marginTop: spacing.xs,
  },
  instText: {
    fontSize: typography.size.caption2,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  phoneText: {
    fontSize: typography.size.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },

  // Avatar / Status Ring
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingActive: {
    borderColor: colors.accent.primary,
  },
  avatarInner: {
    backgroundColor: colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.bg.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.status.online,
  },

  // Walk segment
  segment: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  segmentActive: {
    backgroundColor: colors.accent.dim,
    borderColor: colors.border.accent,
  },
  segmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  segmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.tertiary,
  },
  segmentDotActive: {
    backgroundColor: colors.status.online,
  },
  segmentLabel: {
    fontSize: typography.size.footnote,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  segmentLabelActive: {
    color: colors.accent.primary,
  },

  // Menu list
  menuList: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.size.body,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.1,
  },
  menuSubtitle: {
    fontSize: typography.size.caption,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  badgeText: {
    fontSize: typography.size.caption2,
    fontWeight: '700',
    color: '#fff',
  },
  menuChevron: {
    fontSize: 18,
    color: colors.text.tertiary,
    fontWeight: '300',
    marginLeft: spacing.xs,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    gap: spacing.md,
  },
  incognitoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  incognitoText: {
    fontSize: typography.size.footnote,
    color: colors.text.tertiary,
  },
  versionText: {
    fontSize: typography.size.caption2,
    color: colors.text.tertiary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default DrawerMenu;
