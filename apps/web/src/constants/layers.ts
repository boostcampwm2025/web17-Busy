/**
 * 겹침 순서를 한곳에서 정한다. 모달마다 z-50/z-60/z-[10001]을 각자 정하던 것을 대체한다.
 *
 * 값이 10000을 넘는 이유: 모바일 UI(MobileBottomNav z-[10000], MobileBottomSheet·RightPanel z-[10001])가
 * 이미 그 대역을 쓰고 있어, 모달이 그 위를 덮으려면 더 높아야 한다.
 *
 * Tailwind JIT가 클래스 이름을 정적으로 스캔하므로 문자열 리터럴로 둔다. 조립하면 안 된다.
 */
export const LAYER = {
  /** ModalContainer가 띄우는 모달. 한 번에 하나만 뜨므로 서로 겹칠 일이 없다. */
  modal: 'z-[10100]',
  /** 모달 위에 겹쳐 뜨는 것. 예: 게시글 상세 위의 좋아요 목록 */
  overlay: 'z-[10200]',
  /** 확인 대화상자. 모달이든 오버레이든 그 위에 떠야 한다. */
  confirm: 'z-[10300]',
} as const;

export type Layer = keyof typeof LAYER;
