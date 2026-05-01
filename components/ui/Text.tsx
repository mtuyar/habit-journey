import React, { forwardRef } from "react";
import { Text as TamaguiText, TextProps as TamaguiTextProps, GetRef } from "tamagui";
import { useSettingsStore } from "@/store/useSettingsStore";

export type TextProps = TamaguiTextProps;

/**
 * Wrapped Tamagui Text that respects the user's accessibility fontScale
 * setting. Pass `fontSize` and (optionally) `lineHeight` as numbers to opt
 * into scaling — Tamagui tokens are passed through unscaled.
 */
export const Text = forwardRef<GetRef<typeof TamaguiText>, TextProps>(
  ({ fontSize, lineHeight, ...rest }, ref) => {
    const fontScale = useSettingsStore((s) => s.fontScale);

    const scaledFontSize =
      fontScale !== 1 && typeof fontSize === "number" ? fontSize * fontScale : fontSize;
    const scaledLineHeight =
      fontScale !== 1 && typeof lineHeight === "number" ? lineHeight * fontScale : lineHeight;

    return (
      <TamaguiText
        ref={ref}
        fontSize={scaledFontSize}
        lineHeight={scaledLineHeight}
        color="$text"
        {...rest}
      />
    );
  }
);

Text.displayName = "Text";
