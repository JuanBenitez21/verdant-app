import React, { useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { Colors } from '@/constants';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  contentContainerStyle?: object;
  style?: object;
}

export function PullToRefresh({ onRefresh, children, contentContainerStyle, style }: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.green400}
          colors={[Colors.green400]}
        />
      }
    >
      {children}
    </ScrollView>
  );
}
