import React from "react";
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { View, useTheme } from "tamagui";

/**
 * Standard screen frame: applies the theme background and a SafeAreaView so
 * children don't have to repeat that wiring. Works with both modal and
 * full screens.
 */
export function Screen({
  children,
  edges = ["top", "left", "right"],
  padded = false,
}: {
  children: React.ReactNode;
  edges?: Edge[];
  padded?: boolean;
}) {
  const theme = useTheme();
  const bg = theme.bg?.val ?? "#F8FAFC";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={edges}>
      <View flex={1} paddingHorizontal={padded ? 24 : 0}>
        {children}
      </View>
    </SafeAreaView>
  );
}
