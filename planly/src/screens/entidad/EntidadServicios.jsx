import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, StatusBar, RefreshControl, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useEntidadStore } from '../../store/entidad.store';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import { colors, spacing, radius } from '../../theme';

const PURPLE = '#8B5CF6';

export default function EntidadServicios({ navigation }) {
  const { servicios, isLoading, fetchServicios, deleteServicio, togglePromocion } =
    useEntidadStore();

  useFocusEffect(useCallback(() => { fetchServicios(); }, []));

  const handleDelete = (id, nombre) => {
    Alert.alert(
      'Desactivar servicio',
      `¿Desactivar "${nombre}"? Ya no aparecerá en el catálogo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteServicio(id);
            } catch (e) {
              Alert.alert('Error', 'No se pudo desactivar el servicio');
            }
          },
        },
      ]
    );
  };

  const handleTogglePromocion = async (id, activa) => {
    try {
      await togglePromocion(id, !activa);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cambiar la promoción');
    }
  };

  const renderServicio = ({ item }) => (
    <Card style={styles.servicioCard}>
      {/* Cabecera */}
      <View style={styles.cardTop}>
        <View style={styles.servicioIcon}>
          <Ionicons name="briefcase-outline" size={20} color={PURPLE} />
        </View>
        <View style={styles.servicioInfo}>
          <Text style={styles.servicioNombre}>{item.nombre}</Text>
          <Text style={styles.servicioLugar}>{item.lugar}</Text>
        </View>
        <View style={[
          styles.estadoBadge,
          { backgroundColor: item.activo ? '#DCFCE7' : '#FEE2E2' },
        ]}>
          <Text style={[
            styles.estadoText,
            { color: item.activo ? '#166534' : '#991B1B' },
          ]}>
            {item.activo ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      {/* Precios */}
      <View style={styles.preciosRow}>
        <View style={styles.precioItem}>
          <Text style={styles.precioLabel}>Regular</Text>
          <Text style={styles.precioValue}>S/ {item.costo_regular}</Text>
        </View>
        {item.costo_promocional && (
          <View style={styles.precioItem}>
            <Text style={styles.precioLabel}>Promocional</Text>
            <Text style={[styles.precioValue, { color: colors.success }]}>
              S/ {item.costo_promocional}
            </Text>
          </View>
        )}
        <View style={styles.precioItem}>
          <Text style={styles.precioLabel}>Capacidad</Text>
          <Text style={styles.precioValue}>{item.capacidad_maxima} pers.</Text>
        </View>
      </View>

      {/* Horario */}
      <View style={styles.horarioRow}>
        <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
        <Text style={styles.horarioText}>
          {item.hora_inicio} — {item.hora_fin}
        </Text>
      </View>

      {/* Toggle promoción */}
      {item.costo_promocional && (
        <View style={styles.promoRow}>
          <View style={styles.promoLeft}>
            <Ionicons name="pricetag-outline" size={14} color={colors.warning} />
            <Text style={styles.promoText}>Promoción activa</Text>
          </View>
          <Switch
            value={item.tiene_promocion}
            onValueChange={() =>
              handleTogglePromocion(item.id, item.tiene_promocion)
            }
            trackColor={{ false: colors.border, true: colors.warning + '50' }}
            thumbColor={item.tiene_promocion ? colors.warning : '#f4f3f4'}
          />
        </View>
      )}

      {/* Acciones */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            navigation.navigate('EditarServicio', { servicio: item })
          }
        >
          <Ionicons name="pencil-outline" size={15} color={PURPLE} />
          <Text style={[styles.actionText, { color: PURPLE }]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionDanger]}
          onPress={() => handleDelete(item.id, item.nombre)}
        >
          <Ionicons name="trash-outline" size={15} color={colors.error} />
          <Text style={[styles.actionText, { color: colors.error }]}>
            Desactivar
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (isLoading && servicios.length === 0) return <Loader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Servicios</Text>
          <Text style={styles.headerSubtitle}>
            {servicios.length} servicio{servicios.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CrearServicio')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {servicios.length === 0 ? (
        <EmptyState
          emoji="📦"
          title="Sin servicios aún"
          subtitle="Publica tu primer servicio para aparecer en el catálogo de Planly"
          actionLabel="Crear servicio"
          onAction={() => navigation.navigate('CrearServicio')}
        />
      ) : (
        <FlatList
          data={servicios}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderServicio}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={fetchServicios}
              colors={[PURPLE]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: PURPLE, justifyContent: 'center', alignItems: 'center',
  },
  list: { padding: spacing.lg, gap: spacing.md },
  servicioCard: { gap: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  servicioIcon: {
    width: 44, height: 44, borderRadius: radius.sm,
    backgroundColor: PURPLE + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  servicioInfo: { flex: 1 },
  servicioNombre: { fontSize: 15, fontWeight: '600', color: colors.text },
  servicioLugar: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  estadoText: { fontSize: 11, fontWeight: '600' },
  preciosRow: {
    flexDirection: 'row', gap: spacing.sm,
    backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.sm,
  },
  precioItem: { flex: 1, alignItems: 'center' },
  precioLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  precioValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  horarioRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  horarioText: { fontSize: 12, color: colors.textSecondary },
  promoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FEF9C3', borderRadius: radius.sm, padding: spacing.sm,
  },
  promoLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promoText: { fontSize: 13, fontWeight: '500', color: '#854D0E' },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.xs },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: radius.sm,
    backgroundColor: PURPLE + '10',
  },
  actionDanger: { backgroundColor: colors.error + '10' },
  actionText: { fontSize: 13, fontWeight: '600' },
});