import React from 'react';
import { Sun, Sunset, Moon } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

interface GreetingIconProps {
  color?: string;
  size?: number;
}

export function GreetingIcon({ color = Colors.primary, size = 18 }: GreetingIconProps) {
  const hour = new Date().getHours();
  
  if (hour < 12) return <Sun size={size} color={color} />;
  if (hour < 18) return <Sunset size={size} color={color} />;
  return <Moon size={size} color={color} />;
}
