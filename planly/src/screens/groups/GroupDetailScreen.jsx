import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, Alert, Modal,
  TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { groupsApi } from '../../api/groups.api';
import { servicesApi } from '../../api/services.api';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { colors, spacing, radius } from '../../theme';

const ESTADO_COLORS = {
  propuesto: { bg: '#FEF9C3', text: '#854D0E' },
  confirmado: { bg: '#DCFCE7', text: '#166534' },
  cancelado: { bg: '#FEE2E2', text: '#991B1B' },
};

export default function GroupDetailScreen({ navigation, route }) {
  const { grupo } = route.params;
  const [planes, setPlanes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [creatingPlan, setCreatingPlan] = useState(false);

  const loadData = async () => {
    try {
      const [planesRes, serviciosRes] = await Promise.all([
        groupsApi.getPlanes(),
        servicesApi.getCatalogo(),
      ]);
      const grupoPlanes = planesRes.data.filter(
        (p) => p.grupo === grupo.id
      );
      setPlanes(grupoPlanes);
      setServicios(serviciosRes.data);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar la información');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleCrearPlan = async () => {
    if (!selectedServicio) {
      Alert.alert('Atención', 'Selecciona un servicio');
      return;
    }
    setCreatingPlan(true);
    try {
      await groupsApi.createPlan({
        grupo: grupo.id,
        servicio: selectedServicio,
      });
      setShowPlanModal(false);
      setSelectedServicio(null);
      loadData();
      Alert.alert('¡Plan creado! 🎉', 'El plan fue propuesto al grupo');
    } catch (e) {
      const msg = e.response?.data
        ? Object.values(e.response.data).flat().join('\n')
        : 'Error al crear plan';
      Alert.alert('Error', msg);
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleConfirmarPlan = async (planId) => {
    try {
      await groupsApi.confirmarPlan(planId);
      loadData();
      Alert.alert('✅', 'Plan confirmado');
    } catch (e) {
      Alert.alert('Error', 'No se pudo confirmar el plan');
    }
  };

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {grupo.nombre?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.headerTitle}>{grupo.nombre}</Text>
          {grupo.descripcion ? (
            <Text style={styles.headerSubtitle}>{grupo.descripcion}</Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="map-outline" value={planes.length} label="Planes" color={colors.primary} />
          <StatCard
            icon="checkmark-circle-outline"
            value={planes.filter((p) => p.estado === 'confirmado').length}
            label="Confirmados"
            color={colors.success}
          />
          <StatCard
            icon="time-outline"
            value={planes.filter((p) => p.estado === 'propuesto').length}
            label="Pendientes"
            color={colors.warning}
          />
        </View>

        {/* Planes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Planes del grupo</Text>
            <TouchableOpacity
              style={styles.addPlanBtn}
              onPress={() => setShowPlanModal(true)}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addPlanText}>Proponer</Text>
            </TouchableOpacity>
          </View>

          {planes.length === 0 ? (
            <EmptyState
              emoji="🗺️"
              title="Sin planes aún"
              subtitle="Propón una actividad para el grupo"
            />
          ) : (
            planes.map((plan) => {
              const servicio = servicios.find((s) => s.id === plan.servicio);
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  servicio={servicio}
                  onConfirmar={() => handleConfirmarPlan(plan.id)}
                />
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal crear plan */}
      <Modal
        visible={showPlanModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPlanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Proponer plan</Text>
              <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Selecciona un servicio del catálogo
            </Text>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {servicios.length === 0 ? (
                <Text style={styles.emptyText}>No hay servicios disponibles</Text>
              ) : (
                servicios.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.servicioItem,
                      selectedServicio === s.id && styles.servicioSelected,
                    ]}
                    onPress={() => setSelectedServicio(s.id)}
                  >
                    <View style={styles.servicioItemInfo}>
                      <Text style={styles.servicioItemNombre}>{s.nombre}</Text>
                      <Text style={styles.servicioItemLugar}>{s.lugar}</Text>
                    </View>
                    <View style={styles.servicioItemRight}>
                      <Text style={styles.servicioItemPrecio}>
                        S/ {s.precio_actual}
                      </Text>
                      {selectedServicio === s.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <Button
              title="Proponer al grupo"
              onPress={handleCrearPlan}
              loading={creatingPlan}
              style={styles.modalBtn}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <Card style={styles.statCard}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function PlanCard({ plan, servicio, onConfirmar }) {
  const estado = ESTADO_COLORS[plan.estado] || ESTADO_COLORS.propuesto;
  return (
    <Card style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={styles.planIcon}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.planInfo}>
          <Text style={styles.planNombre}>
            {servicio ? servicio.nombre : `Servicio #${plan.servicio}`}
          </Text>
          {servicio && (
            <Text style={styles.planLugar}>{servicio.lugar}</Text>
          )}
        </View>
        <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
          <Text style={[styles.estadoText, { color: estado.text }]}>
            {plan.estado}
          </Text>
        </View>
      </View>
      {plan.estado === 'propuesto' && (
        <TouchableOpacity
          style={styles.confirmarBtn}
          onPress={onConfirmar}
        >
          <Ionicons name="checkmark-outline" size={14} color={colors.success} />
          <Text style={styles.confirmarText}>Confirmar plan</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.secondary,
    paddingTop: 50,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerContent: { alignItems: 'center' },
  headerAvatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerAvatarText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  content: { padding: spacing.lg, gap: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.md },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  addPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  addPlanText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  planCard: { marginBottom: 2, gap: spacing.sm },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planInfo: { flex: 1 },
  planNombre: { fontSize: 14, fontWeight: '600', color: colors.text },
  planLugar: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  estadoText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  confirmarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  confirmarText: { fontSize: 12, fontWeight: '600', color: colors.success },
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md },
  modalList: { maxHeight: 300, marginBottom: spacing.md },
  emptyText: { textAlign: 'center', color: colors.textSecondary, padding: spacing.lg },
  servicioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  servicioSelected: {
    borderColor: colors.primary,
    backgroundColor: '#ECFEFF',
  },
  servicioItemInfo: { flex: 1 },
  servicioItemNombre: { fontSize: 14, fontWeight: '600', color: colors.text },
  servicioItemLugar: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  servicioItemRight: { alignItems: 'flex-end', gap: 4 },
  servicioItemPrecio: { fontSize: 13, fontWeight: '700', color: colors.accent },
  modalBtn: { marginTop: spacing.sm },
});