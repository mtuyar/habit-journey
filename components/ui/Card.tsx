import React from 'react';
import { View, ViewProps, Text } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View 
      className={cn("bg-journeyCard dark:bg-[#1E293B] rounded-3xl shadow-sm border border-[#F3EDDF] overflow-hidden", className)} 
      {...props}
    >
      {children}
    </View>
  );
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <Text className={cn("text-xl font-bold text-gray-800 mb-2", className)} {...props}>
      {children}
    </Text>
  );
}

export function CardDescription({ className, children, ...props }: CardProps) {
  return (
    <Text className={cn("text-base text-gray-500", className)} {...props}>
      {children}
    </Text>
  );
}
