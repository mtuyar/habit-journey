import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { YStack, useTheme } from "tamagui";

export type IconButtonTone = "neutral" | "accent" | "warning" | "danger";
export type IconButtonSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<IconButtonSize, { box: number; icon: number; radius: number }> = {
  sm: { box: 32, icon: 14, radius: 10 },
  md: { box: 36, icon: 16, radius: 12 },
  lg: { box: 44, icon: 22, radius: 14 },
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export type IconButtonProps = Omit<
  React.ComponentProps<typeof YStack>,
  "onPress"
> & {
  icon: IconName;
  onPress: () => void;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  disabled?: boolean;
};

export function IconButton({
  icon,
  onPress,
  tone = "neutral",
  size = "md",
  disabled,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();
  const { box, icon: iconSize, radius } = SIZE_MAP[size];

  const colorMap: Record<IconButtonTone, string> = {
    neutral: theme.textMuted?.val ?? "#64748B",
    accent: theme.accent?.val ?? "#0D9488",
    warning: theme.warning?.val ?? "#F59E0B",
    danger: theme.danger?.val ?? "#EF4444",
  };

  return (
    <YStack
      width={box}
      height={box}
      borderRadius={radius}
      alignItems="center"
      justifyContent="center"
      opacity={disabled ? 0.4 : 1}
      onPress={disabled ? undefined : onPress}
      pressStyle={disabled ? undefined : { opacity: 0.6 }}
      {...rest}
    >
      <Ionicons name={icon} size={iconSize} color={colorMap[tone]} />
    </YStack>
  );
}
