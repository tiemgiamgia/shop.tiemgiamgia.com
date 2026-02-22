"use client";

import { useState, useEffect } from "react";
import data from "@/public/data/search.json";

function normalize(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

/* 🔥 Ranking giống Shopee */

function score(item, keyword) {
  if (item.t.startsWith(keyword)) return 100;
  if (item.t.includes(" " + keyword)) return 60;
  if (item.t.includes(keyword)) return 30;
  return 0;
}

function rankedSearch(keyword) {
  const ranked = [];

  for (const item of data) {
    const s = score(item, keyword);

    if (s > 0) {
      ranked.push({ ...item, s });

      if (ranked.length >= 40) break;   // 🔥 chống lag
    }
  }

  ranked.sort((a, b) => b.s - a.s);

  return ranked.slice(0, 12);
}

/* 🔥 Highlight */

function highlight(text, keyword) {
  const regex = new RegExp(`(${keyword})`, "gi");
  return text.replace(regex, "<b>$1</b>");
}

export default function SearchBox() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  /* 🔥 Debounce */

  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    const timer = setTimeout(() => {
      const k = normalize(keyword);
      const r = rankedSearch(k);

      setResults(r);
      setLoading(false);
    }, 120); // Shopee-feel delay

    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <div className="search-wrapper">

      <input
        className="search-input"
        placeholder="Tìm sản phẩm..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {(loading || results.length > 0) && (
        <div className="search-dropdown">

          {loading && (
            <div className="search-loading">
              Đang tìm...
            </div>
          )}

          {!loading &&
            results.map((p) => (
              <a
                key={p.slug + p.sku}
                href={`/${p.slug}-${p.sku}/`}
                className="search-item"
                dangerouslySetInnerHTML={{
                  __html: highlight(p.title, keyword),
                }}
              />
            ))}

          {!loading && results.length === 0 && (
            <div className="search-empty">
              Không tìm thấy
            </div>
          )}
        </div>
      )}
    </div>
  );
}
