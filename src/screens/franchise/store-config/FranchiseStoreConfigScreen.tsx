import { Image,Pressable,ScrollView,Text,View } from 'react-native';
import { AppErrorState } from '../../../components/AppErrorState';
import { AppLoader } from '../../../components/AppLoader';
import { AppToast } from '../../../components/AppToast';
import { theme } from '../../../config/theme';
import { t } from '../../../i18n';
import { Building2,CalendarClock,Coffee,Image as ImageIcon,UsersRound } from '../../../icons';
import { adminStyles as styles } from '../../../styles/adminStyles';
import { StoreConfigDrawer,type StoreConfigSection } from './StoreConfigDrawer';
import { localStyles,useFranchiseStoreConfig } from './useFranchiseStoreConfig';


export function FranchiseStoreConfigScreen({ storeId }: { storeId: string }) {
const { value, logoUri, loading, busy, section, setSection, toast, setToast, loadError, loadConfig, save, removeLogo } = useFranchiseStoreConfig({ storeId });
if (loading) return <View style={styles.content}><AppLoader /></View>;
if (loadError) return <View style={styles.content}><AppErrorState message={loadError} onRetry={() => loadConfig()} /></View>;
const cards: { section: StoreConfigSection; title: string; summary: string; Icon: typeof Building2 }[] = [
    { section: 'branding', title: t('franchiseStoreConfigBranding'), summary: value.name || t('franchiseStoreConfigNoStoreName'), Icon: Building2 },
    { section: 'cycle', title: t('franchiseStoreConfigCycle'), summary: value.configured ? (value.cycleType === 'calendar_month' ? t('franchiseStoreConfigCalendar') : t('franchiseStoreConfigCustomSummary', { start: value.startDay, end: value.endDay })) : t('franchiseStoreConfigNotConfigured'), Icon: CalendarClock },
    { section: 'positions', title: t('franchiseStoreConfigPositions'), summary: t('franchiseStoreConfigPositionCount', { count: value.positions.length }), Icon: UsersRound },
    { section: 'shifts', title: t('franchiseStoreConfigShifts'), summary: t('franchiseStoreConfigShiftCount', { count: value.shifts.length }), Icon: Coffee },
  ];
return (
    <View style={styles.content}>
      <ScrollView contentContainerStyle={localStyles.list}>
        <View style={localStyles.hero}><Text style={localStyles.title}>{t('franchiseStoreConfigTitle')}</Text><Text style={localStyles.subtitle}>{value.name || t('franchiseStoreConfigDescription')}</Text></View>
        {cards.map(({ section: key, title, summary, Icon }) => <Pressable key={key} accessibilityRole="button" accessibilityLabel={t('franchiseStoreConfigEditItem', { item: title })} onPress={() => setSection(key)} style={localStyles.card}>
          <View style={localStyles.icon}><Icon color={theme.colors.teal} size={21} /></View>
          <View style={localStyles.cardText}><Text style={localStyles.cardTitle}>{title}</Text><Text style={localStyles.cardSummary}>{summary}</Text></View>
          {key === 'branding' ? (logoUri ? <Image accessibilityLabel={t('franchiseStoreConfigLogo')} source={{ uri: logoUri }} resizeMode="contain" style={localStyles.logo} /> : <ImageIcon color={theme.colors.iconMuted} size={22} />) : null}
          <Text style={localStyles.edit}>{t('franchiseStoreConfigEdit')}</Text>
        </Pressable>)}
      </ScrollView>
      <StoreConfigDrawer visible={Boolean(section)} section={section} value={value} busy={busy} onClose={() => setSection(null)} onSave={(key, payload) => { save(key, payload); }} onRemoveLogo={() => { removeLogo(); }} />
      {toast ? <AppToast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} /> : null}
    </View>
  );
}
