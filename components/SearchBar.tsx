"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import SearchResults from "./SearchResults";
import { useAppKitAccount } from "@reown/appkit/react";

export default function SearchBar() {
  const { address } = useAppKitAccount();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function performSearch() {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}&currentUser=${address}`
        );
        const data = await response.json();
        setResults(data.users);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      }
    }

    performSearch();
  }, [debouncedQuery, address]);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-[300px]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-4 rounded-full"
        />
      </div>
      
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-1 w-full bg-background border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
          <SearchResults 
            results={results} 
            onClose={() => {
              setIsOpen(false);
              setQuery("");
            }}
          />
        </div>
      )}
    </div>
  );
}