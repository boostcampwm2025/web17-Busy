import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { saveToken } from '@/src/api/client';
import { useAuthStore } from '@/src/stores';
import { authMe, tmpLogin } from '@/src/api';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // TODO: 실제 OAuth 로그인으로 교체
  const handleTmpLogin = async () => {
    setLoading(true);
    try {
      const token = await tmpLogin('019be163-4b37-76ad-aeb3-6986a3489de6');
      await saveToken(token);
      const user = await authMe();
      setAuth({ userId: user.id, isAuthenticated: true });
      router.replace('/(tabs)');
    } catch {
      // 로그인 실패 처리
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>VIBR</Text>
      <Text style={styles.subtitle}>음악을 공유하세요</Text>

      {loading ? (
        <ActivityIndicator color="#fff" style={styles.button} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleTmpLogin}>
          <Text style={styles.buttonText}>로그인</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
