import { useDebounce } from "@/composables/useDebounce";

export function useProductFilters(loadData, setProducts) {
  const performSearch = async () => {
    const results = await loadData();
    setProducts(results);
  };

  const { debounced: debouncedPerformSearch } = useDebounce(performSearch, 300);

  return {
    performSearch,
    debouncedPerformSearch,
  };
}
