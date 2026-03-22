import { useCallback } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

/**
 * Gesture Utilities
 *
 * Reusable gesture handler hooks and utilities for React Native Gesture Handler.
 * Provides common gesture patterns with consistent behavior.
 */

// ============================================================
// Swipe Gesture Hooks
// ============================================================

/**
 * Create a swipe gesture handler
 */
export function useSwipeGesture(
  direction: "horizontal" | "vertical",
  onSwipe: (direction: "left" | "right" | "up" | "down") => void,
  threshold: number = 50,
) {
  return useCallback(() => {
    const gesture = Gesture.Pan().onEnd((event) => {
      if (direction === "horizontal") {
        if (event.translationX > threshold) {
          runOnJS(onSwipe)("right");
        } else if (event.translationX < -threshold) {
          runOnJS(onSwipe)("left");
        }
      } else {
        if (event.translationY > threshold) {
          runOnJS(onSwipe)("down");
        } else if (event.translationY < -threshold) {
          runOnJS(onSwipe)("up");
        }
      }
    });

    return gesture;
  }, [direction, onSwipe, threshold]);
}

/**
 * Create a pan gesture handler
 */
export function usePanGesture(
  onPan: (
    translationX: number,
    translationY: number,
    velocityX: number,
    velocityY: number,
  ) => void,
  onEnd?: (
    translationX: number,
    translationY: number,
    velocityX: number,
    velocityY: number,
  ) => void,
) {
  return useCallback(() => {
    const gesture = Gesture.Pan()
      .onUpdate((event) => {
        runOnJS(onPan)(
          event.translationX,
          event.translationY,
          event.velocityX,
          event.velocityY,
        );
      })
      .onEnd((event) => {
        if (onEnd) {
          runOnJS(onEnd)(
            event.translationX,
            event.translationY,
            event.velocityX,
            event.velocityY,
          );
        }
      });

    return gesture;
  }, [onPan, onEnd]);
}

/**
 * Create a pinch gesture handler
 */
export function usePinchGesture(
  onPinch: (scale: number) => void,
  onEnd?: (scale: number) => void,
) {
  return useCallback(() => {
    const gesture = Gesture.Pinch()
      .onUpdate((event) => {
        runOnJS(onPinch)(event.scale);
      })
      .onEnd((event) => {
        if (onEnd) {
          runOnJS(onEnd)(event.scale);
        }
      });

    return gesture;
  }, [onPinch, onEnd]);
}

/**
 * Create a rotation gesture handler
 */
export function useRotationGesture(
  onRotate: (rotation: number) => void,
  onEnd?: (rotation: number) => void,
) {
  return useCallback(() => {
    const gesture = Gesture.Rotation()
      .onUpdate((event) => {
        runOnJS(onRotate)(event.rotation);
      })
      .onEnd((event) => {
        if (onEnd) {
          runOnJS(onEnd)(event.rotation);
        }
      });

    return gesture;
  }, [onRotate, onEnd]);
}

/**
 * Create a long press gesture handler
 */
export function useLongPress(onLongPress: () => void, duration: number = 500) {
  return useCallback(() => {
    const gesture = Gesture.LongPress()
      .minDuration(duration)
      .onStart(() => {
        runOnJS(onLongPress)();
      });

    return gesture;
  }, [onLongPress, duration]);
}

/**
 * Create a tap gesture handler
 */
export function useTapGesture(onTap: () => void, numberOfTaps: number = 1) {
  return useCallback(() => {
    const gesture = Gesture.Tap()
      .numberOfTaps(numberOfTaps)
      .onEnd(() => {
        runOnJS(onTap)();
      });

    return gesture;
  }, [onTap, numberOfTaps]);
}

/**
 * Create a double tap gesture handler
 */
export function useDoubleTap(onDoubleTap: () => void) {
  return useTapGesture(onDoubleTap, 2);
}

// ============================================================
// Gesture Combinations
// ============================================================

/**
 * Create simultaneous gestures (both can be active at once)
 */
export function useSimultaneousGestures(
  ...gestures: ReturnType<typeof Gesture.Pan>[]
) {
  return useCallback(() => {
    return Gesture.Simultaneous(...gestures);
  }, [gestures]);
}

/**
 * Create exclusive gestures (only one can be active)
 */
export function useExclusiveGestures(
  ...gestures: ReturnType<typeof Gesture.Pan>[]
) {
  return useCallback(() => {
    return Gesture.Exclusive(...gestures);
  }, [gestures]);
}

/**
 * Create race gestures (first to activate wins)
 */
export function useRaceGestures(...gestures: ReturnType<typeof Gesture.Pan>[]) {
  return useCallback(() => {
    return Gesture.Race(...gestures);
  }, [gestures]);
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Calculate velocity magnitude
 */
export function getVelocityMagnitude(
  velocityX: number,
  velocityY: number,
): number {
  return Math.sqrt(velocityX ** 2 + velocityY ** 2);
}

/**
 * Calculate distance between two points
 */
export function getDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Calculate angle between two points (in radians)
 */
export function getAngle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Convert radians to degrees
 */
export function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Convert degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  "worklet";
  return start + (end - start) * t;
}

/**
 * Check if point is inside rectangle
 */
export function isPointInRect(
  x: number,
  y: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
): boolean {
  return (
    x >= rectX &&
    x <= rectX + rectWidth &&
    y >= rectY &&
    y <= rectY + rectHeight
  );
}

/**
 * Snap value to nearest step
 */
export function snapToInterval(value: number, interval: number): number {
  "worklet";
  return Math.round(value / interval) * interval;
}

/**
 * Calculate momentum (for scrolling)
 */
export function calculateMomentum(
  velocity: number,
  friction: number = 0.98,
): number {
  let distance = 0;
  let currentVelocity = velocity;

  while (Math.abs(currentVelocity) > 1) {
    distance += currentVelocity;
    currentVelocity *= friction;
  }

  return distance;
}
