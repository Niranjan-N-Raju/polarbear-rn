import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const initialMetrics = {
  frame: { x: 0, y: 0, width: 400, height: 800 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

export function render(element: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => { renderer = TestRenderer.create(element); });
  return renderer;
}

export function renderSafeArea(element: React.ReactElement) {
  return render(<SafeAreaProvider initialMetrics={initialMetrics}>{element}</SafeAreaProvider>);
}

export function buttons(renderer: TestRenderer.ReactTestRenderer) {
  return renderer.root.findAll((node) => typeof node.props.onPress === 'function');
}

export function pressables(renderer: TestRenderer.ReactTestRenderer) {
  return buttons(renderer);
}

export function containsText(value: unknown, expected: string): boolean {
  if (value === expected) return true;
  if (Array.isArray(value)) return value.some((item) => containsText(item, expected));
  if (value && typeof value === 'object' && 'props' in value) {
    return containsText((value as { props?: { children?: unknown } }).props?.children, expected);
  }
  return false;
}

export function buttonByLabel(renderer: TestRenderer.ReactTestRenderer, label: string) {
  return renderer.root.find((node) => node.props.accessibilityLabel === label);
}

export async function flushEffects() {
  await act(async () => { await new Promise((resolve) => setImmediate(resolve)); });
}

export function response(status: number, data: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  } as unknown as Response;
}
