import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import Button from './Button';
import { formatDateTimeDisplay, formatDateTimeInput, parseDateTimeInput } from '../../utils/datetime';

const QUICK_TIME_OPTIONS = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

const createDayOptions = (count = 10) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      key: date.toISOString(),
      value: date,
      shortLabel: index === 0 ? 'Hoy' : index === 1 ? 'Mañana' : date.toLocaleDateString('es-PE', { weekday: 'short' }),
      fullLabel: date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
    };
  });
};

const setDatePart = (source, datePart) => {
  const base = parseDateTimeInput(source) || new Date();
  const next = new Date(datePart);
  next.setHours(base.getHours(), base.getMinutes(), 0, 0);
  return formatDateTimeInput(next);
};

const setTimePart = (source, timeValue) => {
  const base = parseDateTimeInput(source) || new Date();
  const [hours, minutes] = timeValue.split(':').map(Number);
  base.setHours(hours, minutes, 0, 0);
  return formatDateTimeInput(base);
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeNumberInput = (raw, max) => {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 2);
  if (!digits) return '';
  return String(clamp(Number(digits), 0, max)).padStart(2, '0');
};

const updateTimeUnit = (source, type, nextRawValue) => {
  const base = parseDateTimeInput(source) || new Date();
  const max = type === 'hours' ? 23 : 59;
  const normalized = normalizeNumberInput(nextRawValue, max);
  const nextValue = normalized === '' ? 0 : Number(normalized);

  if (type === 'hours') {
    base.setHours(nextValue, base.getMinutes(), 0, 0);
  } else {
    base.setHours(base.getHours(), nextValue, 0, 0);
  }

  return formatDateTimeInput(base);
};

const stepTimeUnit = (source, type, delta) => {
  const base = parseDateTimeInput(source) || new Date();
  if (type === 'hours') {
    base.setHours(clamp(base.getHours() + delta, 0, 23), base.getMinutes(), 0, 0);
  } else {
    base.setHours(base.getHours(), clamp(base.getMinutes() + delta, 0, 59), 0, 0);
  }
  return formatDateTimeInput(base);
};

export default function DateTimeField({ label, value, onChangeText, placeholder }) {
  const [visible, setVisible] = useState(false);
  const parsed = parseDateTimeInput(value);
  const dayOptions = useMemo(() => createDayOptions(), []);

  const selectedDayKey = parsed
    ? (dayOptions.find((item) => {
        const candidate = new Date(item.value);
        return (
          candidate.getFullYear() === parsed.getFullYear() &&
          candidate.getMonth() === parsed.getMonth() &&
          candidate.getDate() === parsed.getDate()
        );
      })?.key || null)
    : null;

  const selectedTime = parsed
    ? `${`${parsed.getHours()}`.padStart(2, '0')}:${`${parsed.getMinutes()}`.padStart(2, '0')}`
    : null;
  const hourValue = parsed ? `${parsed.getHours()}`.padStart(2, '0') : '';
  const minuteValue = parsed ? `${parsed.getMinutes()}`.padStart(2, '0') : '';

  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} activeOpacity={0.9} onPress={() => setVisible(true)}>
        <View style={styles.iconWrap}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.value}>{parsed ? formatDateTimeDisplay(parsed) : placeholder}</Text>
          <Text style={styles.helper}>
            {parsed ? 'Toca para ajustar día u hora' : 'Selecciona fecha y hora con ayuda visual'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Seleccion actual</Text>
              <Text style={styles.heroValue}>{parsed ? formatDateTimeDisplay(parsed) : 'Aun sin fecha'}</Text>
            </View>

            <Text style={styles.sectionTitle}>Dia</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {dayOptions.map((option) => {
                const active = selectedDayKey === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.dayChip, active && styles.dayChipActive]}
                    onPress={() => onChangeText(setDatePart(value, option.value))}
                  >
                    <Text style={[styles.dayChipTop, active && styles.dayChipTextActive]}>{option.shortLabel}</Text>
                    <Text style={[styles.dayChipBottom, active && styles.dayChipTextActive]}>{option.fullLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionTitle}>Hora</Text>
            <View style={styles.timeGrid}>
              {QUICK_TIME_OPTIONS.map((timeOption) => {
                const active = selectedTime === timeOption;
                return (
                  <TouchableOpacity
                    key={timeOption}
                    style={[styles.timeChip, active && styles.timeChipActive]}
                    onPress={() => onChangeText(setTimePart(value, timeOption))}
                  >
                    <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>{timeOption}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Ajuste fino</Text>
            <View style={styles.preciseRow}>
              <TimeUnitEditor
                label="Hora"
                value={hourValue}
                onDecrease={() => onChangeText(stepTimeUnit(value, 'hours', -1))}
                onIncrease={() => onChangeText(stepTimeUnit(value, 'hours', 1))}
                onChangeText={(nextValue) => onChangeText(updateTimeUnit(value, 'hours', nextValue))}
              />
              <TimeUnitEditor
                label="Minuto"
                value={minuteValue}
                onDecrease={() => onChangeText(stepTimeUnit(value, 'minutes', -1))}
                onIncrease={() => onChangeText(stepTimeUnit(value, 'minutes', 1))}
                onChangeText={(nextValue) => onChangeText(updateTimeUnit(value, 'minutes', nextValue))}
              />
            </View>
            <Text style={styles.manualHint}>Puedes tocar una hora sugerida o ajustar exactamente la hora y minuto.</Text>

            <Button title="Listo" onPress={() => setVisible(false)} style={{ marginTop: spacing.xs }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TimeUnitEditor({ label, value, onDecrease, onIncrease, onChangeText }) {
  return (
    <View style={styles.timeEditorCard}>
      <Text style={styles.timeEditorLabel}>{label}</Text>
      <View style={styles.timeEditorControls}>
        <TouchableOpacity style={styles.stepBtn} onPress={onDecrease}>
          <Ionicons name="remove" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          maxLength={2}
          style={styles.timeEditorInput}
          textAlign="center"
        />
        <TouchableOpacity style={styles.stepBtn} onPress={onIncrease}>
          <Ionicons name="add" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  field: {
    borderWidth: 1,
    borderColor: '#D8E3EC',
    backgroundColor: '#F8FBFD',
    borderRadius: radius.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontSize: 14, fontWeight: '700', color: colors.text },
  helper: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(2,6,23,0.56)' },
  card: {
    backgroundColor: '#FDFEFE',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '88%',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  hero: { backgroundColor: '#0F172A', borderRadius: radius.lg, padding: spacing.md },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', fontWeight: '700' },
  heroValue: { fontSize: 20, color: '#fff', fontWeight: '800', marginTop: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.text },
  chipsRow: { gap: spacing.sm, paddingRight: spacing.xs },
  dayChip: {
    minWidth: 86,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D8E3EC',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dayChipActive: { borderColor: colors.primary, backgroundColor: '#ECFEFF' },
  dayChipTop: { fontSize: 12, color: colors.textSecondary, fontWeight: '700', textTransform: 'capitalize' },
  dayChipBottom: { fontSize: 14, color: colors.text, fontWeight: '800', marginTop: 2 },
  dayChipTextActive: { color: colors.primary },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeChip: {
    minWidth: 78,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#D8E3EC',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  timeChipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  timeChipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  timeChipTextActive: { color: '#fff' },
  preciseRow: { flexDirection: 'row', gap: spacing.sm },
  timeEditorCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.xs,
  },
  timeEditorLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '700' },
  timeEditorControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeEditorInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  manualHint: { fontSize: 11, color: colors.textSecondary },
});
