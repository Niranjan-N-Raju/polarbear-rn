import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiRequest } from '../../../api/auth';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Package, Pencil, Plus } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';

interface ProductCategory {
  _id: string;
  name: string;
  normalizedName: string;
}

interface Props {
  onToast: (message: string, tone: 'success' | 'error') => void;
}

export function AdminProductCategoriesScreen({ onToast }: Props) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiRequest('/product-categories', { signal: controller.signal })
      .then(async response => {
        const data = (await response.json().catch(() => ({}))) as {
          categories?: ProductCategory[];
          message?: string;
        };
        if (!response.ok || !Array.isArray(data.categories))
          throw new Error(data.message || t('adminLoadFailed'));
        if (!controller.signal.aborted) setCategories(data.categories);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : t('adminNetworkError'));
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

  function openEdit(category: ProductCategory) {
    setEditingId(category._id);
    setName(category.name);
    setFormError('');
    setFormOpen(true);
  }

  async function saveCategory() {
    const value = name.trim();
    if (!value || value.length > 100) {
      setFormError(t('adminProductCategoryNameInvalid'));
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const response = await apiRequest('/product-categories', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingId ? { categoryId: editingId } : {}),
          name: value,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        category?: ProductCategory;
        message?: string;
      };
      if (!response.ok) throw new Error(data.message || t('adminSaveFailed'));
      if (data.category) {
        setCategories(current =>
          [...current.filter(item => item._id !== data.category!._id), data.category!]
            .sort((left, right) => left.name.localeCompare(right.name)),
        );
      } else {
        setReloadKey(key => key + 1);
      }
      setFormOpen(false);
      onToast(
        data.message ||
          t(editingId ? 'adminProductCategoryUpdated' : 'adminProductCategoryAdded'),
        'success',
      );
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : t('adminSaveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppLoader variant="screen" />;
  if (error)
    return (
      <AppErrorState
        message={error}
        onRetry={() => setReloadKey(value => value + 1)}
      />
    );

  return (
    <View style={styles.screen}>
      <View style={[styles.screenHeader, styles.screenHeaderInline]}>
        <View style={styles.screenHeaderCopy}>
          <Text style={[styles.screenTitle, styles.screenTitleInline]}>
            {t('adminProductCategories')}
          </Text>
          <Text style={styles.screenDescription}>
            {t('adminProductCategoriesDescription')}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={openCreate}
          style={[styles.primaryButton, styles.screenHeaderAction]}
        >
          <Plus color={theme.colors.white} size={16} />
          <Text style={styles.primaryButtonText}>{t('adminAddProductCategory')}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {categories.length === 0 ? (
          <Text style={styles.stateMessage}>{t('adminProductCategoriesEmpty')}</Text>
        ) : null}
        {categories.map(category => (
          <View key={category._id} style={styles.storeCard}>
            <View style={styles.storeCardHeader}>
              <View style={styles.storeIconTile}>
                <Package color={theme.colors.teal} size={20} />
              </View>
              <View style={styles.storeCardBody}>
                <Text style={styles.storeTitle}>{category.name}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('adminEditProductCategory')} ${category.name}`}
                onPress={() => openEdit(category)}
                style={styles.storeCardHeaderAction}
              >
                <Pencil color={theme.colors.teal} size={16} />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      {formOpen ? (
        <View style={local.overlay}>
          <View style={local.form}>
            <View style={styles.drawerHeading}>
              <Text style={[styles.modalTitle, styles.drawerHeadingTitle]}>
                {editingId ? t('adminEditProductCategory') : t('adminAddProductCategory')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('adminCloseMenu')}
                onPress={() => setFormOpen(false)}
                style={styles.userIconAction}
              >
                <Text style={local.close}>×</Text>
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel={t('adminProductCategoryName')}
              autoCapitalize="words"
              autoFocus
              editable={!saving}
              maxLength={100}
              onChangeText={value => {
                setName(value);
                setFormError('');
              }}
              placeholder={t('adminProductCategoryName')}
              style={local.input}
              value={name}
            />
            {formError ? (
              <Text accessibilityRole="alert" style={local.error}>{formError}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={() => setFormOpen(false)} style={[styles.secondaryButton, styles.drawerActionButton]}>
                <Text style={styles.secondaryButtonText}>{t('adminCancel')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={saving} onPress={() => void saveCategory()} style={[styles.primaryButton, styles.drawerActionButton]}>
                <Text style={styles.primaryButtonText}>{saving ? t('adminSaving') : t('adminSave')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const local = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  form: {
    width: '100%',
    maxWidth: 480,
    padding: theme.spacing['2xl'],
    borderWidth: theme.border.width,
    borderColor: theme.colors.beige,
    backgroundColor: theme.colors.white,
  },
  input: {
    minHeight: 44,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: theme.border.width,
    borderColor: theme.colors.beige,
    color: theme.colors.ink,
    fontSize: theme.typography.sm,
  },
  error: {
    marginTop: theme.spacing.sm,
    color: theme.colors.error,
    fontSize: theme.typography.xs,
  },
  close: { color: theme.colors.muted, fontSize: 24, lineHeight: 28 },
});