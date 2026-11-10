import { useState } from 'react';
import { Platform, Pressable, Share, Text, View } from 'react-native';
import { formatINR, type SavedBill } from '../../../common/billing';
import { t } from '../../../i18n';
import { Receipt, X } from '../../../icons';
import { theme } from '../../../config/theme';
import { billingStyles as styles } from './billingStyles';

export function BillingReceipt({ bill, onClose }: { bill: SavedBill; onClose?: () => void }) {
  const [error, setError] = useState('');
  const order = `${t(bill.orderType === 'dineIn' ? 'billingDineIn' : 'billingTakeAway')} / ${bill.tableNumber ? `${t('billingToken')} ${bill.tableNumber}` : t('billingTokenMissing')}`;
  const date = new Date(bill.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  async function shareReceipt() {
    setError('');
    const text = [bill.storeName, bill.billNumber, `${date} IST`, order,
      ...(bill.customer ? [[bill.customer.firstName, bill.customer.middleName, bill.customer.lastName].filter(Boolean).join(' '), bill.customer.mobile] : []),
      '', ...bill.items.map(item => `${item.name} x ${item.quantity} @ ${formatINR(item.unitPricePaise)} = ${formatINR(item.amountPaise)}`), '',
      `${t('billingSubtotal')}: ${formatINR(bill.subtotalPaise)}`, `${t('billingGst')}: ${formatINR(bill.gstPaise)}`, `${t('billingTotal')}: ${formatINR(bill.totalPaise)}`].join('\n');
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const popup = window.open('', '_blank');
        if (!popup) throw new Error('Allow the receipt window to print.');
        popup.opener = null;
        popup.document.title = bill.billNumber;
        const content = popup.document.createElement('pre');
        content.textContent = text;
        content.style.whiteSpace = 'pre-wrap';
        content.style.fontSize = '14px';
        content.style.padding = '24px';
        popup.document.body.appendChild(content);
        popup.focus();
        popup.print();
      } else await Share.share({ title: bill.billNumber, message: text });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to share receipt.'); }
  }
  return (
    <View style={styles.panel}>
      <View style={[styles.row, styles.spread]}><Text style={styles.heading}>{t('billingReceipt')}</Text>{onClose ? <Pressable accessibilityRole="button" accessibilityLabel={t('adminCloseMenu')} onPress={onClose} style={styles.iconButton}><X size={20} color={theme.colors.muted} /></Pressable> : null}</View>
      <Text style={styles.strong}>{bill.storeName}</Text><Text selectable style={styles.body}>{bill.billNumber}</Text><Text style={styles.muted}>{date} IST</Text><Text style={styles.body}>{order}</Text>
      {bill.customer ? <View><Text style={styles.body}>{[bill.customer.firstName, bill.customer.middleName, bill.customer.lastName].filter(Boolean).join(' ')}</Text><Text style={styles.body}>{bill.customer.mobile}</Text></View> : null}
      {bill.items.map(item => <View key={item.productId} style={[styles.item, styles.row, styles.spread]}><View style={styles.grow}><Text style={styles.strong}>{item.name}</Text><Text style={styles.muted}>{item.quantity} x {formatINR(item.unitPricePaise)}</Text></View><Text style={styles.strong}>{formatINR(item.amountPaise)}</Text></View>)}
      <View style={styles.totals}>{[[t('billingSubtotal'), bill.subtotalPaise], [t('billingGst'), bill.gstPaise], [t('billingTotal'), bill.totalPaise]].map(([label, amount]) => <View key={String(label)} style={[styles.row, styles.spread]}><Text style={styles.strong}>{label}</Text><Text style={styles.strong}>{formatINR(Number(amount))}</Text></View>)}</View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => void shareReceipt()} style={styles.button}><Receipt size={18} color={theme.colors.orange} /><Text style={styles.body}>{t(Platform.OS === 'web' ? 'billingPrint' : 'billingShare')}</Text></Pressable>
    </View>
  );
}