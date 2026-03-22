/**
 * Barrel export for all common components
 *
 * This centralized export file enables clean imports across the app:
 * import { GoldButton, Modal, SectionHeader } from '@/components/common'
 *
 * Components are organized by category for better discoverability.
 */

// ============================================================
// Layout & Structure
// ============================================================
export { ErrorView } from "./ErrorView";
export type { ErrorViewProps } from "./ErrorView";

export { SectionHeader } from "./SectionHeader";
export type { SectionHeaderProps } from "./SectionHeader";

export { GlassCard } from "./GlassCard";
export type { GlassCardProps } from "./GlassCard";

export { CornerAccents } from "./CornerAccents";
export type { CornerAccentsProps } from "./CornerAccents";

export { default as PageHeader } from "./PageHeader";

export { default as Footer } from "./Footer";

export { default as AppBrandStrip } from "./AppBrandStrip";

export { default as OfflineBanner } from "./OfflineBanner";

// ============================================================
// Interactive Components
// ============================================================
export { GoldButton } from "./GoldButton";
export type { GoldButtonProps } from "./GoldButton";

export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";

export { Dialog } from "./Dialog";
export type { DialogProps, DialogAction } from "./Dialog";

export { BottomSheet } from "./BottomSheet";
export type { BottomSheetProps } from "./BottomSheet";

export { Swipeable } from "./Swipeable";
export type { SwipeableProps, SwipeAction } from "./Swipeable";

export { SearchBar } from "./SearchBar";
export type { SearchBarProps } from "./SearchBar";

// ============================================================
// Decorative
// ============================================================
export { GoldDivider } from "./GoldDivider";
export type { GoldDividerProps } from "./GoldDivider";

export { InfoChip } from "./InfoChip";
export type { InfoChipProps } from "./InfoChip";

export { AnimatedBackground } from "./AnimatedBackground";
export type { AnimatedBackgroundProps } from "./AnimatedBackground";

// ============================================================
// Feedback & Status
// ============================================================
export { useToast, ToastProvider } from "./Toast";

export { default as LoadingScreen } from "./LoadingScreen";

export {
  SkeletonBox,
  MenuItemSkeleton,
  EventCardSkeleton,
  SpecialCardSkeleton,
  TeamCardSkeleton,
  ImagePlaceholderSkeleton,
} from "./SkeletonLoader";

// ============================================================
// Media
// ============================================================
export { default as ImageCard } from "./ImageCard";

export { default as HeroSection } from "./HeroSection";

// ============================================================
// Social & CTA
// ============================================================
export { default as SocialFAB } from "./SocialFAB";

export { default as FloatingCallButton } from "./FloatingCallButton";

// ============================================================
// Forms
// ============================================================
export { default as NewsletterForm } from "./NewsletterForm";

// ============================================================
// Utilities
// ============================================================
export { default as ErrorBoundary } from "./ErrorBoundary";
