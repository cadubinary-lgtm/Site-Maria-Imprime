import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Atributos from './Atributos';
import '@testing-library/jest-dom';

// Mock do trpc
vi.mock('@/lib/trpc', () => ({
  trpc: {
    attributes: {
      listAttributes: {
        useQuery: vi.fn(),
      },
      deleteAttribute: {
        useMutation: vi.fn(),
      },
    },
  },
}));

describe('Atributos Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  it('should render the page header', () => {
    const { trpc } = require('@/lib/trpc');
    trpc.attributes.listAttributes.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    trpc.attributes.deleteAttribute.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Atributos />
      </QueryClientProvider>
    );

    expect(screen.getByText('Gerenciar Atributos')).toBeInTheDocument();
    expect(screen.getByText('Cadastre atributos globais reutilizáveis para seus produtos')).toBeInTheDocument();
  });

  it('should display search input', () => {
    const { trpc } = require('@/lib/trpc');
    trpc.attributes.listAttributes.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    trpc.attributes.deleteAttribute.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Atributos />
      </QueryClientProvider>
    );

    const searchInput = screen.getByPlaceholderText('Buscar atributo...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should display empty state when no attributes found', () => {
    const { trpc } = require('@/lib/trpc');
    trpc.attributes.listAttributes.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    trpc.attributes.deleteAttribute.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Atributos />
      </QueryClientProvider>
    );

    expect(screen.getByText('Nenhum atributo encontrado nas 7 categorias principais')).toBeInTheDocument();
  });

  it('should display New Attribute button', () => {
    const { trpc } = require('@/lib/trpc');
    trpc.attributes.listAttributes.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    trpc.attributes.deleteAttribute.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Atributos />
      </QueryClientProvider>
    );

    expect(screen.getByText('Novo Atributo')).toBeInTheDocument();
  });
});
