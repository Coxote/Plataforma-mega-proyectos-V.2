import { useState, useCallback } from 'react';

export type KpiType = 'active_projects' | 'agency_utilization' | 'pending_approvals' | null;

export interface UseKpiSidePanelReturn {
  activeKpi: KpiType;
  isOpen: boolean;
  searchQuery: string;
  statusFilter: string;
  openPanel: (kpiType: NonNullable<KpiType>) => void;
  closePanel: () => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: string) => void;
  resetFilters: () => void;
}

export function useKpiSidePanel(): UseKpiSidePanelReturn {
  const [activeKpi, setActiveKpi] = useState<KpiType>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const openPanel = useCallback((kpiType: NonNullable<KpiType>) => {
    setActiveKpi(kpiType);
    setSearchQuery('');
    setStatusFilter('todos');
  }, []);

  const closePanel = useCallback(() => {
    setActiveKpi(null);
    setSearchQuery('');
    setStatusFilter('todos');
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('todos');
  }, []);

  return {
    activeKpi,
    isOpen: activeKpi !== null,
    searchQuery,
    statusFilter,
    openPanel,
    closePanel,
    setSearchQuery,
    setStatusFilter,
    resetFilters,
  };
}
