"use client";

import { useEffect, useState } from "react";

export default function SearchBox() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/data/search.json")
      .then(res => res.json())
      .then(setData);
  }, []);

  useEffect(() => {

    if (!query) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();

    const filtered = data
      .filter(p => p.title.toLowerCase().includes(q))
      .slice(0, 10);

    setResults(filtered);

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