// components/FloatingActionButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface FloatingActionButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  iconName?: React.ComponentProps<typeof MaterialIcons>['name'];
  iconSize?: number;
  iconColor?: string;
}

export function FloatingActionButton({
  onPress,
  style,
  iconName = 'add',
  iconSize = 24,
  iconColor = '#fff',
}: FloatingActionButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.fab, style]}>
      <MaterialIcons name={iconName} size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    backgroundColor: '#2E86AB',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});
