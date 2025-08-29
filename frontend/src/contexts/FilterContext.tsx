'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface FilterState {
  unchecked: boolean;
  unregisteredImage: boolean;
  questionTable: boolean;
  questionImage: boolean;
  choiceImage: boolean;
  choiceTable: boolean;
}

interface FilterContextType {
  filters: FilterState;
  setFilter: (filterName: keyof FilterState, value: boolean) => void;
  toggleFilter: (filterName: keyof FilterState) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  unchecked: false,
  unregisteredImage: false,
  questionTable: false,
  questionImage: false,
  choiceImage: false,
  choiceTable: false
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const setFilter = (filterName: keyof FilterState, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const toggleFilter = (filterName: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <FilterContext.Provider value={{
      filters,
      setFilter,
      toggleFilter,
      resetFilters
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}