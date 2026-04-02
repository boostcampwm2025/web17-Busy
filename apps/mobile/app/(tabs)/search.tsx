import { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MusicResponseDto as Music } from '@repo/dto';
import type { SearchUserDto } from '@repo/dto';
import { useSearchScreen, SEARCH_TABS } from '@/src/hooks/search/useSearchScreen';
import TrackItem from '@/src/components/search/TrackItem';
import UserItem from '@/src/components/search/UserItem';

export default function SearchScreen() {
  const { query, setQuery, clearQuery, mode, handleChangeMode, itunes, youtube, users, active } = useSearchScreen();

  const [followOverrides, setFollowOverrides] = useState<Map<string, boolean>>(new Map());

  const handleFollowChange = useCallback((userId: string, isFollowing: boolean) => {
    setFollowOverrides((prev) => {
      const next = new Map(prev);
      next.set(userId, isFollowing);
      return next;
    });
  }, []);

  const renderBody = () => {
    const { status, errorMessage } = active;

    if (status === 'idle') {
      return (
        <View style={styles.centerMsg}>
          <Text style={styles.hintText}>{query.length === 0 ? '검색어를 입력하세요' : '2글자 이상 입력하세요'}</Text>
        </View>
      );
    }

    if (status === 'loading') {
      return (
        <View style={styles.centerMsg}>
          <ActivityIndicator color="#ff5eb3" />
        </View>
      );
    }

    if (status === 'error') {
      return (
        <View style={styles.centerMsg}>
          <Text style={styles.errorText}>{errorMessage ?? '검색 중 오류가 발생했습니다.'}</Text>
        </View>
      );
    }

    if (status === 'empty') {
      return (
        <View style={styles.centerMsg}>
          <Text style={styles.hintText}>검색 결과가 없습니다.</Text>
        </View>
      );
    }

    if (mode === 'user') {
      const userResults = users.results.map((u) => ({
        ...u,
        isFollowing: followOverrides.has(u.id) ? (followOverrides.get(u.id) as boolean) : u.isFollowing,
      }));

      return (
        <FlatList
          data={userResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: SearchUserDto }) => <UserItem user={item} onFollowChange={handleFollowChange} />}
          onEndReached={() => users.loadMore()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={users.isLoadingMore ? <ActivityIndicator color="#ff5eb3" style={styles.loader} /> : null}
          keyboardShouldPersistTaps="handled"
        />
      );
    }

    const musicResults = mode === 'video' ? youtube.results : itunes.results;

    return (
      <FlatList
        data={musicResults}
        keyExtractor={(item: Music) => `${mode}-${item.id}`}
        renderItem={({ item }: { item: Music }) => <TrackItem item={item} />}
        keyboardShouldPersistTaps="handled"
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="음악, 아티스트, 사용자 검색"
          placeholderTextColor="#555"
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearQuery} style={styles.clearBtn} hitSlop={8}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        {SEARCH_TABS.map(({ mode: tabMode, label }) => (
          <TouchableOpacity
            key={tabMode}
            onPress={() => handleChangeMode(tabMode)}
            style={[styles.tab, mode === tabMode && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, mode === tabMode && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.results}>{renderBody()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: 15,
  },
  clearBtn: {
    padding: 4,
  },
  clearIcon: {
    color: '#666',
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff5eb3',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  results: {
    flex: 1,
  },
  centerMsg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  hintText: {
    color: '#555',
    fontSize: 14,
  },
  errorText: {
    color: '#ff5eb3',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  loader: {
    paddingVertical: 12,
  },
});
