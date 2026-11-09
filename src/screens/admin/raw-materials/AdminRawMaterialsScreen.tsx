import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Package, Pencil, Plus } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';

interface RawMaterial {
  _id: string;
  name: string;
  normalizedName?: string;
}

interface Props {
  onToast: (message: string, tone: 'success' | 'error') => void;
}

export function AdminRawMaterialsScreen({ onToast }: Props) {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiRequest('/products', { signal: controller.signal })
      .then(async response => {
        const data = (await response.json().catch(() => ({}))) as {
          products?: RawMaterial[];
          message?: string;
        };
        if (!response.ok || !Array.isArray(data.products)) {
          throw new Error(data.message || t('adminLoadFailed'));
        }
        if (!controller.signal.aborted) setMaterials(data.products);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            reason instanceof Error ? reason.message : t('adminNetworkError'),
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  function openCreate() {
    setEditingId(null);
    setName('');
    setFormError('');
    setFormOpen(true);
  }

  function openEdit(material: RawMaterial) {
    setEditingId(material._id);
    setName(material.name);
    setFormError('');
    setFormOpen(true);
  }

  async function saveMaterial() {
    const value = name.trim();
    if (!value) {
      setFormError(t('franchiseInventoryProductNameRequired'));
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const response = await apiRequest('/products', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingId ? { productId: editingId, name: value } : { name: value },
        ),
      });
      const data = (await response.json().catch(() => ({}))) as {
        products?: RawMaterial[];
        message?: string;
      };
      if (!response.ok) throw new Error(data.message || t('adminSaveFailed'));
      if (editingId) {
        setMaterials(current =>
          current
            .map(material =>
              material._id === editingId
                ? {
                    ...material,
                    name: value,
                    normalizedName: value.toLowerCase(),
                  }
                : material,
            )
            .sort((left, right) => left.name.localeCompare(right.name)),
        );
      } else {
        setMaterials(current =>
          [...current, ...(data.products ?? [])].sort((left, right) =>
            left.name.localeCompare(right.name),
          ),
        );
      }
      setFormOpen(false);
      onToast(
        data.message ||
          t(
            editingId
              ? 'franchiseInventoryProductUpdated'
              : 'franchiseInventoryProductsAdded',
          ),
        'success',
      );
    } catch (reason) {
      setFormError(
        reason instanceof Error ? reason.message : t('adminSaveFailed'),
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader variant="screen" />;
  if (error) {
    return (
      <AppErrorState
        message={error}
        onRetry={() => setReloadKey(value => value + 1)}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, styles.screenHeaderInline]}>
        <View style={styles.screenHeaderCopy}>
          <Text style={[styles.screenTitle, styles.screenTitleInline]}>
            {t('adminRawMaterials')}
          </Text>
          <Text style={styles.screenDescription}>
            {t('adminRawMaterialsDescription')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={openCreate}
          style={[styles.primaryButton, styles.screenHeaderAction]}
        >
          <Plus color={theme.colors.white} size={16} />
          <Text style={styles.primaryButtonText}>
            {t('adminAddRawMaterial')}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {formOpen ? (
          <View style={styles.storeCard}>
            <Text style={styles.storeTitle}>
              {editingId
                ? t('franchiseInventoryEditProduct', { name })
                : t('adminAddRawMaterial')}
            </Text>
            <TextInput
              accessibilityLabel={t('adminRawMaterialName')}
              autoCapitalize="words"
              editable={!saving}
              maxLength={editingId ? 100 : 1000}
              onChangeText={value => {
                setName(value);
                setFormError('');
              }}
              placeholder={t('franchiseInventoryNewProductsPlaceholder')}
              style={local.input}
              value={name}
            />
            {formError ? (
              <Text accessibilityRole="alert" style={local.error}>
                {formError}
              </Text>
            ) : null}
            {!editingId ? (
              <Text style={styles.screenDescription}>
                {t('franchiseInventoryProductsHint')}
              </Text>
            ) : null}
            <View style={styles.storeCardActions}>
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => setFormOpen(false)}
                style={styles.storeCardAction}
              >
                <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => void saveMaterial()}
                style={styles.storeCardAction}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? t('adminSaving') : t('adminSave')}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {materials.length === 0 ? (
          <Text style={styles.stateMessage}>{t('adminRawMaterialsEmpty')}</Text>
        ) : null}
        {materials.map(material => (
          <View key={material._id} style={styles.storeCard}>
            <View style={styles.storeCardHeader}>
              <View style={styles.storeIconTile}>
                <Package color={theme.colors.teal} size={20} />
              </View>
              <View style={styles.storeCardBody}>
                <Text style={styles.storeTitle}>{material.name}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('adminEditRawMaterial')} ${material.name}`}
                onPress={() => openEdit(material)}
                style={styles.storeCardHeaderAction}
              >
                <Pencil color={theme.colors.teal} size={16} />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  input: {
    minHeight: 44,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: theme.border.width,
    borderColor: theme.colors.beige,
    backgroundColor: theme.colors.white,
    color: theme.colors.ink,
    fontSize: theme.typography.sm,
  },
  error: {
    marginTop: theme.spacing.xs,
    color: theme.colors.error,
    fontSize: theme.typography.xs,
  },
});