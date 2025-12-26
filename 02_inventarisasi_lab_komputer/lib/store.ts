// lib/store.ts
import { create } from 'zustand';
import { InventoryItem } from './inventory-data';

interface InventoryState {
  // State
  inventory: InventoryItem[];
  categories: string[];
  statuses: string[];
  locations: string[];
  searchQuery: string;
  categoryFilter: string;
  filteredInventory: InventoryItem[];

  // Actions
  initializeData: (data: {
    inventory: InventoryItem[];
    categories: string[];
    statuses: string[];
    locations: string[];
  }) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  _filterInventory: () => void; // internal action
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  // Initial State
  inventory: [],
  categories: [],
  statuses: [],
  locations: [],
  searchQuery: '',
  categoryFilter: 'all',
  filteredInventory: [],

  // Action to initialize data from server
  initializeData: (data) => {
    set({
      inventory: data.inventory,
      categories: data.categories,
      statuses: data.statuses,
      locations: data.locations,
      filteredInventory: data.inventory, // Initially, show all
    });
  },

  // Action to update search query
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get()._filterInventory();
  },

  // Action to update category filter
  setCategoryFilter: (category) => {
    set({ categoryFilter: category });
    get()._filterInventory();
  },

  // Internal action to perform filtering
  _filterInventory: () => {
    const { inventory, searchQuery, categoryFilter } = get();
    const filtered = inventory
      .filter(item => {
        if (categoryFilter === 'all') return true;
        return item.category === categoryFilter;
      })
      .filter((item) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          (item.name && item.name.toLowerCase().includes(query)) ||
          (item.category && item.category.toLowerCase().includes(query)) ||
          (item.location && item.location.toLowerCase().includes(query))
        );
      });
    set({ filteredInventory: filtered });
  },
}));
