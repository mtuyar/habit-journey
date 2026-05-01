import React from "react";
import { Spinner, XStack, styled, Text } from "tamagui";

/**
 * Buttons. Variants:
 *   primary  — teal accent, the brand CTA. Use sparingly.
 *   secondary — neutral surface with border. Default for non-CTA actions.
 *   outline  — transparent + accent border. Good for paired actions.
 *   ghost    — transparent, no border. Inline / chrome buttons.
 *   danger   — red, destructive actions.
 */
const ButtonFrame = styled(XStack, {
  name: "ButtonFrame",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "transparent",
  pressStyle: { opacity: 0.78 },

  variants: {
    variant: {
      primary: {
        backgroundColor: "$accent",
        shadowColor: "$accent",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
        elevation: 4,
      },
      secondary: {
        backgroundColor: "$surface",
        borderColor: "$border",
      },
      outline: {
        backgroundColor: "transparent",
        borderColor: "$accent",
      },
      ghost: {
        backgroundColor: "transparent",
      },
      danger: {
        backgroundColor: "$danger",
      },
    },
    size: {
      sm: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
      md: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 },
      lg: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 18 },
    },
    disabled: {
      true: { opacity: 0.5 },
    },
    fullWidth: {
      true: { alignSelf: "stretch" },
    },
  } as const,

  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

const labelColorMap = {
  primary: "$textInverse",
  secondary: "$text",
  outline: "$accent",
  ghost: "$text",
  danger: "$textInverse",
} as const;

const labelSizeMap = {
  sm: 13,
  md: 15,
  lg: 17,
} as const;

type Variant = keyof typeof labelColorMap;
type Size = keyof typeof labelSizeMap;

export type ButtonProps = Omit<React.ComponentProps<typeof ButtonFrame>, "variant" | "size"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  iconLeft,
  iconRight,
  ...rest
}: ButtonProps) {
  const labelColor = labelColorMap[variant];
  const labelFontSize = labelSizeMap[size];
  const isDisabled = disabled || loading;

  return (
    <ButtonFrame
      variant={variant}
      size={size}
      disabled={isDisabled}
      gap={8}
      {...rest}
    >
      {loading ? (
        <Spinner size="small" color={labelColor as any} />
      ) : (
        iconLeft
      )}
      {typeof children === "string" ? (
        <Text color={labelColor as any} fontSize={labelFontSize} fontWeight="700">
          {children}
        </Text>
      ) : (
        children
      )}
      {!loading && iconRight}
    </ButtonFrame>
  );
}
