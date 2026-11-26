#!/usr/bin/env python3
"""
Convert a Word-exported regulation PDF (text layer, no scan) to the Markdown the book viewer reads.

    pip install pymupdf        # AGPL: fine for this local script, never ship it inside the app
    python3 scripts/convert-book.py csvbase/ADR-2025-konsolidiert_2060102.pdf csvbase/adr-new/ADR.md

Writes <out>.md, <out>.pages.json ([[mdLine, pdfPage], ...] for a later "original page" link) and an
images/ folder next to it. No OCR, no LLM: text, tables and images come from the PDF itself.

shortcut: tables are flat pipe tables (merged header cells become empty cells, bold/sup inside a cell
is lost); vector drawings are not extracted, only embedded raster images. A scanned book (no text
layer) is NOT handled: the script stops with an error. Upgrade when a book needs colspan or drawings.
"""
import json
import re
import sys
from pathlib import Path

import pymupdf

FOOT_MARGIN = 50  # header/footer band ("BMIMI Ausgabe …", page number): the last 50 pt of the page, portrait or landscape
PARA_GAP = 12.5  # top-to-top distance (pt) above which a new paragraph starts
NUM_RE = re.compile(r"^(\d+(?:\.\d+)+)\s")
BIG_RE = re.compile(r"^(Teil|Kapitel|Anhang)\s+\S+")


def style_text(spans):
    """Spans -> markdown, merging equal styles so `**a** **b**` becomes `**a b**`."""
    out, cur, buf = [], None, ""
    for text, flags in spans + [("", None)]:
        key = (bool(flags & 16), bool(flags & 2), bool(flags & 1)) if flags is not None else None
        if key != cur and buf:
            body = buf.replace("*", "\\*").replace("<", "&lt;")
            lead, core, trail = re.match(r"^(\s*)(.*?)(\s*)$", body, re.S).groups()
            if core:
                bold, ital, sup = cur
                if bold: core = f"**{core}**"
                if ital: core = f"*{core}*"
                if sup: core = f"<sup>{core}</sup>"
            out.append(lead + core + trail)
            buf = ""
        cur = key
        buf += text
    return re.sub(r"[ \t]+", " ", "".join(out)).strip()


def visual_lines(page, skip_boxes):
    """Group PyMuPDF lines that share a baseline into one visual line: (y, x0, size, [(text, flags)])."""
    raw = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            x0, y0, x1, y1 = l["bbox"]
            if y0 >= page.rect.height - FOOT_MARGIN or any(bx[0] <= (x0 + x1) / 2 <= bx[2] and bx[1] <= (y0 + y1) / 2 <= bx[3] for bx in skip_boxes):
                continue
            spans = [(s["text"], s["flags"]) for s in l["spans"] if s["text"].strip() or s["text"] == " "]
            if "".join(t for t, _ in spans).strip():
                raw.append((y0, x0, l["spans"][0]["size"], spans))
    raw.sort(key=lambda r: r[0])
    groups = []
    for r in raw:  # same baseline = within 3 pt of the group's first line
        if groups and abs(groups[-1][0][0] - r[0]) < 3:
            groups[-1].append(r)
        else:
            groups.append([r])
    lines = []
    for g in groups:
        g.sort(key=lambda r: r[1])
        spans = []
        for r in g:
            if spans and not spans[-1][0].endswith(" "):
                spans.append((" ", 0))
            spans.extend(r[3])
        lines.append([g[0][0], g[0][1], g[0][2], spans])
    return lines


def join_line(para, text):
    """Append a wrapped line; `einschließ-` + `lich` is one word, `Be-` + `und Entladung` is not."""
    if re.search(r"[a-zäöüß]-$", para) and re.match(r"[a-zäöüß]", text) and not re.match(r"(und|oder|bzw|sowie)\b", text):
        return para[:-1] + text
    return para + " " + text


def real_table(t):
    """find_tables also fires on boxed text (SV 230 became a 3x4 "table" and its text vanished): a real
    table is mostly filled, except Table A (23 columns, many cells legitimately empty)."""
    # 2-row "tables" are boxed paragraphs (SV 365, 668): rejecting one falls back to plain text, never loses it
    if t.row_count < 3 or t.col_count < 2:
        return False
    cells = [c for r in t.extract() for c in r]
    return t.col_count >= 15 or sum(1 for c in cells if (c or "").strip()) / len(cells) >= 0.5


def table_md(rows, prev):
    """Pipe table; rows repeated from the previous page's table header are skipped (continuation)."""
    cell = lambda c: (c or "").strip().replace("|", "\\|").replace("\n", "<br>")
    rows = [[cell(c) for c in r] for r in rows]
    cont = bool(prev) and len(prev[0]) == len(rows[0]) and rows[0] == prev[0]
    if cont:
        n = 0
        while n < len(rows) and n < len(prev) and rows[n] == prev[n]:
            n += 1
        rows = rows[n:]
    return rows, cont


def convert(pdf, out_md):
    doc = pymupdf.open(pdf)
    if sum(len(p.get_text()) for p in doc) < 50 * doc.page_count:
        sys.exit("no text layer (scanned?): this script needs a text PDF")
    out_dir = Path(out_md).parent
    img_dir = out_dir / "images"
    img_dir.mkdir(parents=True, exist_ok=True)
    md, pages = [], []  # md: list of lines; pages: [line, page]
    stats = dict(tables=0, images=0, headings=0)
    heading_gap = None  # set right after a heading: how close a bold line must be to join its title
    prev_rows, prev_open, para = None, False, None  # prev_open: last emitted block is an open table

    def flush():
        nonlocal para
        if para:
            md.append(para); md.append("")
            para = None

    for pno, page in enumerate(doc, 1):
        pages.append([len(md) + 1, pno])
        tabs = [t for t in page.find_tables().tables if real_table(t)]
        boxes = [t.bbox for t in tabs]
        # images → file; inside a table they go into the cell, else a block of their own
        imgs = []
        for k, info in enumerate(page.get_image_info(xrefs=True), 1):
            if not info["xref"] or min(info["bbox"][2] - info["bbox"][0], info["bbox"][3] - info["bbox"][1]) < 8:
                continue
            pix = pymupdf.Pixmap(doc, info["xref"])
            if pix.colorspace is None or pix.n - pix.alpha > 3:
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            name = f"p{pno:04d}-{k}.png"
            pix.save(img_dir / name)
            imgs.append((info["bbox"], name))
            stats["images"] += 1
        items = []  # (y, kind, payload)
        for ln in visual_lines(page, boxes):
            items.append((ln[0], "line", ln))
        for t in tabs:
            rows = t.extract()
            for bbox, name in imgs:
                cx, cy = (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2
                for ri, r in enumerate(t.rows):
                    if r.bbox[1] <= cy <= r.bbox[3]:
                        for ci, cb in enumerate(r.cells):
                            if cb and cb[0] <= cx <= cb[2]:
                                rows[ri][ci] = (rows[ri][ci] or "") + f'\n<img alt="Abbildung" src="images/{name}"/>'
            items.append((t.bbox[1], "table", rows))
        for bbox, name in imgs:
            if not any(b[0] <= (bbox[0] + bbox[2]) / 2 <= b[2] and b[1] <= (bbox[1] + bbox[3]) / 2 <= b[3] for b in boxes):
                items.append((bbox[1], "img", name))
        items.sort(key=lambda i: i[0])

        last_y = None
        for y, kind, p in items:
            if kind == "table":
                flush()
                rows, cont = table_md(p, prev_rows)
                stats["tables"] += 1
                if not rows:
                    prev_open = True; continue
                if rows and all(c == "" for c in rows[0][1:]) and rows[0][0] and not cont:  # title row spanning all columns
                    md.append(f"**{rows[0][0]}**"); md.append(""); rows = rows[1:]
                if not rows:
                    continue
                if not (cont and prev_open):
                    md.append("| " + " | ".join(rows[0]) + " |")
                    md.append("|" + "---|" * len(rows[0]))
                    rows_out = rows[1:]
                else:
                    if md and md[-1] == "":
                        md.pop()  # glue the continuation onto the table of the previous page
                    rows_out = rows
                for r in rows_out:
                    md.append("| " + " | ".join(r) + " |")
                if not (cont and prev_open):
                    prev_rows = rows
                prev_open = True
                md.append("")
                last_y = None
                continue
            if kind == "img":
                flush(); md.append(f"![Abbildung](images/{p})"); md.append(""); last_y = None; continue
            _, _, (ly, x0, size, spans) = y, kind, p
            text = style_text(spans)
            plain = "".join(t for t, _ in spans).strip()
            live = [(t, f) for t, f in spans if t.strip()]
            allbold = all(f & 16 for _, f in live) and not any(f & 2 for _, f in live)
            styled = all(f & 18 for _, f in live)  # bold or italic only: a title, not running text
            num_lead = x0 < 70 and bool(live) and live[0][1] & 16 and re.fullmatch(r"\d+(\.\d+)+", live[0][0].strip())
            big = BIG_RE.match(plain) if size >= 11 else None
            if (allbold and (big or (x0 < 70 and NUM_RE.match(plain + " ")))) or (num_lead and styled):
                flush()
                level = 2 if plain.startswith("Teil") else 3 if big else min(2 + plain.split()[0].count("."), 6)
                md.append("#" * level + " " + re.sub(r"\*+", "", text)); md.append("")
                stats["headings"] += 1
                last_y = ly; prev_open = False; heading_gap = 25 if big else PARA_GAP
                continue
            if num_lead:  # numbered paragraph (1.1.3.6.3 + running text): the number is the heading, as in the old file
                flush()
                number = live[0][0].strip()
                md.append("#" * min(2 + number.count("."), 6) + " " + number); md.append("")
                stats["headings"] += 1
                text = style_text(spans[1:]); plain = plain[len(number):].strip(); heading_gap = None
                last_y = None; prev_open = False
                para = text
                last_y = ly
                continue
            # heading continuation: bold line right under a heading (wrapped title / Kapitel + title line)
            if allbold and heading_gap and last_y is not None and ly - last_y < heading_gap and md and md[-1] == "" and md[-2].startswith("#"):
                md[-2] += " " + re.sub(r"\*+", "", text)
                last_y = ly
                continue
            heading_gap = None
            new_par = para is None or last_y is None or ly - last_y > PARA_GAP
            if new_par:
                # a paragraph split across a page break continues when it has no sentence end and this one starts lowercase
                if para is not None and last_y is None and not para.rstrip().endswith((".", ":", ";", ")")) and plain[:1].islower():
                    para += " " + text
                else:
                    flush(); para = text
            else:
                para = join_line(para, text)
            last_y = ly
            prev_open = False
        # blocks end with the page unless the paragraph may continue
        last_y = None
        if para is not None and not para.rstrip().endswith((".", ":", ";", ")")):
            pass  # keep open; next page decides
        else:
            flush()
    flush()
    Path(out_md).write_text("# ADR\n\n" + "\n".join(md) + "\n", encoding="utf-8")
    pages = [[l + 2, p] for l, p in pages]
    Path(str(out_md) + ".pages.json").write_text(json.dumps(pages))
    return stats, doc.page_count


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    stats, n = convert(sys.argv[1], sys.argv[2])
    text = Path(sys.argv[2]).read_text(encoding="utf-8")
    assert not re.search(r"Ausgabe ADR \d{4}-\d\d Aktualisiert", text), "header/footer leaked"
    print(n, "pages", stats, len(text.splitlines()), "lines")
