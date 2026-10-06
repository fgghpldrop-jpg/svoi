/**
 * СВОИ — Production MapScreen Component
 * Stack: React Native (TypeScript) + @maplibre/maplibre-react-native + Lucide Icons
 *
 * Features:
 * 1. Midnight vector map engine with camera bound strictly to Bobruysk.
 * 2. Cyber-Barrier: Inverted world mask + dual-layer neon glowing perimeter.
 * 3. Uber H3 heatmaps with 4-level color thresholding & density badges.
 * 4. Minimalist dark squircle POI markers with Lucide vector icons.
 * 5. Floating HUD overlay: Live top bar, out-of-bounds warning banner, walking FAB with timer modal.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import {
  Menu,
  Crosshair,
  Footprints,
  Coffee,
  Flame,
  Dumbbell,
  Wine,
  Music,
  Landmark,
  Sparkles,
  ShieldAlert,
  Clock,
  Check,
  X,
} from 'lucide-react-native';

import { HeatmapPolygon, PointOfInterest, UserProfile, ActivityTimerOption } from '../types';
import { PoiDetailsModal } from './PoiDetailsModal';
import {
  BOBRUYSK_CENTER,
  BOBRUYSK_BOUNDS,
  BOBRUYSK_CAMERA_CONSTRAINTS,
  generateInvertedMask,
  getBarrierBorderGeoJSON,
  isPointInsideBobruysk,
} from '../utils/geoFencing';

// Initialise open-source vector map engine without proprietary keys
MapLibreGL.setAccessToken(null);

// Open Dark Matter vector tile style URL (Carto / OpenStreetMap)
export const MIDNIGHT_STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// ═══════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════

export interface MapScreenProps {
  walkersCount: number;
  heatmap: HeatmapPolygon[];
  pois: PointOfInterest[];
  onOpenDrawer: () => void;
  userProfile?: UserProfile | null;
  isWalking?: boolean;
  walkingExpiresAt?: string | null;
  onStartWalking?: (duration: ActivityTimerOption) => void;
  onStopWalking?: () => void;
  currentTheme?: 'dark' | 'light' | 'neon' | 'retro';
}

// ═══════════════════════════════════════════════════════════════
// POI ICON RESOLVER
// ═══════════════════════════════════════════════════════════════

function renderPoiVectorIcon(category: string, title: string) {
  const query = `${category} ${title}`.toLowerCase();
  const iconProps = { size: 18, color: '#F3F4F6' };

  if (query.includes('кофе') || query.includes('кафе') || query.includes('1387')) {
    return <Coffee {...iconProps} color="#10B981" />;
  }
  if (query.includes('социалк') || query.includes('движ') || query.includes('огонь')) {
    return <Flame {...iconProps} color="#F59E0B" />;
  }
  if (query.includes('лед') || query.includes('арен') || query.includes('спорт')) {
    return <Dumbbell {...iconProps} color="#3B82F6" />;
  }
  if (query.includes('бар') || query.includes('паб') || query.includes('коктейл')) {
    return <Wine {...iconProps} color="#EC4899" />;
  }
  if (query.includes('музык') || query.includes('концерт')) {
    return <Music {...iconProps} color="#8B5CF6" />;
  }
  if (query.includes('крепост') || query.includes('памятник') || query.includes('бобр')) {
    return <Landmark {...iconProps} color="#94A3B8" />;
  }
  return <Sparkles {...iconProps} color="#10B981" />;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const MapScreen: React.FC<MapScreenProps> = ({
  walkersCount,
  heatmap,
  pois,
  onOpenDrawer,
  userProfile,
  isWalking = false,
  walkingExpiresAt,
  onStartWalking,
  onStopWalking,
  currentTheme = 'dark',
}) => {
  const cameraRef = useRef<MapLibreGL.Camera>(null);

  // States
  const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(null);
  const [isTimerModalVisible, setIsTimerModalVisible] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<string>('2:00');

  // Simulated / real user GPS coordinates (defaulting to Bobruysk Socialka)
  const [userCoords, setUserCoords] = useState<[number, number]>(BOBRUYSK_CENTER);
  const isUserInsideCity = useMemo(() => isPointInsideBobruysk(userCoords[0], userCoords[1]), [userCoords]);

  // Geofence & Cyber-barrier GeoJSON layers
  const invertedMaskGeoJSON = useMemo(() => generateInvertedMask(), []);
  const barrierBorderGeoJSON = useMemo(() => getBarrierBorderGeoJSON(), []);

  // Format active walking countdown timer
  useEffect(() => {
    if (!isWalking || !walkingExpiresAt) {
      setRemainingTime('2:00');
      return;
    }

    const calcTime = () => {
      const diffMs = new Date(walkingExpiresAt).getTime() - Date.now();
      if (diffMs <= 0) {
        setRemainingTime('0:00');
        return;
      }
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setRemainingTime(`${hours}:${minutes < 10 ? '0' : ''}${minutes}`);
    };

    calcTime();
    const timer = setInterval(calcTime, 30000);
    return () => clearInterval(timer);
  }, [isWalking, walkingExpiresAt]);

  // Transform H3 Heatmap Polygons into GeoJSON FeatureCollection
  const heatmapGeoJSON = useMemo(() => {
    const features = heatmap
      .filter((poly) => poly.coordinates && poly.coordinates.length > 2)
      .map((poly) => {
        const ring = [...poly.coordinates];
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          ring.push(first);
        }

        // Exact TZ color thresholds:
        // < 10: transparent
        // 10 - 20: Emerald #10B981, 0.22 fill
        // 21 - 40: Orange #F59E0B, 0.28 fill
        // 41+: Red Hot #EF4444, 0.38 fill
        let fillColor = '#10B981';
        let fillOpacity = 0.22;
        let strokeColor = '#10B981';
        let strokeOpacity = 0.5;
        let strokeWidth = 1.5;

        if (poly.userCount < 10) {
          fillOpacity = 0.0;
          strokeOpacity = 0.0;
        } else if (poly.intensity === 'Orange' || (poly.userCount >= 21 && poly.userCount <= 40)) {
          fillColor = '#F59E0B';
          fillOpacity = 0.28;
          strokeColor = '#F59E0B';
          strokeOpacity = 0.7;
        } else if (poly.intensity === 'Red' || poly.userCount > 40) {
          fillColor = '#EF4444';
          fillOpacity = 0.38;
          strokeColor = '#EF4444';
          strokeOpacity = 0.85;
          strokeWidth = 2.0;
        }

        return {
          type: 'Feature' as const,
          id: poly.h3Index,
          properties: {
            h3Index: poly.h3Index,
            userCount: poly.userCount,
            labelText: `${poly.userCount} чел.`,
            fillColor,
            fillOpacity,
            strokeColor,
            strokeOpacity,
            strokeWidth,
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [ring],
          },
        };
      });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [heatmap]);

  // Recenter camera smoothly back onto Bobruysk center
  const handleRecenter = () => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: BOBRUYSK_CENTER,
        zoomLevel: 14.2,
        animationDuration: 850,
      });
    }
  };

  // Select walking duration
  const handleSelectDuration = (duration: ActivityTimerOption) => {
    setIsTimerModalVisible(false);
    if (onStartWalking) {
      onStartWalking(duration);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── 1. MapLibre GL Vector Map View ── */}
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={MIDNIGHT_STYLE_URL}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        surfaceView={true}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: BOBRUYSK_CENTER,
            zoomLevel: BOBRUYSK_CAMERA_CONSTRAINTS.defaultZoom,
          }}
          maxBounds={BOBRUYSK_BOUNDS}
          minZoomLevel={BOBRUYSK_CAMERA_CONSTRAINTS.minZoomLevel}
          maxZoomLevel={BOBRUYSK_CAMERA_CONSTRAINTS.maxZoomLevel}
        />

        {/* ── 2. Inverted World Mask (Dark Outside Bobruysk) ── */}
        <MapLibreGL.ShapeSource id="svoi-world-mask-source" shape={invertedMaskGeoJSON}>
          <MapLibreGL.FillLayer
            id="world-mask-fill"
            style={{
              fillColor: '#07090E',
              fillOpacity: 0.88,
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* ── 3. Cyber-Barrier Neon Perimeter Layers ── */}
        <MapLibreGL.ShapeSource id="svoi-barrier-border-source" shape={barrierBorderGeoJSON}>
          {/* Layer 1: Diffused emerald outer glow */}
          <MapLibreGL.LineLayer
            id="barrier-glow"
            style={{
              lineColor: '#10B981',
              lineWidth: 12,
              lineBlur: 8,
              lineOpacity: 0.45,
            }}
          />

          {/* Layer 2: Sharp high-energy glowing barrier core */}
          <MapLibreGL.LineLayer
            id="barrier-core"
            style={{
              lineColor: '#34D399',
              lineWidth: 2,
              lineOpacity: 0.9,
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* ── 4. Uber H3 Heatmap Layers ── */}
        <MapLibreGL.ShapeSource id="svoi-h3-source" shape={heatmapGeoJSON}>
          {/* Hexagon Fill */}
          <MapLibreGL.FillLayer
            id="h3-fill-layer"
            style={{
              fillColor: ['get', 'fillColor'],
              fillOpacity: ['get', 'fillOpacity'],
            }}
          />

          {/* Hexagon Contour */}
          <MapLibreGL.LineLayer
            id="h3-stroke-layer"
            style={{
              lineColor: ['get', 'strokeColor'],
              lineWidth: ['get', 'strokeWidth'],
              lineOpacity: ['get', 'strokeOpacity'],
            }}
          />

          {/* Hexagon Density Capsule Badge */}
          <MapLibreGL.SymbolLayer
            id="h3-labels-layer"
            style={{
              textField: ['get', 'labelText'],
              textSize: 11,
              textColor: '#F3F4F6',
              textHaloColor: 'rgba(15, 17, 21, 0.95)',
              textHaloWidth: 1.5,
              textAllowOverlap: false,
              textIgnorePlacement: false,
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* ── 5. Minimalist Dark Squircle POI Markers ── */}
        {pois.map((poi) => (
          <MapLibreGL.PointAnnotation
            key={poi.id}
            id={`poi-${poi.id}`}
            coordinate={[poi.longitude, poi.latitude]}
            onSelected={() => setSelectedPoi(poi)}
          >
            <View style={styles.poiAnnotationWrap}>
              <View style={[styles.poiSquircle, poi.hasDiscount && styles.poiSquirclePartner]}>
                {renderPoiVectorIcon(poi.category, poi.title)}
                {/* 5px Amber partner discount dot */}
                {poi.hasDiscount && <View style={styles.partnerDot} />}
              </View>
              {/* Clean label with subtle dark glass backing */}
              <View style={styles.poiLabelWrap}>
                <Text style={styles.poiLabelText} numberOfLines={1}>
                  {poi.title}
                </Text>
              </View>
            </View>
          </MapLibreGL.PointAnnotation>
        ))}

        {/* ── 6. User Location Marker ── */}
        <MapLibreGL.UserLocation
          visible={true}
          animated={true}
          onUpdate={(loc: any) => {
            if (loc && loc.coords) {
              setUserCoords([loc.coords.longitude, loc.coords.latitude]);
            }
          }}
        />
      </MapLibreGL.MapView>

      {/* ── 7. Floating HUD Header Bar ── */}
      <View style={styles.topHeaderContainer}>
        {/* Out-of-bounds Edge Warning Banner */}
        {!isUserInsideCity && (
          <View style={styles.outOfBoundsBanner}>
            <ShieldAlert size={15} color="#EF4444" />
            <Text style={styles.outOfBoundsText}>
              Вы за пределами зоны СВОИ. Доступен режим наблюдателя
            </Text>
          </View>
        )}

        <View style={styles.topCapsule}>
          {/* Left: Menu Drawer Trigger */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onOpenDrawer}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Menu size={18} color="#F3F4F6" />
          </TouchableOpacity>

          {/* Center: Live Walkers Indicator */}
          <View style={styles.liveActivityWrap}>
            <View style={styles.pulseDot}>
              <View style={styles.pulseRing} />
            </View>
            <Text style={styles.liveActivityText}>
              Бобруйск Live • <Text style={styles.liveCountAccent}>{walkersCount}</Text> в сети
            </Text>
          </View>

          {/* Right: GPS Recenter Trigger */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleRecenter}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Crosshair size={18} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 8. Bottom Status FAB («Я гуляю!» / Timer) ── */}
      <View style={styles.bottomFabContainer}>
        {isWalking ? (
          /* Active Walking State Pill */
          <View style={styles.walkingActivePill}>
            <View style={styles.timerInfoGroup}>
              <View style={styles.walkingMiniPulse}>
                <Footprints size={15} color="#10B981" />
              </View>
              <Text style={styles.activeTimerText}>
                Гуляю еще <Text style={styles.timerAccent}>{remainingTime}</Text>
              </Text>
            </View>

            <View style={styles.activePillDivider} />

            <TouchableOpacity
              style={styles.resetHomeBtn}
              activeOpacity={0.7}
              onPress={onStopWalking}
            >
              <Text style={styles.resetHomeText}>Дома</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Idle Start Walking Pill */
          <TouchableOpacity
            style={styles.startWalkingPill}
            activeOpacity={0.85}
            onPress={() => setIsTimerModalVisible(true)}
          >
            <Footprints size={19} color="#FFFFFF" />
            <Text style={styles.startWalkingText}>Я гуляю!</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── 9. Walking Timer Selection Modal ── */}
      <Modal
        visible={isTimerModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsTimerModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsTimerModalVisible(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleGroup}>
                <Clock size={18} color="#10B981" />
                <Text style={styles.modalTitle}>Выбери время прогулки</Text>
              </View>
              <TouchableOpacity onPress={() => setIsTimerModalVisible(false)}>
                <X size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Твой статус отобразится на карте и привлечет единомышленников
            </Text>

            <View style={styles.timerOptionsList}>
              <TouchableOpacity
                style={styles.timerOptionItem}
                activeOpacity={0.8}
                onPress={() => handleSelectDuration('1_hour')}
              >
                <View>
                  <Text style={styles.timerOptionTitle}>1 час</Text>
                  <Text style={styles.timerOptionDesc}>Быстрая встреча или кофе на Социалке</Text>
                </View>
                <Text style={styles.timerChevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.timerOptionItem, styles.timerOptionRecommended]}
                activeOpacity={0.8}
                onPress={() => handleSelectDuration('2_hours')}
              >
                <View>
                  <View style={styles.recBadgeWrap}>
                    <Text style={styles.timerOptionTitle}>2 часа</Text>
                    <View style={styles.recBadge}>
                      <Text style={styles.recBadgeText}>ТОП</Text>
                    </View>
                  </View>
                  <Text style={styles.timerOptionDesc}>Полноценная вечерняя прогулка</Text>
                </View>
                <Text style={styles.timerChevron}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timerOptionItem}
                activeOpacity={0.8}
                onPress={() => handleSelectDuration('till_evening')}
              >
                <View>
                  <Text style={styles.timerOptionTitle}>До вечера (до 23:00)</Text>
                  <Text style={styles.timerOptionDesc}>Для активного движа и клановых сходок</Text>
                </View>
                <Text style={styles.timerChevron}>›</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── 10. POI Details Modal ── */}
      <PoiDetailsModal
        poi={selectedPoi}
        visible={selectedPoi !== null}
        onClose={() => setSelectedPoi(null)}
        currentTheme={currentTheme}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES (Urban Dark Architecture)
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── POI Markers ──
  poiAnnotationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  poiSquircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(18, 22, 31, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  poiSquirclePartner: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    shadowColor: '#10B981',
    shadowOpacity: 0.25,
  },
  partnerDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  poiLabelWrap: {
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(15, 17, 21, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  poiLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#CBD5E1',
    letterSpacing: 0.1,
  },

  // ── Top Bar HUD ──
  topHeaderContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    left: 14,
    right: 14,
    zIndex: 20,
    gap: 8,
  },
  outOfBoundsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  outOfBoundsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FCA5A5',
    letterSpacing: 0.1,
  },
  topCapsule: {
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(15, 17, 21, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveActivityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  liveActivityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
    letterSpacing: -0.2,
  },
  liveCountAccent: {
    color: '#10B981',
    fontWeight: '700',
  },

  // ── Bottom FAB Status ──
  bottomFabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 36 : 28,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  startWalkingPill: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#059669', // Emerald base
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  startWalkingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  walkingActivePill: {
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 17, 21, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  timerInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  walkingMiniPulse: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTimerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  timerAccent: {
    color: '#10B981',
    fontWeight: '700',
  },
  activePillDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 4,
  },
  resetHomeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  resetHomeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // ── Timer Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    padding: 14,
  },
  modalCard: {
    backgroundColor: '#12161F',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    marginBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F2F3F5',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 18,
    lineHeight: 16,
  },
  timerOptionsList: {
    gap: 10,
  },
  timerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timerOptionRecommended: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  recBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  recBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timerOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F2F3F5',
  },
  timerOptionDesc: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  timerChevron: {
    fontSize: 18,
    color: '#5A5A5E',
    fontWeight: '300',
  },
});

export default MapScreen;
