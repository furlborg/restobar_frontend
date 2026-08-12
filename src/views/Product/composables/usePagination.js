import { ref, computed } from "vue";

export function usePagination(fetchFn, initialPageSize = 10) {
  const search = ref("");
  const category = ref(null);
  const affectation = ref(null);
  const show_disabled = ref(false);
  const page = ref(1);
  const pageSize = ref(initialPageSize);
  const total = ref(0);
  const offset = ref(0);
  const loading = ref(false);
  const items = ref([]);

  // Calcula el número total de páginas.
  const pageCount = computed(() => {
    if (total.value === 0) return 1;
    const count = Math.ceil(total.value / pageSize.value);
    return count === 0 ? 1 : count;
  });

  // Función que realiza la petición de datos con los parámetros.
  const fetchData = async () => {
    loading.value = true;
    try {
      const response = await fetchFn({
        search: search.value,
        category: category.value,
        affectation: affectation.value,
        show_disabled: show_disabled.value,
        limit: pageSize.value,
        offset: (page.value - 1) * pageSize.value,
      });

      total.value = response.data.count;
      items.value = response.data.results;
      return items.value;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // Función para cambiar de página.
  const onChange = async (newPage) => {
    page.value = newPage;
    await fetchData();
  };

  // Función para cambiar el tamaño de página.
  const onPageSizeChange = async (newPageSize) => {
    pageSize.value = newPageSize;
    page.value = 1;
    await fetchData();
  };

  const setTotal = (newTotal) => {
    total.value = newTotal;
  };

  const reset = () => {
    page.value = 1;
    pageSize.value = initialPageSize;
    total.value = 0;
    search.value = "";
    category.value = null;
    affectation.value = null;
    show_disabled.value = false;
  };

  // Función para actualizar los parámetros de búsqueda y reiniciar la página.
  const setSearchParams = (newSearch, newCategory, newAffectation, newShowDisabled) => {
    search.value = newSearch;
    category.value = newCategory;
    affectation.value = newAffectation;
    show_disabled.value = newShowDisabled;
    page.value = 1; // Reinicia a la primera página al cambiar los parámetros.
  };

  // Método para cargar los datos manualmente.
  const loadData = async () => {
    await fetchData();
    return items.value;
  };

  const pagination = {
    get page() {
      return page.value;
    },
    get pageCount() {
      return pageCount.value;
    },
    get pageSize() {
      return pageSize.value;
    },
    get total() {
      return total.value;
    },
    get offset() {
      return offset.value;
    },
    pageSizes: [10, 25, 50, 100],
    showSizePicker: true,
    onChange,
    onPageSizeChange,
  };

  return {
    // Estados
    search,
    category,
    affectation,
    show_disabled,
    page,
    pageSize,
    total,
    offset,
    loading,
    items,
    pageCount,
    // Mètodos
    setSearchParams,
    loadData,
    setTotal,
    reset,
    pagination,
  };
}
