import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <View style={styles.inner}>{children}</View>
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
}

export function Heading({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <View style={{ gap: Spacing.one, marginBottom: Spacing.two }}>
      <ThemedText style={styles.heading}>{children}</ThemedText>
      {sub ? <ThemedText themeColor="textSecondary">{sub}</ThemedText> : null}
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
      {children}
    </ThemedText>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const bg =
    variant === 'primary' ? theme.tint : variant === 'secondary' ? theme.backgroundSelected : 'transparent';
  const fg =
    variant === 'primary' ? theme.onTint : variant === 'danger' ? theme.danger : theme.tint;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        variant === 'ghost' || variant === 'danger' ? styles.buttonGhost : null,
        style,
      ]}>
      <ThemedText style={[styles.buttonText, { color: fg }]}>{title}</ThemedText>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.tint : theme.backgroundElement,
          borderColor: selected ? theme.tint : theme.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}>
      <ThemedText type="small" style={{ color: selected ? theme.onTint : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** Large selectable row used for single-choice questions. */
export function Choice({
  title,
  subtitle,
  selected,
  onPress,
  left,
}: {
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
  left?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: selected ? theme.tint : theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      {left}
      <View style={{ flex: 1 }}>
        <ThemedText style={{ fontWeight: 600 }}>{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <View style={[styles.radio, { borderColor: selected ? theme.tint : theme.border }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: theme.tint }]} /> : null}
      </View>
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  error,
  ...input
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: Spacing.one }}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        {...input}
        style={[
          styles.input,
          input.multiline ? styles.inputMulti : null,
          { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: error ? theme.danger : theme.border },
        ]}
      />
      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  const theme = useTheme();
  const color = tone === 'warning' ? theme.warning : theme.tint;
  return (
    <View style={[styles.notice, { borderLeftColor: color, backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {children}
      </ThemedText>
    </View>
  );
}

export function Progress({ step, total }: { step: number; total: number }) {
  const theme = useTheme();
  return (
    <View style={styles.progress} accessibilityLabel={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.progressBar, { backgroundColor: i < step ? theme.tint : theme.backgroundSelected }]}
        />
      ))}
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.six },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.three },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  footerInner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', flexDirection: 'row', gap: Spacing.two },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three, gap: Spacing.two },
  heading: { fontSize: 26, lineHeight: 32, fontWeight: 700 },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 12, marginTop: Spacing.two },
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  buttonGhost: { flexGrow: 0, paddingHorizontal: Spacing.two },
  buttonText: { fontWeight: 700, fontSize: 16 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: Spacing.three,
    minHeight: 56,
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: Spacing.three, paddingVertical: 12, fontSize: 16 },
  inputMulti: { minHeight: 110, textAlignVertical: 'top' },
  notice: { borderLeftWidth: 3, borderRadius: 8, padding: Spacing.three },
  progress: { flexDirection: 'row', gap: Spacing.one },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
