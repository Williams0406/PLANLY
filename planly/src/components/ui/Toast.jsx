import React, { useEffect, useRef } from 'react';
import {
  Animated, Text, StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';

const TYPES = {
  success: { color: colors.success, bg: '#DCFCE7', icon: 'checkmark-circle' },
  error: { color: colors.error, bg: '#FEE2E2', icon: 'alert-circle' },
  info: { color: colors.primary, bg: '#ECFEFF', icon: 'information-circle' },
  warning: { color: colors.warning, bg: '#FEF9C3', icon: 'warning' },
};

export default function Toast({ visible, message, type = 'success', onHide }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide && onHide());
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const config = TYPES[type] || TYPES.success;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.bg, transform: [{ translateY }], opacity },
      ]}
      pointerEvents="none"
    >
      <Ionicons name={config.icon} size={20} color={config.color} />
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});