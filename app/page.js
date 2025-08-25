"use client";

import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export default function SkuGenerator() {
  const [product, setProduct] = useState("");
  const [year, setYear] = useState("");
  const [attribute3, setAttribute3] = useState("");
  const [attribute4, setAttribute4] = useState("");
  const [sizes, setSizes] = useState([]);
  const [generated, setGenerated] = useState([]);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const [rule, setRule] = useState("rule1"); // rule1 or rule2
  const [separator, setSeparator] = useState("-");
  const [fullColor, setFullColor] = useState(false); // checkbox that forces attribute4 full
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);

  // export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState("csv"); // "csv" or "xlsx"
  const [exportFilename, setExportFilename] = useState("");

  // responsive: detect mobile to show icons only
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    function update() {
      setIsMobile(window.innerWidth < 640);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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

  const allSizes = ["3XS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

  const toggleSize = (size) => {
    setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));
  };

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

  // sanitize full attribute: remove spaces and non-alphanumeric, preserve letters+digits
  const sanitizeFull = (text) => {
    if (!text) return "";
    return text.trim().replace(/\s+/g, "").replace(/[^a-zA-Z0-9]/g, "");
  };

  const buildProductCode = (prod, yearVal, ruleSel) => {
    if (!prod) return "";
    if (ruleSel === "rule1") {
      const code = firstNLettersOfFirstWord(prod, 3);
      return yearVal ? `${code}${String(yearVal).slice(-2)}` : code;
    } else {
      // rule2 uses first letters of up to first 3 words for product
      const code = firstLetterOfFirstNWords(prod, 3);
      return yearVal ? `${code}${String(yearVal).slice(-2)}` : code;
    }
  };

  // build attribute code; attr4Full flag forces full sanitized value for attribute4
  const buildAttrCode = (text, ruleSel, attr4Full = false) => {
    if (!text) return "";
    if (attr4Full) {
      return sanitizeFull(text);
    }
    if (ruleSel === "rule1") {
      return firstNLettersOfFirstWord(text, 3);
    } else {
      // rule2 uses first letters of up to first 3 words
      return firstLetterOfFirstNWords(text, 3);
    }
  };

  const generateSKU = () => {
    if (!product || sizes.length === 0) {
      setError("⚠️ Please provide Product name and select at least one size.");
      return;
    }
    setError("");

    const prodCode = buildProductCode(product, year, rule).toUpperCase();
    const attr3Code = buildAttrCode(attribute3, rule, false).toUpperCase();
    const attr4Code = buildAttrCode(attribute4, rule, fullColor).toUpperCase(); // fullColor applied here

    const parts = [];
    if (prodCode) parts.push(prodCode);
    if (attr3Code) parts.push(attr3Code);
    if (attr4Code) parts.push(attr4Code);

    const sep = separator || "-";

    const newSkus = sizes.map((size) => {
      const code = parts.join(sep);
      const sku = code ? `${code}${sep}${size.toUpperCase()}` : size.toUpperCase();
      return {
        sku,
        product,
        year,
        attribute3,
        attribute4,
        size,
        rule,
        separator: sep,
        fullColor,
      };
    });

    setGenerated((prev) => {
      const existingSkus = new Set(prev.map((item) => item.sku));
      const uniqueNewSkus = newSkus.filter((item) => !existingSkus.has(item.sku));
      return [...prev, ...uniqueNewSkus];
    });

    // NOTE: intentionally not clearing the input fields here so user can generate multiple batches.
  };

  const deleteSKU = (index) => {
    setGenerated((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAll = () => {
    const ok = window.confirm("Delete all generated SKUs? This cannot be undone.");
    if (!ok) return;
    setGenerated([]);
    try {
      localStorage.removeItem("skus");
    } catch (e) {}
  };

  // open export modal with suggested filename
  const openExportModal = (type) => {
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    setExportType(type);
    setExportFilename(`skus-${date}`);
    setExportModalOpen(true);
  };

  // perform export using the current exportFilename and exportType, then close modal
  const doExport = () => {
    const name = (exportFilename || "skus").trim();
    if (!name) {
      alert("Please enter a filename.");
      return;
    }
    const fileBase = name;

    const data = generated.map(({ sku, product, year, attribute3, attribute4, size, rule, separator, fullColor }) => ({
      SKU: sku,
      Product: product,
      Year: year,
      Attribute3: attribute3,
      Attribute4: attribute4,
      Size: size,
      Rule: rule,
      Separator: separator,
      FullColor: fullColor ? "yes" : "no",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SKUs");

    if (exportType === "csv") {
      // write with .csv extension
      XLSX.writeFile(wb, `${fileBase}.csv`);
    } else {
      XLSX.writeFile(wb, `${fileBase}.xlsx`);
    }

    setExportModalOpen(false);
  };

  // quick direct exports (kept for compatibility) — they open the modal instead of immediately exporting
  const exportCSV = () => openExportModal("csv");
  const exportExcel = () => openExportModal("xlsx");

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
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      color: palette.text,
      paddingBottom: 24,
    },
    header: {
      padding: "14px 18px",
      background: palette.surface,
      borderBottom: `1px solid ${palette.border}`,
      display: "grid",
      gridTemplateColumns: "min-content 1fr min-content",
      alignItems: "center",
      gap: 12,
      boxShadow: darkMode ? "0 4px 18px rgba(2,6,23,0.6)" : "0 2px 8px rgba(15,23,42,0.04)",
    },
    headerLeft: { display: "flex", alignItems: "center", gap: 8 },
    headerCenter: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" },
    headerRight: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 },
    title: { fontSize: 18, fontWeight: 800, letterSpacing: 0.6 },
    subTitle: { fontSize: 12, color: palette.muted, marginTop: 4 },
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
    exportControls: { display: "flex", gap: 8, alignItems: "center" },
  };

  const ruleExamples = {
    rule1: {
      title: "Rule 1 — first 3 letters from first word (per attribute). Year added to product code",
      examples: [
        { input: { product: "Fall Winter", year: "2024", attribute3: "Denim Jacket", attribute4: "Blue Wash" } },
        { input: { product: "Summer", year: "", attribute3: "Basic Tee", attribute4: "Black" } },
      ],
      note:
        "Rule 1: For each attribute take the first 3 letters of the first word only. If year is provided, its last 2 digits are appended directly to the product code. Use the Full color checkbox to include attribute 4 in full.",
    },
    rule2: {
      title: "Rule 2 — first letters of up to first 3 words (per attribute). Year added to product code",
      examples: [
        { input: { product: "Fall Winter Collection", year: "2024", attribute3: "Denim Jacket", attribute4: "Blue Wash" } },
        { input: { product: "Summer", year: "", attribute3: "Basic Tee Long", attribute4: "Black" } },
      ],
      note:
        "Rule 2: For each attribute take the first letter of each of the first up to 3 words and join them. If year is provided, its last 2 digits are appended directly to the product code. Use the Full color checkbox to include attribute 4 in full.",
    },
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        {/* left - how to use (text on desktop, icon on mobile) */}
        <div style={styles.headerLeft}>
          <button
            onClick={() => setShowHowTo(true)}
            title="Tutorial"
            aria-label="How to use"
            style={styles.toggleBtn}
          >
            {isMobile ? "❔" : "❔ Tutorial"}
          </button>
        </div>

        {/* center - always centered */}
        <div style={styles.headerCenter}>
          <div style={{ ...styles.title, fontSize: isMobile ? 16 : 18, lineHeight: 1 }}>
            SKU GENERATOR
          </div>
          <div style={styles.subTitle}>for clothing brands by Nodot Studios</div>
        </div>

        {/* right - theme toggle (text on desktop, icon on mobile) */}
        <div style={styles.headerRight}>
          <button
            onClick={() => setDarkMode((v) => !v)}
            aria-label="Toggle theme"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            style={styles.toggleBtn}
          >
            {isMobile ? (darkMode ? "🌞" : "🌙") : (darkMode ? "🌞 Light" : "🌙 Dark")}
          </button>
        </div>
      </header>

      <main style={styles.wrap}>
        {/* Left column */}
        <div style={styles.left}>
          <div style={styles.card}>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={styles.label}>Product Name (required)</div>
                <input style={styles.input} placeholder="e.g. Oversized Tshirt" value={product} onChange={(e) => setProduct(e.target.value)} />
              </div>

              <div>
                <div style={styles.label}>Year (optional)</div>
                <input style={styles.input} placeholder="e.g. 2025 (optional)" value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" />
                <div style={styles.smallNote}>If provided, last two digits are appended to the product code per rule.</div>
              </div>

              <div>
                <div style={styles.label}>Attribute 3 (Other info — optional)</div>
                <input style={styles.input} placeholder="e.g. Denim Jacket or Collection name" value={attribute3} onChange={(e) => setAttribute3(e.target.value)} />
              </div>

              <div>
                <div style={styles.label}>Attribute 4 (Other info — optional)</div>
                <input style={styles.input} placeholder="e.g. Blue Wash Extra (color/wash/full text)" value={attribute4} onChange={(e) => setAttribute4(e.target.value)} />
                <div style={styles.smallNote}>If Full color is enabled then this field is included in full (sanitized) in the SKU.</div>
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
                  <button onClick={() => setShowRuleModal(true)} style={{ ...styles.btnGhost, marginLeft: 8 }}>Rule info</button>
                </div>
              </div>

              <div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={fullColor} onChange={(e) => setFullColor(e.target.checked)} />
                  <span style={{ color: palette.text, fontSize: 13 }}>Full color (include Attribute 4 in full)</span>
                </label>
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
                <button style={styles.btnGhost} onClick={() => { setProduct(""); setYear(""); setAttribute3(""); setAttribute4(""); setSizes([]); setRule("rule1"); setSeparator("-"); setFullColor(false); setError(""); }}>Reset</button>
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

        {/* Right area - table */}
        <div style={styles.rightCard}>
          <div style={{ display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Generated SKUs ({generated.length})</h2>
            <div style={styles.exportControls}>
              <button style={styles.btnGhost} onClick={exportCSV}>Export CSV</button>
              <button style={styles.btnGhost} onClick={exportExcel}>Export Excel</button>
              <button style={{ ...styles.btnGhost, borderColor: palette.danger, color: palette.danger }} onClick={handleDeleteAll}>Delete all</button>
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
                  <th style={styles.th}>Attribute 4</th>
                  <th style={styles.th}>Size</th>
                  <th style={styles.th}>Rule</th>
                  <th style={styles.th}>Full color</th>
                  <th style={styles.th}>Delete</th>
                </tr>
              </thead>
              <tbody>
                {generated.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ ...styles.td, textAlign: "center", padding: 24, color: palette.muted }}>
                      No SKUs yet — add Product name and choose sizes, then click Generate SKU.
                    </td>
                  </tr>
                )}

                {generated.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 ? "transparent" : (darkMode ? "#071528" : "#fbfdff") }}>
                    <td style={{ ...styles.td, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{row.sku}</td>
                    <td style={styles.td}>{row.product}</td>
                    <td style={styles.td}>{row.year}</td>
                    <td style={styles.td}>{row.attribute3}</td>
                    <td style={styles.td}>{row.attribute4}</td>
                    <td style={styles.td}>{row.size}</td>
                    <td style={styles.td}>{row.rule}</td>
                    <td style={styles.td}>{row.fullColor ? "yes" : "no"}</td>
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

      {/* Export filename modal */}
      {exportModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
          <div style={{ width: 480, maxWidth: "94%", borderRadius: 12, padding: 16, background: palette.surface, border: `1px solid ${palette.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Export {exportType === "csv" ? "CSV" : "Excel"}</h3>
              <div>
                <button onClick={() => setExportModalOpen(false)} style={styles.btnGhost}>Close</button>
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 13, color: palette.muted }}>Filename</label>
              <input
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                placeholder="skus-2025-01-01"
                style={{ ...styles.input, padding: "10px 12px" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button onClick={() => setExportModalOpen(false)} style={styles.btnGhost}>Cancel</button>
                <button onClick={doExport} style={styles.btnPrimary}>Download</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rule modal */}
      {showRuleModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ width: 760, maxWidth: "96%", borderRadius: 12, padding: 18, background: palette.surface, border: `1px solid ${palette.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>{rule === "rule1" ? ruleExamples.rule1.title : ruleExamples.rule2.title}</h3>
              <div>
                <button onClick={() => setShowRuleModal(false)} style={styles.btnGhost}>Close</button>
              </div>
            </div>

            <p style={{ color: palette.muted, marginBottom: 10 }}>{rule === "rule1" ? ruleExamples.rule1.note : ruleExamples.rule2.note}</p>

            <div style={{ display: "grid", gap: 8 }}>
              {(rule === "rule1" ? ruleExamples.rule1.examples : ruleExamples.rule2.examples).map((ex, idx) => {
                const inp = ex.input;
                const produced = (() => {
                  const p = buildProductCode(inp.product, inp.year, rule).toUpperCase();
                  const a3 = buildAttrCode(inp.attribute3 || "", rule, false).toUpperCase();
                  // when fullColor is true the attribute4 is sanitized full; for example preview we show both variants
                  const a4Regular = buildAttrCode(inp.attribute4 || "", rule, false).toUpperCase();
                  const a4Full = buildAttrCode(inp.attribute4 || "", rule, true).toUpperCase();
                  const sep = "-";
                  const partsRegular = [];
                  const partsFull = [];
                  if (p) partsRegular.push(p);
                  if (a3) partsRegular.push(a3);
                  if (a4Regular) partsRegular.push(a4Regular);

                  if (p) partsFull.push(p);
                  if (a3) partsFull.push(a3);
                  if (a4Full) partsFull.push(a4Full);

                  return { regular: partsRegular.join(sep), full: partsFull.join(sep) };
                })();

                return (
                  <div key={idx} style={{ padding: 10, borderRadius: 8, background: darkMode ? "#071528" : "#fbfdff", border: `1px solid ${palette.border}` }}>
                    <div style={{ fontSize: 13, color: palette.muted }}>
                      Input:
                      <span style={{ marginLeft: 8, color: palette.text }}>
                        Product: <em>{inp.product}</em>
                        {inp.year ? <> | Year: <em>{inp.year}</em></> : null}
                        {inp.attribute3 ? <> | Attribute3: <em>{inp.attribute3}</em></> : null}
                        {inp.attribute4 ? <> | Attribute4: <em>{inp.attribute4}</em></> : null}
                      </span>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <strong>Example output (standard):</strong>
                      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", marginTop: 6 }}>{produced.regular}</div>
                      <div style={{ height: 8 }} />
                      <strong>Example output (Full color enabled):</strong>
                      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", marginTop: 6 }}>{produced.full}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 12, color: palette.muted }}>
              Note: Enabling Full color places Attribute 4 into the SKU in full (sanitized). This works with both Rule 1 and Rule 2.
            </div>
          </div>
        </div>
      )}

      {/* How to use modal */}
      {showHowTo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}>
          <div style={{ width: 700, maxWidth: "96%", borderRadius: 12, padding: 18, background: palette.surface, border: `1px solid ${palette.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>How to use SKU Generator</h3>
              <div>
                <button onClick={() => setShowHowTo(false)} style={styles.btnGhost}>Close</button>
              </div>
            </div>

            <ol style={{ color: palette.muted, paddingLeft: 18 }}>
              <li>Enter <strong>Product Name</strong> (required).</li>
              <li>Year is optional. If provided, the last two digits will be appended to the product code.</li>
              <li>Attribute 3 and Attribute 4 are optional. Add extra info such as styles or collection names.</li>
              <li>Use the <strong>Full color</strong> checkbox to include Attribute 4 in full (sanitized). If unchecked, Attribute 4 follows the selected rule.</li>
              <li>Choose a <strong>separator</strong> (-, :, /) used across the SKU parts.</li>
              <li>Select a <strong>rule</strong> to decide how codes are extracted from the attributes. Click Rule info for examples.</li>
              <li>Select sizes and click <strong>Generate SKU</strong>. SKUs are stored in your browser and the form fields will remain so you can generate more.</li>
              <li>Export CSV/Excel to download the list. Use Delete all to clear stored SKUs.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
