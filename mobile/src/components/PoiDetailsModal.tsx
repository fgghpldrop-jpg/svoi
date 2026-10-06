import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { PointOfInterest } from '../types';
import { Colors } from '../theme';

interface PoiDetailsModalProps {
  poi: PointOfInterest | null;
  visible: boolean;
  onClose: () => void;
  onSelectAsMeetpoint?: (poi: PointOfInterest) => void;
  currentTheme?: 'dark' | 'light' | 'neon' | 'retro';
}

export const PoiDetailsModal: React.FC<PoiDetailsModalProps> = ({
  poi,
  visible,
  onClose,
  onSelectAsMeetpoint,
  currentTheme = 'dark',
}) => {
  if (!poi) return null;
  const theme = Colors[currentTheme];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Handle bar */}
          <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={[styles.categoryBadge, { backgroundColor: theme.surfaceHover }]}>
                <Text style={[styles.categoryText, { color: theme.accent }]}>{poi.category}</Text>
              </View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{poi.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: theme.textMuted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {poi.hasDiscount && (
            <View style={[styles.discountBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: theme.accent }]}>
              <Text style={[styles.discountTitle, { color: theme.accent }]}>🎁 Бонус для приложения «СВОИ»:</Text>
              <Text style={[styles.discountDesc, { color: theme.textPrimary }]}>{poi.discountDescription}</Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            {onSelectAsMeetpoint && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: theme.accent }]}
                onPress={() => {
                  onSelectAsMeetpoint(poi);
                  onClose();
                }}
              >
                <Text style={styles.actionBtnText}>Выбрать точкой сбора клана</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  discountBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 12,
  },
  discountTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  discountDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    marginTop: 8,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
