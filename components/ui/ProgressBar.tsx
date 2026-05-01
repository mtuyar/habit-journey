import React from "react";
import { View } from "tamagui";

export type ProgressBarTone = "accent" | "success" | "warning" | "danger" | "muted";

const trackColor: Record<ProgressBarTone, string> = {
  accent: "$borderStrong",
  success: "$borderStrong",
  warning: "$borderStrong",
  danger: "$borderStrong",
  muted: "$border",
};

const fillColor: Record<ProgressBarTone, string> = {
  accent: "$accent",
  success: "$success",
  warning: "$warning",
  danger: "$danger",
  muted: "$textSubtle",
};

export function ProgressBar({
  value,
  tone = "accent",
  height = 5,
  inverse = false,
}: {
  value: number;
  tone?: ProgressBarTone;
  height?: number;
  inverse?: boolean;
}) {
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <View
      width="100%"
      height={height}
      borderRadius={999}
      backgroundColor={inverse ? "rgba(255,255,255,0.2)" : (trackColor[tone] as any)}
      overflow="hidden"
    >
      <View
        width={`${clamped * 100}%`}
        height="100%"
        borderRadius={999}
        backgroundColor={inverse ? "#FFFFFF" : (fillColor[tone] as any)}
      />
    </View>
  );
}
