import { useState, useMemo } from 'react';

interface UseSearchProps<T> {
  data: T[];
  searchFields?: (keyof T)[];
  filterField?: keyof T;
}

export function useSearch<T extends Record<string, unknown>>({
  data,
  searchFields,
  filterField
}: UseSearchProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('');

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search logic
      const matchesSearch = searchTerm === '' || 
        (searchFields ? 
          searchFields.some(field => 
            String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
          ) :
          Object.values(item).some(value => 
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        );

      // Filter logic
      const matchesFilter = filterValue === '' || 
        (filterField ? item[filterField] === filterValue : true);

      return matchesSearch && matchesFilter;
    });
  }, [data, searchTerm, filterValue, searchFields, filterField]);

  // Get unique values for filter dropdown
  const filterOptions = useMemo(() => {
    if (!filterField) return [];
    return [...new Set(data.map(item => item[filterField]))];
  }, [data, filterField]);

  return {
    searchTerm,
    setSearchTerm,
    filterValue,
    setFilterValue,
    filteredData,
    filterOptions
  };
} 