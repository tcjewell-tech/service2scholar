// Importing the one set directly keeps the other icon fonts (about 4 MB) out of the app.
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useAccount } from '@/store';

type IconName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: IconName; color: ColorValue; size: number }) {
  return <Ionicons name={name} color={color as string} size={size} />;
}

function icon(name: IconName) {
  const Icon = ({ color, size }: { color: ColorValue; size: number }) => <TabIcon name={name} color={color} size={size} />;
  Icon.displayName = `TabIcon(${name})`;
  return Icon;
}

export default function TabsLayout() {
  const theme = useTheme();
  const hasProfiles = useAccount((s) => s.profiles.length > 0);
  if (!hasProfiles) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.backgroundElement, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: theme.text, fontWeight: '700' },
      }}>
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: icon('school-outline') }} />
      <Tabs.Screen name="checklist" options={{ title: 'Plan', tabBarIcon: icon('calendar-outline') }} />
      <Tabs.Screen name="profiles" options={{ title: 'Profiles', tabBarIcon: icon('people-outline') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('settings-outline') }} />
    </Tabs>
  );
}
