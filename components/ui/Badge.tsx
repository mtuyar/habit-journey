import React from "react";
import { YStack, styled } from "tamagui";
import { Text } from "./Text";
import { useTranslation } from "@/lib/i18n";

const BadgeFrame = styled(YStack, {
  name: "BadgeFrame",
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 999,
  alignSelf: "flex-start",

  variants: {
    tone: {
      accent: { backgroundColor: "$accentSoft" },
      success: { backgroundColor: "$successSoft" },
      warning: { backgroundColor: "$warningSoft" },
      danger: { backgroundColor: "$dangerSoft" },
      neutral: { backgroundColor: "$surfaceAlt" },
    },
  } as const,

  defaultVariants: { tone: "neutral" },
});

const toneTextColor = {
  accent: "$accent",
  success: "$success",
  warning: "$warning",
  danger: "$danger",
  neutral: "$textMuted",
} as const;

export type BadgeProps = {
  tone?: keyof typeof toneTextColor;
  children: React.ReactNode;
  uppercase?: boolean;
};

export function Badge({ tone = "neutral", children, uppercase = true }: BadgeProps) {
  const { upper } = useTranslation();
  const display =
    uppercase && typeof children === "string" ? upper(children) : children;
  return (
    <BadgeFrame tone={tone}>
      <Text
        fontSize={10}
        fontWeight="700"
        letterSpacing={1}
        color={toneTextColor[tone] as any}
      >
        {display}
      </Text>
    </BadgeFrame>
  );
}
