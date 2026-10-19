import { StyleSheet } from 'react-native';

export const responsiveDrawerStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  webRoot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dialogRoot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  panel: {
    minHeight: 0,
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
  webPanel: {
    width: '30%',
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: '#E8E4D7',
    shadowColor: '#24323A',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  nativePanel: {
    width: '100%',
    height: '70%',
    borderTopWidth: 1,
    borderTopColor: '#E8E4D7',
    shadowColor: '#24323A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  dialogPanel: {
    width: '90%',
    maxWidth: 480,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#E8E4D7',
    shadowColor: '#24323A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
});