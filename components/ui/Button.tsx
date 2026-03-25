import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';
import { cn } from './Card'; // reuse cn utility

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  className?: string;
  textClassName?: string;
}

export function Button({ 
  title, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className, 
  textClassName,
  disabled,
  ...props 
}: ButtonProps) {
  
  const baseClasses = "flex-row items-center justify-center rounded-2xl active:opacity-80";
  
  const variantClasses = {
    primary: "bg-journeyYellow shadow-sm",
    secondary: "bg-gray-800",
    outline: "border-2 border-journeyYellow bg-transparent",
    ghost: "bg-transparent",
  };

  const sizeClasses = {
    sm: "px-4 py-2",
    md: "px-6 py-4",
    lg: "px-8 py-5",
  };

  const textBaseClasses = "font-bold text-center";
  const textVariantClasses = {
    primary: "text-gray-900",
    secondary: "text-white",
    outline: "text-journeyYellow",
    ghost: "text-gray-800",
  };
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <TouchableOpacity 
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], (disabled || isLoading) && "opacity-50", className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'secondary' ? 'white' : '#111827'} className="mr-2" />
      ) : null}
      <Text className={cn(textBaseClasses, textVariantClasses[variant], textSizeClasses[size], textClassName)}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
