import { Tabs } from 'expo-router';
import { Colors, Typography } from '@/constants';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.green800,
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.green300,
        tabBarInactiveTintColor: Colors.green600,
        tabBarLabelStyle: {
          ...Typography.labelSmall,
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="comunidad"
        options={{ title: 'Comunidad', tabBarIcon: ({ color }) => <TabIcon emoji="👥" color={color} /> }}
      />
      <Tabs.Screen
        name="logros"
        options={{ title: 'Logros', tabBarIcon: ({ color }) => <TabIcon emoji="🏆" color={color} /> }}
      />
      <Tabs.Screen
        name="recursos"
        options={{ title: 'Recursos', tabBarIcon: ({ color }) => <TabIcon emoji="📚" color={color} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} /> }}
      />
      {/* Ocultar la tab de juegos — ahora vive dentro de Recursos */}
      <Tabs.Screen name="juegos" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native') as typeof import('react-native');
  return <Text style={{ fontSize: 20, opacity: color === Colors.green300 ? 1 : 0.5 }}>{emoji}</Text>;
}
