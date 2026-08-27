import type { Variant } from './types';

export const stylesByVariant: Record<Variant, { container: string; playBtn: string; infoBox: string; navBtn: string }> = {
  card: {
    container: 'relative group w-full aspect-square overflow-hidden xs:rounded-md mb-4 bg-gray-100',
    playBtn:
      'w-12 aspect-square rounded-full bg-primary text-white flex items-center justify-center transition-all hover:shadow-[2px_2px_0px_0px_#00ebc7]',
    infoBox:
      'absolute max-w-4/5 bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border-2 border-primary shadow-[4px_4px_0px_0px_#FDE24F]',
    navBtn:
      'absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 border border-primary text-primary flex items-center justify-center hover:bg-white transition-opacity ' +
      'lg:opacity-0 lg:group-hover:opacity-100 lg:pointer-events-none lg:group-hover:pointer-events-auto',
  },
  modal: {
    container: 'w-full aspect-[7/4] md:aspect-[7/3] md:flex-1 bg-gray-4 relative group overflow-hidden',
    playBtn:
      'w-10 md:w-12 aspect-square rounded-full bg-primary text-white flex items-center justify-center transition-all hover:scale-105 hover:shadow-[3px_3px_0px_0px_#00ebc7]',
    infoBox:
      'absolute max-w-4/5 bottom-3 left-3 md:bottom-6 md:left-6 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 sm:px-5 sm:py-3 rounded-xl border-2 border-primary shadow-[3px_3px_0px_0px_#FDE24F] md:shadow-[6px_6px_0px_0px_#FDE24F]',
    navBtn:
      'absolute top-1/2 -translate-y-1/2 w-8 md:w-12 aspect-square rounded-full bg-white/80 border border-primary text-primary flex items-center justify-center hover:bg-white transition-opacity ' +
      'lg:opacity-0 lg:group-hover:opacity-100 lg:pointer-events-none lg:group-hover:pointer-events-auto',
  },
};
