import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGroupsStore } from '../../store/groups.store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { colors, spacing, radius } from '../../theme';

export default function CreateGroupScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { createGrupo } = useGroupsStore();

  const validate = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = 'El nombre es requerido';
    if (nombre.length > 0 && nombre.length < 3) e.nombre = 'Mínimo 3 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await createGrupo({ nombre: nombre.trim(), descripcion: descripcion.trim() });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'No se pudo crear el grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Grupo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Ícono del grupo */}
        <View style={styles.iconContainer}>
          <View style={styles.groupIcon}>
            <Text style={styles.groupEmoji}>👥</Text>
          </View>
          <Text style={styles.iconHint}>Tu grupo de aventuras</Text>
        </View>

        <Input
          label="Nombre del grupo"
          placeholder="Ej: Viaje a Cancún 🏖️"
          value={nombre}
          onChangeText={setNombre}
          leftIcon="people-outline"
          error={errors.nombre}
          autoCapitalize="words"
        />

        <Input
          label="Descripción (opcional)"
          placeholder="¿De qué trata este grupo?"
          value={descripcion}
          onChangeText={setDescripcion}
          leftIcon="document-text-outline"
        />

        <Button
          title="Crear grupo"
          onPress={handleCreate}
          loading={loading}
          style={styles.btnCreate}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  groupIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary + '30',
    marginBottom: spacing.sm,
  },
  groupEmoji: {
    fontSize: 40,
  },
  iconHint: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  btnCreate: {
    marginTop: spacing.md,
  },
});