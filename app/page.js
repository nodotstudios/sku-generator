"use client";

import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export default function SkuGenerator() {
  const [product, setProduct] = useState(""); // was collection
  const [year, setYear] = useState(""); // optional
  const [attribute3, setAttribute3] = useState(""); // was article (optional)
  const [sizes, setSizes] = useState([]);
  const [generated, setGenerated] = useState([]);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // rule: "rule1" or "rule2"
  const [rule, setRule] = useState("rule1");
  const [separator, setSeparator] = useState("-"); // -, :, /
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

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

  // Helper text processors
  const firstNLettersOfFirstWord = (text, n) => {
    if (!text) return "";
    const firstWord = text.trim().split(/\s+/)[0] || "";
    return firstWord.substring(0, n);
  };

  const firstLetterOfFirstNWords = (text, n) => {
    if (!text) return "";
    const words = text.trim().split(/\s+/).slice(0, n);
    return words.map((w) => (w[0] || "")).join("");
  };

  // Build code for product taking into account year logic
  const buildProductCode = (prod, yearVal, ruleSel) => {
    if (!prod) return "";
    if (ruleSel === "rule1") {
      // first 3 letters from first word (or fewer)
      const code = firstNLettersOfFirstWord(prod, 3);
      return yearVal ? `${code}${String(yearVal).slice(-2)}` : code;
    } else {
      // rule2: first letter of up to first 3 words, then append year if present
      const code = firstLetterOfFirstNWords(prod, 3);
      return yearVal ? `${code}${String(yearVal).slice(-2)}` : code;
    }
  };

  const buildAttrCode = (text, ruleSel) => {
    if (!text) return "";
    if (ruleSel === "rule1") {
      // first 3 letters of first word
      return firstNLettersOfFirstWord(text, 3);
    } else {
      // first letter of up to first 3 words
      return firstLetterOfFirstNWords(text, 3);
    }
  };

  const generateSKU = () => {
    // Validation: product required, at least one size
    if (!product || sizes.length === 0) {
      setError("⚠️ Please provide Product name and select at least one size.");
      return;
    }
    setError("");

    const prodCode = buildProductCode(product, year, rule).toUpperCase();
    const attr3Code = buildAttrCode(attribute3, rule).toUpperCase();

    // Assemble parts: product (with year appended if given), then attribute3 if present
    const parts = [];
    if (prodCode) parts.push(prodCode);
    if (attr3Code) parts.push(attr3Code);

    const sep = separator || "-";

    const newSkus = sizes.map((size) => {
      const code = parts.join(sep);
      const sku = code ? `${code}${sep}${size.toUpperCase()}` : size.toUpperCase(); // fallback
      return {
        sku,
        product,
        year,
        attribute3,
        size,
        rule,
        separator: sep,
      };
    });

    // Prevent duplicates
    setGenerated((prev) => {
      const existingSkus = new Set(prev.map((item) => item.sku));
      const uniqueNewSkus = newSkus.filter((item) => !existingSkus.has(item.sku));
      return [...prev, ...uniqueNewSkus];
    });

    // Clear form (leave rule & separator)
    setProduct("");
    setYear("");
    setAttribute3("");
    setSizes([]);
  };

  const deleteSKU = (index) => {
    setGenerated((prev) => prev.filter((_, i) => i !== index));
  };

  const exportCSV = () => {
    const data = generated.map(({ sku, product, year, attribute3, size, rule, separator }) => ({
      SKU: sku,
      Product: product,
      Year: year,
      Attribute3: attribute3,
      Size: size,
      Rule: rule,
      Separator: separator,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SKUs");
    XLSX.writeFile(wb, "skus.csv");
  };

  const exportExcel = () => {
    const data = generated.map(({ sku, product, year, attribute3, size, rule, separator }) => ({
      SKU: sku,
      Product: product,
      Year: year,
      Attribute3: attribute3,
      Size: size,
      Rule: rule,
      Separator: separator,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SKUs");
    XLSX.writeFile(wb, "skus.xlsx");
  };

  // Modern palettes for light & dark
  const palette = darkMode
    ? {
        pageBg: "#071130",
        surface: "#0f1724",
        muted: "#94a3b8",
        text: "#e6eef8",
        accent: "#7c3aed",
        accentHover: "#6d28d9",
        border: "#1f2937",
        subtleBg: "#0b1220",
        danger: "#ff6b6b",
      }
    : {
        pageBg: "#f8fafc",
        surface: "#ffffff",
        muted: "#475569",
        text: "#0f172a",
        accent: "#ec4899",
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
    title: { fontSize: 18, fontWeight: 800, letterSpacing: 0.6 },
    headerActions: { display: "flex", gap: 8, alignItems: "center" },
    toggleBtn: { padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.border}`, background: "transparent", color: palette.text, cursor: "pointer" },
    wrap: { display: "flex", gap: 24, padding: 24, flexWrap: "wrap" },
    left: { flex: "1 1 360px", maxWidth: 520, display: "flex", flexDirection: "column", gap: 16 },
    card: { background: palette.surface, borderRadius: 12, padding: 16, boxShadow: darkMode ? "0 8px 30px rgba(2,6,23,0.6)" : "0 6px 22px rgba(15,23,42,0.06)", border: `1px solid ${palette.border}` },
    label: { fontSize: 12, fontWeight: 700, color: palette.muted, marginTop: 6 },
    input: { width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${palette.border}`, outline: "none", background: darkMode ? palette.subtleBg : "#fff", color: palette.text, fontSize: 14 },
    checkboxRow: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 },
    btnPrimary: { padding: "10px 14px", borderRadius: 10, border: "none", background: palette.accent, color: "#fff", fontWeight: 700, cursor: "pointer" },
    btnGhost: { padding: "6px 10px", borderRadius: 8, border: `1px solid ${palette.border}`, background: "transparent", color: palette.text, cursor: "pointer" },
    rightCard: { flex: "2 1 520px", background: palette.surface, borderRadius: 12, padding: 16, boxShadow: darkMode ? "0 8px 30px rgba(2,6,23,0.6)" : "0 6px 22px rgba(15,23,42,0.06)", border: `1px solid ${palette.border}`, overflow: "hidden" },
    tableWrap: { maxHeight: "70vh", overflow: "auto", marginTop: 12 },
    table: { width: "100%", borderCollapse: "collapse", minWidth: 700, fontSize: 14 },
    th: { position: "sticky", top: 0, background: darkMode ? "#0b1220" : palette.accent, border: `1px solid ${palette.border}`, padding: 10, textAlign: "left", color: darkMode ? palette.text : "#fff", fontWeight: 700 },
    td: { border: `1px solid ${palette.border}`, padding: 10, color: palette.text },
    footer: { padding: 12, textAlign: "center", color: palette.muted, fontSize: 13, marginTop: 18 },
    danger: { color: palette.danger, fontSize: 13, marginTop: 6 },
    helper: { fontSize: 13, color: palette.muted },
    smallNote: { fontSize: 12, color: palette.muted, marginTop: 6 },
    radioRow: { display: "flex", gap: 12, alignItems: "center", marginTop: 8 },
  };

  // Examples shown in modal for the chosen rule
  const ruleExamples = {
    rule1: {
      title: "Rule 1 — first 3 letters from first word (per attribute). Year added to product code",
      examples: [
        { input: { product: "Fall Winter", year: "2024", attribute3: "Denim Jacket" }, output: "Fal24-Den" },
        { input: { product: "Summer", year: "", attribute3: "Basic Tee" }, output: "Sum-Bas" },
      ],
      note:
        "Rule 1: For each attribute we take the first 3 letters of the first word only. If year is provided, its last 2 digits are appended directly to the product code.",
    },
    rule2: {
      title: "Rule 2 — first letters of up to first 3 words (per attribute). Year added to product code",
      examples: [
        { input: { product: "Fall Winter Collection", year: "2024", attribute3: "Denim Jacket" }, output: "FWC24-DJ" },
        { input: { product: "Summer", year: "", attribute3: "Basic Tee Long" }, output: "S-BTL" },
      ],
      note:
        "Rule 2: For each attribute we take the first letter of each of the first up to 3 words and join them. If year is provided, its last 2 digits are appended directly to the product code.",
    },
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
          <div style={styles.title}>SKU GENERATOR</div>
          <div style={styles.helper}>for clothing brands · Nodot Studios</div>
        </div>

        <div style={styles.headerActions}>
          <button
            onClick={() => setShowHowTo(true)}
            title="How to use"
            style={{ ...styles.toggleBtn, marginRight: 8 }}
          >
            ❔ How to use
          </button>

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

      {/* Main */}
      <main style={styles.wrap}>
        {/* Left column */}
        <div style={styles.left}>
          <div style={styles.card}>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={styles.label}>Product Name (required)</div>
                <input
                  style={styles.input}
                  placeholder="e.g. Fall Winter"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>

              <div>
                <div style={styles.label}>Year (optional)</div>
                <input
                  style={styles.input}
                  placeholder="e.g. 2025 (optional)"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  inputMode="numeric"
                />
                <div style={styles.smallNote}>If provided, last two digits are appended to the product code per rule.</div>
              </div>

              <div>
                <div style={styles.label}>Attribute 3 (Other info — optional)</div>
                <input
                  style={styles.input}
                  placeholder="e.g. Denim Jacket or Collection name"
                  value={attribute3}
                  onChange={(e) => setAttribute3(e.target.value)}
                />
              </div>

              <div>
                <div style={styles.label}>Separator</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => setSeparator("-")} style={{ ...(separator === "-" ? styles.btnPrimary : styles.btnGhost) }}>-</button>
                  <button onClick={() => setSeparator(":")} style={{ ...(separator === ":" ? styles.btnPrimary : styles.btnGhost) }}>:</button>
                  <button onClick={() => setSeparator("/")} style={{ ...(separator === "/" ? styles.btnPrimary : styles.btnGhost) }}>/</button>
                </div>
                <div style={styles.smallNote}>Choose how parts will be separated in the SKU.</div>
              </div>

              <div>
                <div style={styles.label}>Rule</div>
                <div style={styles.radioRow}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input type="radio" name="rule" value="rule1" checked={rule === "rule1"} onChange={() => setRule("rule1")} />
                    Rule 1
                  </label>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input type="radio" name="rule" value="rule2" checked={rule === "rule2"} onChange={() => setRule("rule2")} />
                    Rule 2
                  </label>
                  <button onClick={() => setShowRuleModal(true)} style={{ ...styles.btnGhost, marginLeft: 8 }}>What’s the difference?</button>
                </div>
              </div>

              <div>
                <div style={styles.label}>Sizes</div>
                <div style={styles.checkboxRow}>
                  {allSizes.map((s) => (
                    <label key={s} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={sizes.includes(s)} onChange={() => toggleSize(s)} />
                      <span style={{ color: palette.text }}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <div style={styles.danger}>{error}</div>}

              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button style={styles.btnPrimary} onClick={generateSKU}>Generate SKU</button>
                <button
                  style={styles.btnGhost}
                  onClick={() => {
                    setProduct("");
                    setYear("");
                    setAttribute3("");
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
                Providing 360 solutions to aspiring clothing brands — Design Services, Tech Packs, Web Development, E-com Shoots, Launch and growth planning.
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
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>Year</th>
                  <th style={styles.th}>Attribute 3</th>
                  <th style={styles.th}>Size</th>
                  <th style={styles.th}>Rule</th>
                  <th style={styles.th}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {generated.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: "center", padding: 24, color: palette.muted }}>
                      No SKUs yet — add Product name and choose sizes, then click “Generate SKU”.
                    </td>
                  </tr>
                )}

                {generated.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 ? "transparent" : (darkMode ? "#071528" : "#fbfdff") }}>
                    <td style={{ ...styles.td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{row.sku}</td>
                    <td style={styles.td}>{row.product}</td>
                    <td style={styles.td}>{row.year}</td>
                    <td style={styles.td}>{row.attribute3}</td>
                    <td style={styles.td}>{row.size}</td>
                    <td style={styles.td}>{row.rule}</td>
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

      {/* Rule modal */}
      {showRuleModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000
        }}>
          <div style={{ width: 720, maxWidth: "94%", borderRadius: 12, padding: 18, background: palette.surface, border: `1px solid ${palette.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>{ruleExamples[rule].title}</h3>
              <div>
                <button onClick={() => setShowRuleModal(false)} style={styles.btnGhost}>Close</button>
              </div>
            </div>

            <p style={{ color: palette.muted, marginBottom: 10 }}>{ruleExamples[rule].note}</p>

            <div style={{ display: "grid", gap: 8 }}>
              {ruleExamples[rule].examples.map((ex, idx) => {
                const inp = ex.input;
                // compute produced output via our logic to show exact result
                const produced = (() => {
                  const p = buildProductCode(inp.product, inp.year, rule).toUpperCase();
                  const a = buildAttrCode(inp.attribute3, rule).toUpperCase();
                  const sep = "-";
                  const parts = [];
                  if (p) parts.push(p);
                  if (a) parts.push(a);
                  return parts.join(sep);
                })();

                return (
                  <div key={idx} style={{ padding: 10, borderRadius: 8, background: darkMode ? "#071528" : "#fbfdff", border: `1px solid ${palette.border}` }}>
                    <div style={{ fontSize: 13, color: palette.muted }}>
                      Input:
                      <span style={{ marginLeft: 8, color: palette.text }}>{`Product: "${inp.product}" ${inp.year ? `| Year: ${inp.year}` : ""} ${inp.attribute3 ? `| Attribute3: "${inp.attribute3}"` : ""}`}</span>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <strong>Example output:</strong>
                      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", marginTop: 6 }}>{produced}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* How-to modal */}
      {showHowTo && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000
        }}>
          <div style={{ width: 680, maxWidth: "96%", borderRadius: 12, padding: 18, background: palette.surface, border: `1px solid ${palette.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>How to use SKU Generator</h3>
              <div>
                <button onClick={() => setShowHowTo(false)} style={styles.btnGhost}>Close</button>
              </div>
            </div>

            <ol style={{ color: palette.muted, paddingLeft: 18 }}>
              <li>Enter <strong>Product Name</strong> (required).</li>
              <li>Year is optional — if you add it, the last 2 digits will be appended to the product code.</li>
              <li>Attribute 3 is optional — add any extra info (e.g. "Denim Jacket").</li>
              <li>Choose a <strong>separator</strong> (-, :, /) used across the SKU parts.</li>
              <li>Select a <strong>rule</strong> to decide how codes are extracted from the attributes. Click "What's the difference?" for examples.</li>
              <li>Select sizes and click <strong>Generate SKU</strong>. SKUs will be stored in your browser (localStorage).</li>
              <li>Export CSV/Excel from the top-right to download the list.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
