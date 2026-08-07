import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { createElement, type ReactElement, type ReactNode } from 'react';

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

type RenderWithQueryClientOptions = RenderOptions & {
  queryClient?: QueryClient;
};

type RenderWithQueryClientResult = RenderResult & {
  queryClient: QueryClient;
};

export const renderWithQueryClient = (
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions }: RenderWithQueryClientOptions = {},
): RenderWithQueryClientResult => {
  const Wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};
