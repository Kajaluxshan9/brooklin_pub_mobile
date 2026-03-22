import {
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  SharedValue,
} from "react-native-reanimated";

/**
 * Animation Utilities
 *
 * Reusable animation presets and configurations for React Native Reanimated 3.
 * Provides consistent animation timing, easing, and spring configurations.
 */

// ============================================================
// Spring Configurations
// ============================================================

/**
 * Smooth spring - Gentle, smooth animations
 * Use for: Modal entrances, bottom sheets, most UI transitions
 */
export const smoothSpring = {
  damping: 20,
  stiffness: 300,
  mass: 0.5,
};

/**
 * Bouncy spring - Playful, bouncy animations
 * Use for: Button presses, success indicators, playful interactions
 */
export const bouncySpring = {
  damping: 15,
  stiffness: 400,
  mass: 0.8,
};

/**
 * Gentle spring - Very smooth, slow animations
 * Use for: Large UI elements, page transitions
 */
export const gentleSpring = {
  damping: 25,
  stiffness: 150,
  mass: 1,
};

/**
 * Snappy spring - Quick, responsive animations
 * Use for: Switches, toggles, quick feedback
 */
export const snappySpring = {
  damping: 12,
  stiffness: 500,
  mass: 0.3,
};

// ============================================================
// Timing Configurations
// ============================================================

/**
 * Fast timing - Quick animations (200ms)
 * Use for: Micro-interactions, hover states
 */
export const fastTiming = {
  duration: 200,
  easing: Easing.inOut(Easing.ease),
};

/**
 * Default timing - Standard animations (300ms)
 * Use for: Most UI transitions
 */
export const defaultTiming = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1), // ease-in-out
};

/**
 * Slow timing - Deliberate animations (500ms)
 * Use for: Large elements, page transitions
 */
export const slowTiming = {
  duration: 500,
  easing: Easing.inOut(Easing.cubic),
};

// ============================================================
// Easing Functions
// ============================================================

/**
 * Material Design easing curves
 */
export const easings = {
  // Standard curve - Most common
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),

  // Decelerate - Elements entering screen
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),

  // Accelerate - Elements leaving screen
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),

  // Sharp - Elements that return to origin
  sharp: Easing.bezier(0.4, 0.0, 0.6, 1),

  // Elastic - Bouncy feel
  elastic: Easing.elastic(1.2),
};

// ============================================================
// Animation Presets
// ============================================================

/**
 * Fade in animation
 */
export const fadeIn = (delay: number = 0) => {
  "worklet";
  return withDelay(
    delay,
    withTiming(1, {
      duration: 400,
      easing: easings.decelerate,
    }),
  );
};

/**
 * Fade out animation
 */
export const fadeOut = (delay: number = 0) => {
  "worklet";
  return withDelay(
    delay,
    withTiming(0, {
      duration: 300,
      easing: easings.accelerate,
    }),
  );
};

/**
 * Slide up animation (from bottom)
 */
export const slideUp = (distance: number = 20, delay: number = 0) => {
  "worklet";
  return withDelay(
    delay,
    withSpring(0, {
      ...smoothSpring,
      velocity: -distance,
    }),
  );
};

/**
 * Slide down animation (to bottom)
 */
export const slideDown = (distance: number = 20, delay: number = 0) => {
  "worklet";
  return withDelay(
    delay,
    withSpring(distance, {
      ...smoothSpring,
    }),
  );
};

/**
 * Scale in animation
 */
export const scaleIn = (from: number = 0.8, delay: number = 0) => {
  "worklet";
  return withDelay(
    delay,
    withSpring(1, {
      ...bouncySpring,
    }),
  );
};

/**
 * Scale out animation
 */
export const scaleOut = (to: number = 0.8, delay: number = 0) => {
  "worklet";
  return withDelay(
    delay,
    withTiming(to, {
      duration: 200,
      easing: easings.accelerate,
    }),
  );
};

/**
 * Rotate animation (in degrees)
 */
export const rotate = (
  from: number = 0,
  to: number = 360,
  duration: number = 1000,
) => {
  "worklet";
  return withTiming(to, {
    duration,
    easing: Easing.linear,
  });
};

/**
 * Pulse animation (scale up and down)
 */
export const pulse = (scale: number = 1.1, duration: number = 600) => {
  "worklet";
  return withSequence(
    withTiming(scale, { duration: duration / 2, easing: easings.decelerate }),
    withTiming(1, { duration: duration / 2, easing: easings.accelerate }),
  );
};

/**
 * Shake animation (horizontal)
 */
export const shake = (distance: number = 10) => {
  "worklet";
  return withSequence(
    withTiming(distance, { duration: 50 }),
    withTiming(-distance, { duration: 100 }),
    withTiming(distance, { duration: 100 }),
    withTiming(-distance, { duration: 100 }),
    withTiming(0, { duration: 50 }),
  );
};

/**
 * Bounce animation
 */
export const bounce = (height: number = -20) => {
  "worklet";
  return withSequence(
    withTiming(height, { duration: 300, easing: easings.decelerate }),
    withTiming(0, { duration: 300, easing: Easing.bounce }),
  );
};

/**
 * Staggered entrance for list items
 */
export const staggeredEntrance = (
  index: number,
  delayBetween: number = 100,
) => {
  "worklet";
  const delay = index * delayBetween;

  return {
    opacity: fadeIn(delay),
    translateY: slideUp(20, delay),
  };
};

/**
 * Wiggle animation (subtle rotation back and forth)
 */
export const wiggle = (angle: number = 5) => {
  "worklet";
  return withSequence(
    withTiming(angle, { duration: 100 }),
    withTiming(-angle, { duration: 200 }),
    withTiming(angle, { duration: 200 }),
    withTiming(0, { duration: 100 }),
  );
};

/**
 * Card flip animation (rotateY)
 */
export const flipCard = (duration: number = 600) => {
  "worklet";
  return withTiming(180, {
    duration,
    easing: easings.standard,
  });
};

// ============================================================
// Utility Functions
// ============================================================

/**
 * Loop animation continuously
 */
export function loopAnimation(
  sharedValue: SharedValue<number>,
  from: number,
  to: number,
  duration: number,
) {
  "worklet";
  sharedValue.value = from;
  sharedValue.value = withTiming(
    to,
    { duration, easing: Easing.linear },
    () => {
      loopAnimation(sharedValue, from, to, duration);
    },
  );
}

/**
 * Create spring configuration with custom values
 */
export function createSpring(
  damping: number = 20,
  stiffness: number = 300,
  mass: number = 0.5,
) {
  return {
    damping,
    stiffness,
    mass,
  };
}

/**
 * Create timing configuration with custom values
 */
export function createTiming(
  duration: number = 300,
  easing: typeof Easing.ease = Easing.inOut(Easing.ease),
) {
  return {
    duration,
    easing,
  };
}
