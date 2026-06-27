import { useState, useEffect, useRef } from 'react';

export default function LocationSearch({ onLocationSelect, className = "" }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for Nominatim API
  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Restrict to Mumbai using bounding box [min_lon, min_lat, max_lon, max_lat]
        // Mumbai is roughly [72.7, 18.8, 73.1, 19.3]
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query + ', Mumbai'
        )}&format=json&addressdetails=1&limit=6&viewbox=72.7,18.8,73.1,19.3&bounded=1`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Urban-Heat-Mitigation-Mumbai-Dashboard'
          }
        });

        if (!response.ok) {
          throw new Error('Nominatim API error');
        }

        const data = await response.json();
        
        // Format names to be shorter and cleaner
        const formatted = data.map(item => {
          // Clean up address components for nicer display
          const parts = item.display_name.split(',');
          // Combine first 2-3 parts (e.g. Bandra East, Mumbai)
          const name = parts.slice(0, 3).join(',').trim();
          return {
            id: item.place_id,
            name: name,
            fullName: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type,
            class: item.class
          };
        });

        setSuggestions(formatted);
        setIsOpen(formatted.length > 0);
      } catch (error) {
        console.error('Geocoding suggestions error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (item) => {
    setQuery(item.name);
    setIsOpen(false);
    setActiveIndex(-1);
    if (onLocationSelect) {
      onLocationSelect({
        lat: item.lat,
        lng: item.lng,
        name: item.name,
        fullName: item.fullName
      });
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div ref={containerRef} className={`relative w-full max-w-xl mx-auto ${className}`}>
      {/* Search Input Container */}
      <div className="relative flex items-center bg-white/70 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-800/60 shadow-lg rounded-xl overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50">
        
        {/* Search Icon */}
        <div className="absolute left-4 text-gray-400 dark:text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="🔍 Search locations in Mumbai (e.g. Ghatkopar, Bandra)..."
          className="w-full pl-11 pr-12 py-3.5 bg-transparent border-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-0"
        />

        {/* Action Indicators (Loader / Clear Button) */}
        <div className="absolute right-4 flex items-center gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          {query && (
            <button 
              onClick={clearSearch}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden divide-y divide-gray-100 dark:divide-gray-800/50">
          {suggestions.map((item, index) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`px-4 py-3 cursor-pointer text-xs sm:text-sm flex items-start gap-2.5 transition-colors ${
                index === activeIndex
                  ? 'bg-emerald-50/75 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40'
              }`}
            >
              <span className="mt-0.5 text-gray-400 dark:text-gray-500 text-sm">📍</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.name}</div>
                <div className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                  {item.fullName}
                </div>
              </div>
              {item.type && (
                <span className="text-[9px] uppercase px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded tracking-wider self-center shrink-0">
                  {item.type}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
