"use client";

import { useState, useEffect } from "react";

export default function SearchBox() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {

    if (!query) {
      setResults([]);
      return;
    }

    fetch("/data/search.json")
      .then(res => res.json())
      .then(data => {

        const q = query.toLowerCase();

        const filtered = data
          .filter(p => p.title.toLowerCase().includes(q))
          .slice(0, 10);

        setResults(filtered);
      });

  }, [query]);

  return (
    <div className="search-box">

      <input
        placeholder="Tìm sản phẩm..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {results.length > 0 && (
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