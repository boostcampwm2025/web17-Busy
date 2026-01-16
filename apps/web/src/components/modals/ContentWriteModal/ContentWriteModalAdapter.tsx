'use client';

import type { Music } from '@/types';
import { ContentWriteModal } from '@/components/modals/ContentWriteModal';

// 원본 ContentWriteModal은 initialMusic: Music (필수)지만
// 런타임 로직은 initialMusic이 없을 때도 동작하도록 작성되어 있음.
// 따라서 여기서만 TS를 만족시키기 위해 캐스팅해서 전달한다.
type Props = {
  initialMusic?: Music;
};

export default function ContentWriteModalAdapter({ initialMusic }: Props) {
  return <ContentWriteModal initialMusic={initialMusic as Music} />;
}
