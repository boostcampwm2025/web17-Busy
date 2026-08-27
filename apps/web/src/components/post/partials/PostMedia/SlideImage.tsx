import type { Variant } from './types';

type Props = {
  src: string;
  alt: string;
  variant: Variant;
  /** 활성 슬라이드만 hover 확대를 준다. */
  isActive?: boolean;
};

/**
 * 슬라이드 한 장.
 *
 * modal은 비율이 제각각인 앨범아트를 잘라내지 않으려고 `object-contain`으로 두고,
 * 남는 여백은 같은 이미지를 흐리게 깐 배경으로 채운다. card는 정사각형이라 그냥 채운다.
 */
export default function SlideImage({ src, alt, variant, isActive = false }: Props) {
  const zoomClassName = isActive ? ' transition-transform duration-500 group-hover:scale-105' : '';

  if (variant === 'modal') {
    return (
      <>
        <img src={src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-md brightness-75" />
        <img src={src} alt={alt} className={`absolute inset-0 w-full h-full object-contain${zoomClassName}`} />
      </>
    );
  }

  return <img src={src} alt={alt} className={`w-full h-full object-cover${zoomClassName}`} />;
}
