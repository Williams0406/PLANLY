import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';

export default function RatingSelector({ value = 0, onChange, size = 24, label = 'Tu puntaje' }) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= value;
          return (
            <TouchableOpacity
              key={star}
              activeOpacity={0.8}
              style={[styles.starButton, active && styles.starButtonActive]}
              onPress={() => onChange?.(star)}
            >
              <Ionicons
                name={active ? 'star' : 'star-outline'}
                size={size}
                color={active ? '#F59E0B' : colors.textSecondary}
              />
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>{value ? `${value} de 5` : 'Selecciona una calificación'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', gap: spacing.xs },
  starButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButtonActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFF7ED',
  },
  hint: { fontSize: 12, color: colors.textSecondary },
});
