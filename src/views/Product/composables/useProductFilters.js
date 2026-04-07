import { useDebounce } from "@/composables/useDebounce";

export function useProductFilters(loadData) {
  const performSearch = async () => {
    await loadData();
  };

  const { debounced: debouncedPerformSearch } = useDebounce(performSearch, 300);

  return {
    performSearch,
    debouncedPerformSearch,
  };
}
