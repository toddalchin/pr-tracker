'use client';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterOptions: string[];
  searchPlaceholder?: string;
  filterLabel?: string;
}

export default function SearchFilter({
  searchTerm,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions,
  searchPlaceholder = "Search...",
  filterLabel = "Filter"
}: SearchFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
          Search
        </label>
        <input
          type="text"
          id="search"
          placeholder={searchPlaceholder}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      {filterOptions.length > 0 && (
        <div className="w-full md:w-64">
          <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
            {filterLabel}
          </label>
          <select
            id="filter"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            <option value="">All {filterLabel}s</option>
            {filterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
} 