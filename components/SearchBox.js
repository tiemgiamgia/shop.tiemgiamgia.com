"use client";

import { useEffect, useState } from "react";

export default function SearchBox() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {

    if (!query) {
      setResults([]);
      return;
    }

    const runSearch = async () => {

      const q = query.toLowerCase();
      const found = [];

      let page = 1;

      while (found.length < 10) {

        try {

          const res = await fetch(`/data/search/${page}.json`);

          if (!res.ok) break;

          const chunk = await res.json();

          const filtered = chunk.filter(p =>
            p.title.toLowerCase().includes(q)
          );

          found.push(...filtered);

          page++;

        } catch {
          break;
        }
      }

      setResults(found.slice(0, 10));
    };

    const timer = setTimeout(runSearch, 200); // debounce nhẹ

    return () => clearTimeout(timer);

  }, [query]);

  return (
    <div className="search">

      <input
        placeholder="Tìm sản phẩm..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {!!results.length && (
        <div className="search-results">
          {results.map(p => (
            <a
              key={p.sku}
              href={`/${p.slug}-${p.sku}`}
            >
              {p.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}