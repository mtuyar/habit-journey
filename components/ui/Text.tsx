import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';

const getFontSizeFromClassName = (className?: string): number | null => {
  if (!className) return null;
  const customPxMatch = className.match(/text-\[([0-9.]+)px\]/);
  if (customPxMatch && customPxMatch[1]) return parseFloat(customPxMatch[1]);

  const sizeMap: Record<string, number> = {
    'text-xs': 12, 'text-sm': 14, 'text-base': 16, 'text-lg': 18,
    'text-xl': 20, 'text-2xl': 24, 'text-3xl': 30, 'text-4xl': 36,
  };

  for (const key of Object.keys(sizeMap)) {
    if (new RegExp(`(^|\\s)${key}($|\\s)`).test(className)) {
      return sizeMap[key];
    }
  }
  return null;
};

const getLineHeightFromClassName = (className?: string, baseFontSize: number = 14): number | null => {
  if (!className) return null;
  const customPxMatch = className.match(/leading-\[([0-9.]+)px\]/);
  if (customPxMatch && customPxMatch[1]) return parseFloat(customPxMatch[1]);

  if (/(^|\s)leading-none($|\s)/.test(className)) return baseFontSize * 1;
  if (/(^|\s)leading-tight($|\s)/.test(className)) return baseFontSize * 1.25;
  if (/(^|\s)leading-snug($|\s)/.test(className)) return baseFontSize * 1.375;
  if (/(^|\s)leading-normal($|\s)/.test(className)) return baseFontSize * 1.5;
  if (/(^|\s)leading-relaxed($|\s)/.test(className)) return baseFontSize * 1.625;
  if (/(^|\s)leading-loose($|\s)/.test(className)) return baseFontSize * 2;
  return null;
};

export const Text = React.forwardRef<RNText, TextProps & { className?: string }>((props, ref) => {
  const fontScale = useSettingsStore(state => state.fontScale);

  if (fontScale === 1.0) {
    return <RNText ref={ref} {...props} />;
  }

  // Parse original tailwind sizes before scaling to instruct RN to dynamically expand standard parent layout bounds
  const baseFontSize = getFontSizeFromClassName(props.className) || 14;
  const scaledFontSize = baseFontSize * fontScale;

  const baseLineHeight = getLineHeightFromClassName(props.className, baseFontSize);
  
  const overrides: any = { fontSize: scaledFontSize };
  if (baseLineHeight) {
    overrides.lineHeight = baseLineHeight * fontScale;
  }

  return (
    <RNText 
      ref={ref} 
      {...props} 
      style={[props.style, overrides]} 
    />
  );
});

Text.displayName = 'CustomText';
