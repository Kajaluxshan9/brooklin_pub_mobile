/**
 * @deprecated This file is deprecated and will be removed in a future version.
 *
 * All components have been split into individual files for better maintainability.
 * Please use the new barrel export instead:
 *
 * OLD: import { GoldButton, SectionHeader } from './SharedComponents';
 * NEW: import { GoldButton, SectionHeader } from '@/components/common';
 *
 * Individual imports are also available:
 * import { GoldButton } from '@/components/common/GoldButton';
 * import { SectionHeader } from '@/components/common/SectionHeader';
 */

// ============================================================
// RE-EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================

export { ErrorView } from "./ErrorView";
export type { ErrorViewProps } from "./ErrorView";

export { SectionHeader } from "./SectionHeader";
export type { SectionHeaderProps } from "./SectionHeader";

export { GoldButton } from "./GoldButton";
export type { GoldButtonProps } from "./GoldButton";

export { GoldDivider } from "./GoldDivider";
export type { GoldDividerProps } from "./GoldDivider";

export { GlassCard } from "./GlassCard";
export type { GlassCardProps } from "./GlassCard";

export { CornerAccents } from "./CornerAccents";
export type { CornerAccentsProps } from "./CornerAccents";

export { InfoChip } from "./InfoChip";
export type { InfoChipProps } from "./InfoChip";

export { AnimatedBackground } from "./AnimatedBackground";
export type { AnimatedBackgroundProps } from "./AnimatedBackground";

// Default export for backward compatibility
export { ErrorView as default } from "./ErrorView";
