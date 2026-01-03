import { create } from 'zustand';
import { InventoryItem } from './inventory-data';

interface OptionData {
  id: string;
  name: string;
}

interface InventoryState {
  // State
  inventory: InventoryItem[];
  categories: OptionData[];
  statuses: OptionData[];
  locations: OptionData[];
  searchQuery: string;
  categoryFilter: string;
  filteredInventory: InventoryItem[];
  sortColumn: keyof InventoryItem | null;
  sortDirection: 'asc' | 'desc' | null;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  selectedItems: string[]; // To store IDs of selected items

  // Actions
  initializeData: (data: {
    inventory: InventoryItem[];
    categories: OptionData[];
    statuses: OptionData[];
    locations: OptionData[];
  }) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  setSort: (column: keyof InventoryItem, direction: 'asc' | 'desc') => void;
  setCurrentPage: (page: number) => void;
  toggleItemSelection: (itemId: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
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
  sortColumn: null,
  sortDirection: null,
  currentPage: 1,
  itemsPerPage: 10, // Default items per page
  totalPages: 1,
  selectedItems: [],

  // Action to initialize data from server
  initializeData: (data) => {
    set({
      inventory: data.inventory,
      categories: data.categories,
      statuses: data.statuses,
      locations: data.locations,
      selectedItems: [], // Clear selection on new data
    });
    // Reset to first page when data is initialized
    set({ currentPage: 1 });
    get()._filterInventory(); // Re-apply filters and sorts after initialization
  },

  // Action to update search query
  setSearchQuery: (query) => {
    set({ searchQuery: query, selectedItems: [] });
    set({ currentPage: 1 }); // Reset to first page on search
    get()._filterInventory();
  },

  // Action to update category filter
  setCategoryFilter: (category) => {
    set({ categoryFilter: category, selectedItems: [] });
    set({ currentPage: 1 }); // Reset to first page on filter change
    get()._filterInventory();
  },

  // Action to set sort column and direction
  setSort: (column, direction) => {
    set({ sortColumn: column, sortDirection: direction });
    set({ currentPage: 1 }); // Reset to first page on sort change
    get()._filterInventory();
  },

  // Action to set current page
  setCurrentPage: (page) => {
    set({ currentPage: page });
    get()._filterInventory(); // Re-apply filters/sorts to get correct page data
  },
  
  // Action to toggle selection for a single item
  toggleItemSelection: (itemId: string) => {
    set((state) => {
      const selectedItems = state.selectedItems.includes(itemId)
        ? state.selectedItems.filter((id) => id !== itemId)
        : [...state.selectedItems, itemId];
      return { selectedItems };
    });
  },

  // Action to toggle select all currently filtered items
  toggleSelectAll: () => {
    set((state) => {
      const filteredIds = state.filteredInventory.map((item) => item.id);
      const allSelected = filteredIds.every((id) => state.selectedItems.includes(id));
      if (allSelected) {
        return { selectedItems: state.selectedItems.filter(id => !filteredIds.includes(id)) };
      } else {
        const newSelection = [...new Set([...state.selectedItems, ...filteredIds])];
        return { selectedItems: newSelection };
      }
    });
  },

  // Action to clear selection
  clearSelection: () => {
    set({ selectedItems: [] });
  },

  // Internal action to perform filtering, sorting, and pagination
  _filterInventory: () => {
    const { inventory, searchQuery, categoryFilter, sortColumn, sortDirection, currentPage, itemsPerPage } = get();
    let processedInventory = [...inventory]; // Create a mutable copy

    // 1. Filtering
    processedInventory = processedInventory
      .filter(item => {
        if (categoryFilter === 'all') return true;
        return item.categoryId === categoryFilter;
      })
      .filter((item) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          (item.name && item.name.toLowerCase().includes(query)) ||
          (item.categoryName && item.categoryName.toLowerCase().includes(query)) ||
          (item.locationName && item.locationName.toLowerCase().includes(query))
        );
      });

    // 2. Sorting
    if (sortColumn && sortDirection) {
      processedInventory.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        // Handle null/undefined values consistently
        if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
        if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue, undefined, { sensitivity: 'base' })
            : bValue.localeCompare(aValue, undefined, { sensitivity: 'base' });
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        // Fallback for other types or if types mismatch
        return 0;
      });
    }

    // 3. Pagination
    const totalItems = processedInventory.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage)); // Ensure at least 1 page

    // Adjust currentPage if it's out of bounds after filtering/sorting
    let newCurrentPage = currentPage;
    if (newCurrentPage > totalPages) {
      newCurrentPage = totalPages;
    }
    if (newCurrentPage < 1 && totalItems > 0) { // If no items, currentPage can remain 1
      newCurrentPage = 1;
    }
    set({ currentPage: newCurrentPage, totalPages: totalPages });


    const startIndex = (newCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedInventory = processedInventory.slice(startIndex, endIndex);

    set({ filteredInventory: paginatedInventory });
  },
}));
