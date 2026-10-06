declare module '@maplibre/maplibre-react-native' {
  namespace MapLibreGL {
    type Camera = any;
    type MapView = any;
    type ShapeSource = any;
    type FillLayer = any;
    type LineLayer = any;
    type SymbolLayer = any;
    type PointAnnotation = any;
    type UserLocation = any;
  }
  const MapLibreGL: any;
  export default MapLibreGL;
}

declare module 'react-native-reanimated' {
  export const useSharedValue: any;
  export const useAnimatedStyle: any;
  export const withSpring: any;
  export const withTiming: any;
  export const interpolate: any;
  export const Easing: any;
  export const FadeIn: any;
  export const FadeInDown: any;
  export const SlideInLeft: any;
  const Animated: any;
  export default Animated;
}

declare module 'react-native-svg' {
  export const Svg: any;
  export const Path: any;
  export const Circle: any;
  export const Rect: any;
  export const Line: any;
  export const G: any;
  export const Text: any;
  export const Defs: any;
  export const LinearGradient: any;
  export const Stop: any;
  const DefaultExport: any;
  export default DefaultExport;
}

declare module '@turf/turf' {
  export function booleanPointInPolygon(point: any, polygon: any): boolean;
  export function polygon(coordinates: any, properties?: any): any;
  export function point(coordinates: any, properties?: any): any;
  export function featureCollection(features: any): any;
}

declare module 'lucide-react-native' {
  export const Menu: any;
  export const Crosshair: any;
  export const Footprints: any;
  export const Coffee: any;
  export const Flame: any;
  export const Dumbbell: any;
  export const Wine: any;
  export const Music: any;
  export const ShieldAlert: any;
  export const Landmark: any;
  export const Sparkles: any;
  export const Clock: any;
  export const Check: any;
  export const X: any;
}
