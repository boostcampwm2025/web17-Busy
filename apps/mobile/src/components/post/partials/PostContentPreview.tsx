import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  content: string;
  onClickMore?: () => void;
};

export default function PostContentPreview({ content, onClickMore }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.content} numberOfLines={3}>
        {content}
      </Text>
      <TouchableOpacity onPress={onClickMore} activeOpacity={0.7}>
        <Text style={styles.more}>더보기...</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  content: {
    color: '#e5e5e5',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  more: {
    color: '#888',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
});
