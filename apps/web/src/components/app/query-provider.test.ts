import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import QueryProvider from './QueryProvider';

const TestChild = () => createElement('div', null, 'query provider ready');

describe('QueryProvider', () => {
  it('renders children inside a query client boundary', () => {
    render(createElement(QueryProvider, null, createElement(TestChild)));

    expect(screen.getByText('query provider ready')).toBeInTheDocument();
  });
});
