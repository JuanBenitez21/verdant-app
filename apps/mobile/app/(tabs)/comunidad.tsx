import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
  RefreshControl, SafeAreaView,
} from 'react-native';
import { supabase } from '@/services/supabase';
import { Colors, ScreenTheme, Typography, Spacing, Radius } from '@/constants';

const T = ScreenTheme.dark;

interface CommunityPost {
  id: string;
  user_id: string;
  post_type: string;
  content: string;
  emoji: string;
  likes_count: number;
  created_at: string;
  users: { full_name: string } | null;
  userLiked?: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora mismo';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  return `hace ${days} días`;
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function getFirstName(name: string): string {
  const parts = name.split(' ');
  return `${parts[0] ?? ''} ${parts[1]?.[0] ?? ''}.`;
}

export default function ComunidadScreen() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const cargarPosts = useCallback(async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('*, users(full_name)')
      .order('created_at', { ascending: false })
      .limit(30);

    if (!data) { setLoading(false); setRefreshing(false); return; }

    // Verificar qué posts likeó el usuario actual
    let likedIds: Set<string> = new Set();
    if (userId) {
      const { data: likes } = await supabase
        .from('community_likes')
        .select('post_id')
        .eq('user_id', userId);
      likedIds = new Set(likes?.map((l: { post_id: string }) => l.post_id) ?? []);
    }

    const enriched = (data as CommunityPost[]).map(p => ({
      ...p,
      userLiked: likedIds.has(p.id),
    }));

    setPosts(enriched);
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  useEffect(() => {
    if (userId !== null) cargarPosts();
  }, [userId, cargarPosts]);

  async function handleLike(post: CommunityPost) {
    if (!userId) return;

    // Optimistic update
    setPosts(prev =>
      prev.map(p =>
        p.id === post.id
          ? { ...p, likes_count: post.userLiked ? p.likes_count - 1 : p.likes_count + 1, userLiked: !p.userLiked }
          : p,
      ),
    );

    if (post.userLiked) {
      await supabase
        .from('community_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', userId);

      await supabase
        .from('community_posts')
        .update({ likes_count: Math.max(0, post.likes_count - 1) })
        .eq('id', post.id);
    } else {
      await supabase
        .from('community_likes')
        .upsert({ post_id: post.id, user_id: userId });

      await supabase
        .from('community_posts')
        .update({ likes_count: post.likes_count + 1 })
        .eq('id', post.id);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.green400} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); cargarPosts(); }}
            tintColor={Colors.green400}
          />
        }
      >
        <Text style={styles.pageTitle}>Comunidad 👥</Text>
        <Text style={styles.pageSubtitle}>Logros de tu institución</Text>

        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>Sé el primero</Text>
            <Text style={styles.emptyBody}>
              Sé el primero en compartir tu progreso. Cuando reportes un día limpio, tu logro aparecerá aquí.
            </Text>
          </View>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} onLike={() => handleLike(post)} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PostCard({ post, onLike }: { post: CommunityPost; onLike: () => void }) {
  const name = post.users?.full_name ?? 'Verdant User';
  const initials = getInitials(name);
  const displayName = getFirstName(name);

  return (
    <View style={postStyles.card}>
      <View style={postStyles.header}>
        <View style={postStyles.avatar}>
          <Text style={postStyles.initials}>{initials}</Text>
        </View>
        <View style={postStyles.meta}>
          <Text style={postStyles.name}>{displayName}</Text>
          <Text style={postStyles.time}>{timeAgo(post.created_at)}</Text>
        </View>
      </View>

      <View style={postStyles.body}>
        <Text style={postStyles.emoji}>{post.emoji}</Text>
        <Text style={postStyles.content}>{post.content}</Text>
      </View>

      <View style={postStyles.footer}>
        <Pressable
          style={[postStyles.likeBtn, post.userLiked && postStyles.likeBtnActive]}
          onPress={onLike}
        >
          <Text style={postStyles.likeBtnText}>
            🌿 {post.likes_count > 0 ? post.likes_count : ''}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const postStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { ...Typography.labelSmall, color: Colors.green700 },
  meta: { flex: 1 },
  name: { ...Typography.labelLarge, color: Colors.textDark },
  time: { ...Typography.caption, color: Colors.textSoft },
  body: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  emoji: { fontSize: 32 },
  content: { ...Typography.bodyMedium, color: Colors.textMid, flex: 1, lineHeight: 22 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end' },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warm,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  likeBtnActive: { backgroundColor: Colors.green50, borderWidth: 1, borderColor: Colors.green300 },
  likeBtnText: { ...Typography.labelSmall, color: Colors.textMid },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  pageTitle: { ...Typography.displaySmall, color: Colors.white },
  pageSubtitle: { ...Typography.bodyMedium, color: Colors.green200, marginTop: -Spacing.sm },
  emptyState: { alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { ...Typography.displaySmall, color: Colors.white },
  emptyBody: { ...Typography.bodyMedium, color: Colors.green200, textAlign: 'center', lineHeight: 22 },
});
