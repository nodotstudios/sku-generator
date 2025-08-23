"use client";

import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export default function SkuGenerator() {
  const [collection, setCollection] = useState("");
  const [year, setYear] = useState("");
  const [article, setArticle] = useState("");
  const [color, setColor] = useState("");
  const [sizes, setSizes] = useState([]);
  const [generated, setGenerated] = useState([]);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // load theme + skus on mount
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) {
        setDarkMode(storedTheme === "dark");
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setDarkMode(true);
      }

      const stored = JSON.parse(localStorage.getItem("skus") || "[]");
      setGenerated(stored);
    } catch (e) {
      // ignore JSON errors
      setGenerated([]);
    }
  }, []);

  // persist skus
  useEffect(() => {
    try {
      localStorage.setItem("skus", JSON.stringify(generated));
    } catch (e) {}
  }, [generated]);

  // persist theme
  useEffect(() => {
    try {
      localStorage.setItem("theme", darkMode ? "dark" : "light");
    } catch (e) {}
  }, [darkMode]);

  const allSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  const toggleSize = (size) => {
    setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  };

  const generateSKU = () => {
    if (!collection || !year || !article || !color || sizes.length === 0) {
      setError("⚠️ Please fill all fields and select at least one size.");
      return;
    }
    setError("");

    const collectionCode = collection.split(" ").map((w) => w[0] || "").join("").toUpperCase();
    const yearCode = String(year).slice(-2);
    const articleCode = article.split(" ").map((w) => w[0] || "").join("").substring(0, 4).toUpperCase();
    const colorCode = color.toUpperCase();

    const newSkus = sizes.map((size) => ({
      sku: `${collectionCode}-${yearCode}-${articleCode}-${colorCode}-${size.toUpperCase()}`,
      collection,
      year,
      article,
      color,
      size,
    }));

    setGenerated((prev) => {
      const existingSkus = new Set(prev.map((item) => item.sku));
      const uniqueNewSkus = newSkus.filter((item) => !existingSkus.has(item.sku));
      return [...prev, ...uniqueNewSkus];
    });

    // clear form
    setCollection("");
    setYear("");
    setArticle("");
    setColor("");
    setSizes([]);
  };

  const deleteSKU = (index) => {
    setGenerated((prev) => prev.filter((_, i) => i !== index));
  };

  const exportCSV = () => {
    const data = generated.map(({ sku, collection, year, article, color, size }) => ({
      SKU: sku,
      Collection: collection,
      Year: year,
      Article: article,
      Color: color,
      Size: size,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SKUs");
    XLSX.writeFile(wb, "skus.csv");
  };

  const exportExcel = () => {
    const data = generated.map(({ sku, collection, year, article, color, size }) => ({
      SKU: sku,
      Collection: collection,
      Year: year,
      Article: article,
      Color: color,
      Size: size,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SKUs");
    XLSX.writeFile(wb, "skus.xlsx");
  };

  // Modern palettes for light & dark
  const palette = darkMode
    ? {
        pageBg: "#071130", // deep indigo/near-black
        surface: "#0f1724", // dark card
        muted: "#94a3b8", // slate-400
        text: "#e6eef8", // soft white
        accent: "#7c3aed", // indigo-500
        accentHover: "#6d28d9",
        border: "#1f2937",
        subtleBg: "#0b1220",
        danger: "#ff6b6b",
      }
    : {
        pageBg: "#f8fafc", // very light
        surface: "#ffffff", // white
        muted: "#475569", // slate-600
        text: "#0f172a", // slate-900
        accent: "#ec4899", // pink-500
        accentHover: "#db2777",
        border: "#e6e9ee",
        subtleBg: "#f1f5f9",
        danger: "#dc2626",
      };

  const styles = {
    page: {
      minHeight: "100vh",
      background: palette.pageBg,
      display: "flex",
      flexDirection: "column",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      color: palette.text,
      paddingBottom: 24,
    },
    header: {
      padding: "18px 24px",
      background: palette.surface,
      borderBottom: `1px solid ${palette.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      boxShadow: darkMode ? "0 4px 18px rgba(2,6,23,0.6)" : "0 2px 8px rgba(15,23,42,0.04)",
    },
    title: {
      fontSize: 18,
      fontWeight: 800,
      letterSpacing: 0.6,
    },
    headerActions: {
      display: "flex",
      gap: 8,
      alignItems: "center",
    },
    toggleBtn: {
      padding: "8px 12px",
      borderRadius: 10,
      border: `1px solid ${palette.border}`,
      background: "transparent",
      color: palette.text,
      cursor: "pointer",
    },
    wrap: {
      display: "flex",
      gap: 24,
      padding: 24,
      flexWrap: "wrap",
    },
    left: { flex: "1 1 360px", maxWidth: 520, display: "flex", flexDirection: "column", gap: 16 },
    card: {
      background: palette.surface,
      borderRadius: 12,
      padding: 16,
      boxShadow: darkMode ? "0 8px 30px rgba(2,6,23,0.6)" : "0 6px 22px rgba(15,23,42,0.06)",
      border: `1px solid ${palette.border}`,
    },
    label: { fontSize: 12, fontWeight: 700, color: palette.muted, marginTop: 6 },
    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 10,
      border: `1px solid ${palette.border}`,
      outline: "none",
      background: darkMode ? palette.subtleBg : "#fff",
      color: palette.text,
      fontSize: 14,
    },
    checkboxRow: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 },
    btnPrimary: {
      padding: "10px 14px",
      borderRadius: 10,
      border: "none",
      background: palette.accent,
      color: "#fff",
      fontWeight: 700,
      cursor: "pointer",
    },
    btnGhost: {
      padding: "6px 10px",
      borderRadius: 8,
      border: `1px solid ${palette.border}`,
      background: "transparent",
      color: palette.text,
      cursor: "pointer",
    },
    rightCard: {
      flex: "2 1 520px",
      background: palette.surface,
      borderRadius: 12,
      padding: 16,
      boxShadow: darkMode ? "0 8px 30px rgba(2,6,23,0.6)" : "0 6px 22px rgba(15,23,42,0.06)",
      border: `1px solid ${palette.border}`,
      overflow: "hidden",
    },
    tableWrap: { maxHeight: "70vh", overflow: "auto", marginTop: 12 },
    table: { width: "100%", borderCollapse: "collapse", minWidth: 700, fontSize: 14 },
    th: {
      position: "sticky",
      top: 0,
      background: darkMode ? "#0b1220" : palette.accent,
      border: `1px solid ${palette.border}`,
      padding: 10,
      textAlign: "left",
      color: darkMode ? palette.text : "#fff",
      fontWeight: 700,
    },
    td: { border: `1px solid ${palette.border}`, padding: 10, color: palette.text },
    footer: { padding: 12, textAlign: "center", color: palette.muted, fontSize: 13, marginTop: 18 },
    danger: { color: palette.danger, fontSize: 13, marginTop: 6 },
    helper: { fontSize: 13, color: palette.muted },
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
          <div style={styles.title}>SKU GENERATOR</div>
          <div style={styles.helper}>for clothing brands · Nodot Studios</div>
        </div>

        <div style={styles.headerActions}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                // quick demo accent color cycle (optional)
                /* NO-OP: keeping header minimal */
              }}
              style={{ ...styles.btnGhost, display: "none" }}
            >
              demo
            </button>
          </div>

          <button
            onClick={() => setDarkMode((v) => !v)}
            aria-label="Toggle theme"
            style={styles.toggleBtn}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "🌞 Light" : "🌙 Dark"}
          </button>
        </div>
      </header>

      <main style={styles.wrap}>
        {/* Left Form */}
        <div style={styles.left}>
          <div style={styles.card}>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={styles.label}>Collection Name</div>
                <input
                  style={styles.input}
                  placeholder="e.g. Fall Winter"
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                />
              </div>

              <div>
                <div style={styles.label}>Year</div>
                <input
                  style={styles.input}
                  placeholder="e.g. 2025"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              <div>
                <div style={styles.label}>Article Name</div>
                <input
                  style={styles.input}
                  placeholder="e.g. Denim Jacket"
                  value={article}
                  onChange={(e) => setArticle(e.target.value)}
                />
              </div>

              <div>
                <div style={styles.label}>Colour</div>
                <input
                  style={styles.input}
                  placeholder="e.g. Blue"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>

              <div>
                <div style={styles.label}>Sizes</div>
                <div style={styles.checkboxRow}>
                  {allSizes.map((s) => (
                    <label key={s} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={sizes.includes(s)}
                        onChange={() => toggleSize(s)}
                      />
                      <span style={{ color: palette.text }}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <div style={styles.danger}>{error}</div>}

              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button style={styles.btnPrimary} onClick={generateSKU}>
                  Generate SKU
                </button>
                <button
                  style={{ ...styles.btnGhost }}
                  onClick={() => {
                    // reset form only
                    setCollection("");
                    setYear("");
                    setArticle("");
                    setColor("");
                    setSizes([]);
                    setError("");
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={styles.card}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Nodot Studios</h3>
              <p style={{ marginTop: 8, color: palette.muted }}>
                Providing 360 solutions to aspiring clothing brands — Design Services, Tech Packs, Web Development, E-com Shoots,
                Launch and growth planning.
              </p>
              <p style={{ marginTop: 8, color: palette.muted }}>
                Contact: <strong style={{ color: palette.text }}>Contact@nodotstudios.com</strong>
              </p>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <a href="https://instagram.com/nodotstudios" target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: "none" }}>
                <div style={{ ...styles.card, textAlign: "center", padding: 12, cursor: "pointer" }}>Instagram</div>
              </a>
              <a href="https://nodotstudios.com" target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: "none" }}>
                <div style={{ ...styles.card, textAlign: "center", padding: 12, cursor: "pointer" }}>Website</div>
              </a>
            </div>
          </div>
        </div>

        {/* Right Table */}
        <div style={styles.rightCard}>
          <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Generated SKUs ({generated.length})</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={styles.btnGhost} onClick={exportCSV}>Export CSV</button>
              <button style={styles.btnGhost} onClick={exportExcel}>Export Excel</button>
            </div>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>SKU</th>
                  <th style={styles.th}>Collection</th>
                  <th style={styles.th}>Year</th>
                  <th style={styles.th}>Article</th>
                  <th style={styles.th}>Color</th>
                  <th style={styles.th}>Size</th>
                  <th style={styles.th}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {generated.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: "center", padding: 24, color: palette.muted }}>
                      No SKUs yet — add details on the left and click “Generate SKU”.
                    </td>
                  </tr>
                )}

                {generated.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 ? "transparent" : (darkMode ? "#071528" : "#fbfdff") }}>
                    <td style={{ ...styles.td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{row.sku}</td>
                    <td style={styles.td}>{row.collection}</td>
                    <td style={styles.td}>{row.year}</td>
                    <td style={styles.td}>{row.article}</td>
                    <td style={styles.td}>{row.color}</td>
                    <td style={styles.td}>{row.size}</td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      <button style={styles.btnGhost} onClick={() => deleteSKU(i)}>❌</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        Powered by <strong>Nodot Studios</strong>
      </footer>
    </div>
  );
}
