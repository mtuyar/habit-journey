import { YStack, styled, GetProps } from "tamagui";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * @deprecated kept for migration compatibility only. Don't use in new code —
 * styling lives in Tamagui themes / styled components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Unified card chassis used across dashboard, journey nodes, settings rows.
 * Neutral surface + soft border + subtle shadow + radius 20.
 * Accent / status color is conveyed by content (badges, progress) — never
 * by the card border.
 */
export const Card = styled(YStack, {
  name: "Card",
  backgroundColor: "$surface",
  borderRadius: 20,
  borderWidth: 1,
  borderColor: "$border",
  paddingHorizontal: 18,
  paddingVertical: 16,
  shadowColor: "$shadowColor",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,

  variants: {
    interactive: {
      true: {
        pressStyle: { opacity: 0.65, scale: 0.995 },
      },
    },
    flush: {
      true: {
        paddingHorizontal: 0,
        paddingVertical: 0,
      },
    },
    tinted: {
      accent: { backgroundColor: "$accentTint" },
      success: { backgroundColor: "$successSoft" },
      warning: { backgroundColor: "$warningSoft" },
      danger: { backgroundColor: "$dangerSoft" },
      surface: { backgroundColor: "$surfaceAlt" },
    },
  } as const,
});

export type CardProps = GetProps<typeof Card>;
