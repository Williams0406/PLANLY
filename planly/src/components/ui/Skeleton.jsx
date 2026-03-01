import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { radius } from '../../theme';

export function SkeletonBox({ width, height, borderRadius, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.box,
        {
          width,
          height,
          borderRadius: borderRadius ?? radius.sm,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function GrupoSkeleton() {
  return (
    <View style={styles.grupoCard}>
      <SkeletonBox width={52} height={52} borderRadius={12} />
      <View style={styles.grupoInfo}>
        <SkeletonBox width="70%" height={16} />
        <SkeletonBox width="50%" height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function MovimientoSkeleton() {
  return (
    <View style={styles.movCard}>
      <SkeletonBox width={44} height={44} borderRadius={10} />
      <View style={styles.movInfo}>
        <SkeletonBox width="60%" height={14} />
        <SkeletonBox width="40%" height={12} style={{ marginTop: 6 }} />
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <SkeletonBox width={70} height={16} />
        <SkeletonBox width={50} height={11} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#E2E8F0',
  },
  grupoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  grupoInfo: { flex: 1, gap: 8 },
  movCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  movInfo: { flex: 1, gap: 6 },
});