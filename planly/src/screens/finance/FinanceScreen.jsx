import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useFinanceStore } from '../../store/finance.store';
import { useGroupsStore } from '../../store/groups.store';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { colors, spacing, radius } from '../../theme';
import { SkeletonBox, MovimientoSkeleton } from '../../components/ui/Skeleton';

const TIPO_CONFIG = {
  gasto_grupal: { icon: 'people-outline', color: '#EF4444', label: 'Gasto Grupal' },
  gasto_individual: { icon: 'person-outline', color: '#F97316', label: 'Gasto Individual' },
  prestamo: { icon: 'arrow-up-circle-outline', color: '#8B5CF6', label: 'Préstamo' },
  pago_prestamo: { icon: 'arrow-down-circle-outline', color: '#22C55E', label: 'Pago' },
};

const TIPO_OPTIONS = [
  { value: 'gasto_individual', label: 'Gasto Individual', icon: 'person-outline' },
  { value: 'gasto_grupal', label: 'Gasto Grupal', icon: 'people-outline' },
  { value: 'prestamo', label: 'Préstamo', icon: 'arrow-up-circle-outline' },
  { value: 'pago_prestamo', label: 'Pago de Préstamo', icon: 'arrow-down-circle-outline' },
];

export default function FinanceScreen() {
  const { balance, movimientos, isLoading, fetchBalance, fetchMovimientos, addMovimiento } =
    useFinanceStore();
  const { grupos, fetchGrupos } = useGroupsStore();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_movimiento: 'gasto_individual',
    grupo: null,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetchBalance();
    fetchMovimientos();
    fetchGrupos();
  }, []);

  useFocusEffect(load);

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.descripcion.trim()) e.descripcion = 'La descripción es requerida';
    if (!form.monto) e.monto = 'El monto es requerido';
    if (isNaN(Number(form.monto)) || Number(form.monto) <= 0)
      e.monto = 'Ingresa un monto válido';
    if (!form.fecha) e.fecha = 'La fecha es requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        descripcion: form.descripcion.trim(),
        monto: Number(form.monto),
        fecha: form.fecha,
        tipo_movimiento: form.tipo_movimiento,
      };
      if (form.grupo) payload.grupo = form.grupo;

      await addMovimiento(payload);
      fetchBalance();
      setShowModal(false);
      setForm({
        descripcion: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        tipo_movimiento: 'gasto_individual',
        grupo: null,
      });
      Alert.alert('✅', 'Movimiento registrado');
    } catch (e) {
      const msg = e.response?.data
        ? Object.values(e.response.data).flat().join('\n')
        : 'Error al guardar';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !balance) {
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ backgroundColor: colors.secondary, paddingTop: 56, paddingBottom: 32, paddingHorizontal: spacing.lg }}>
            <SkeletonBox width={120} height={22} style={{ marginBottom: 16 }} />
            <SkeletonBox width="100%" height={110} borderRadius={16} />
        </View>
        <View style={{ padding: spacing.lg, gap: spacing.sm }}>
            {[1, 2, 3, 4].map((i) => <MovimientoSkeleton key={i} />)}
        </View>
        </View>
    );
    }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Mis Finanzas</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {balance && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Balance actual</Text>
            <Text
              style={[
                styles.balanceValue,
                { color: balance.balance >= 0 ? colors.success : colors.error },
              ]}
            >
              S/ {Number(balance.balance).toFixed(2)}
            </Text>
            <View style={styles.balanceRow}>
              <BalanceStat
                icon="arrow-down-circle-outline"
                label="Ingresos"
                value={balance.ingresos}
                color={colors.success}
              />
              <View style={styles.balanceDivider} />
              <BalanceStat
                icon="arrow-up-circle-outline"
                label="Gastos"
                value={balance.gastos}
                color={colors.error}
              />
            </View>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          Movimientos ({movimientos.length})
        </Text>

        {movimientos.length === 0 ? (
          <EmptyState
            emoji="💸"
            title="Sin movimientos aún"
            subtitle="Registra tu primer gasto"
            actionLabel="Añadir gasto"
            onAction={() => setShowModal(true)}
          />
        ) : (
          movimientos.map((mov) => (
            <MovimientoCard key={mov.id} movimiento={mov} />
          ))
        )}
      </ScrollView>

      {/* Modal nuevo movimiento */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo movimiento</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Selector tipo */}
              <Text style={styles.fieldLabel}>Tipo de movimiento</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tipoScroll}
              >
                {TIPO_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.tipoBtn,
                      form.tipo_movimiento === opt.value && styles.tipoBtnActive,
                    ]}
                    onPress={() => update('tipo_movimiento', opt.value)}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={
                        form.tipo_movimiento === opt.value
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.tipoBtnText,
                        form.tipo_movimiento === opt.value && styles.tipoBtnTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Input
                label="Descripción"
                placeholder="¿En qué se gastó?"
                value={form.descripcion}
                onChangeText={(v) => update('descripcion', v)}
                leftIcon="document-text-outline"
                error={errors.descripcion}
                autoCapitalize="sentences"
              />

              <Input
                label="Monto (S/)"
                placeholder="0.00"
                value={form.monto}
                onChangeText={(v) => update('monto', v)}
                leftIcon="cash-outline"
                keyboardType="decimal-pad"
                error={errors.monto}
              />

              <Input
                label="Fecha"
                placeholder="YYYY-MM-DD"
                value={form.fecha}
                onChangeText={(v) => update('fecha', v)}
                leftIcon="calendar-outline"
                error={errors.fecha}
              />

              {/* Grupo opcional */}
              {form.tipo_movimiento === 'gasto_grupal' && (
                <>
                  <Text style={styles.fieldLabel}>Grupo (opcional)</Text>
                  {grupos.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.grupoOption,
                        form.grupo === g.id && styles.grupoOptionActive,
                      ]}
                      onPress={() =>
                        update('grupo', form.grupo === g.id ? null : g.id)
                      }
                    >
                      <Text style={styles.grupoOptionText}>{g.nombre}</Text>
                      {form.grupo === g.id && (
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <Button
                title="Guardar movimiento"
                onPress={handleSave}
                loading={saving}
                style={styles.saveBtn}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BalanceStat({ icon, label, value, color }) {
  return (
    <View style={styles.balanceStat}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={styles.balanceStatLabel}>{label}</Text>
      <Text style={[styles.balanceStatValue, { color }]}>
        S/ {Number(value).toFixed(2)}
      </Text>
    </View>
  );
}

function MovimientoCard({ movimiento }) {
  const config = TIPO_CONFIG[movimiento.tipo_movimiento] || TIPO_CONFIG.gasto_individual;
  return (
    <Card style={styles.movCard}>
      <View style={styles.movRow}>
        <View style={[styles.movIcon, { backgroundColor: config.color + '15' }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.movInfo}>
          <Text style={styles.movDesc}>{movimiento.descripcion}</Text>
          <Text style={styles.movTipo}>{config.label}</Text>
        </View>
        <View style={styles.movRight}>
          <Text style={[styles.movMonto, { color: config.color }]}>
            S/ {Number(movimiento.monto).toFixed(2)}
          </Text>
          <Text style={styles.movFecha}>{movimiento.fecha}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.secondary,
    paddingTop: 56,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: spacing.xs,
  },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  balanceValue: { fontSize: 32, fontWeight: '800' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  balanceStat: { flex: 1, alignItems: 'center', gap: 3 },
  balanceDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
  balanceStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  balanceStatValue: { fontSize: 15, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  movCard: { marginBottom: 2 },
  movRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  movIcon: { width: 44, height: 44, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center' },
  movInfo: { flex: 1 },
  movDesc: { fontSize: 14, fontWeight: '600', color: colors.text },
  movTipo: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  movRight: { alignItems: 'flex-end' },
  movMonto: { fontSize: 15, fontWeight: '700' },
  movFecha: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 8 },
  tipoScroll: { marginBottom: spacing.md },
  tipoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.background,
  },
  tipoBtnActive: { borderColor: colors.primary, backgroundColor: '#ECFEFF' },
  tipoBtnText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  tipoBtnTextActive: { color: colors.primary, fontWeight: '600' },
  grupoOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  grupoOptionActive: { borderColor: colors.primary, backgroundColor: '#ECFEFF' },
  grupoOptionText: { fontSize: 14, fontWeight: '500', color: colors.text },
  saveBtn: { marginTop: spacing.sm, marginBottom: spacing.lg },
});