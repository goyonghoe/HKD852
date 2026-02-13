#!/usr/bin/env python3
"""Convert AI Product Photo Prompt Master Pack MD → styled HTML for PDF generation."""

import markdown
import sys
import os
import re

def get_css():
    return """
    @page {
        size: letter;
        margin: 2cm 2.5cm;
    }
    body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        color: #1a1a1a;
        line-height: 1.7;
        font-size: 11pt;
        max-width: 100%;
    }
    h1 {
        font-size: 28pt;
        color: #7c3aed;
        border-bottom: 3px solid #7c3aed;
        padding-bottom: 12px;
        margin-top: 40px;
        page-break-before: always;
    }
    h1:first-of-type {
        page-break-before: avoid;
    }
    h2 {
        font-size: 20pt;
        color: #5b21b6;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 8px;
        margin-top: 30px;
        page-break-before: always;
    }
    h2:first-of-type {
        page-break-before: avoid;
    }
    h3 {
        font-size: 13pt;
        color: #6d28d9;
        margin-top: 20px;
        margin-bottom: 8px;
    }
    h4 {
        font-size: 11pt;
        color: #7c3aed;
        margin-top: 16px;
    }
    code {
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10pt;
        font-family: 'SF Mono', 'Fira Code', monospace;
    }
    pre {
        background: #1e1b2e;
        color: #e2e8f0;
        padding: 16px 20px;
        border-radius: 8px;
        font-size: 9.5pt;
        line-height: 1.5;
        overflow-wrap: break-word;
        white-space: pre-wrap;
        page-break-inside: avoid;
        border-left: 4px solid #7c3aed;
    }
    pre code {
        background: none;
        padding: 0;
        color: #e2e8f0;
        font-size: 9.5pt;
    }
    blockquote {
        border-left: 4px solid #7c3aed;
        background: #f5f3ff;
        padding: 12px 20px;
        margin: 16px 0;
        border-radius: 0 8px 8px 0;
    }
    strong {
        color: #4c1d95;
    }
    table {
        border-collapse: collapse;
        width: 100%;
        margin: 16px 0;
        font-size: 10pt;
    }
    th {
        background: #7c3aed;
        color: white;
        padding: 10px 14px;
        text-align: left;
    }
    td {
        padding: 8px 14px;
        border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) {
        background: #f9fafb;
    }
    ul, ol {
        padding-left: 24px;
    }
    li {
        margin: 4px 0;
    }
    hr {
        border: none;
        border-top: 2px solid #e5e7eb;
        margin: 30px 0;
    }
    .cover-page {
        text-align: center;
        padding-top: 120px;
        page-break-after: always;
    }
    .cover-page h1 {
        font-size: 36pt;
        border: none;
        color: #7c3aed;
        page-break-before: avoid;
    }
    .cover-page .subtitle {
        font-size: 16pt;
        color: #6b7280;
        margin-top: 20px;
    }
    .cover-page .stats {
        margin-top: 60px;
        font-size: 14pt;
    }
    .cover-page .stat {
        display: inline-block;
        margin: 0 20px;
        padding: 16px 24px;
        background: #f5f3ff;
        border-radius: 12px;
        color: #5b21b6;
        font-weight: bold;
    }
    .cover-page .disclaimer {
        margin-top: 100px;
        font-size: 9pt;
        color: #9ca3af;
    }
    p strong:first-child {
        color: #059669;
    }
    """

def create_cover_html():
    return """
    <div class="cover-page">
        <h1>AI Product Photo<br>Prompt Master Pack</h1>
        <div class="subtitle">200+ Professional E-commerce Photography Prompts<br>
        for Midjourney, DALL-E 3, Stable Diffusion & Adobe Firefly</div>
        <div class="stats">
            <span class="stat">200+ Prompts</span>
            <span class="stat">10 Categories</span>
            <span class="stat">4 AI Platforms</span>
        </div>
        <div class="disclaimer">
            &copy; 2026 — All prompts are ready for commercial use.<br>
            AI-generated images are subject to each platform's terms of service.
        </div>
    </div>
    """

def convert_md_to_html(md_path, output_path, is_sample=False):
    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # Convert markdown to HTML
    html_body = markdown.markdown(
        md_content,
        extensions=['tables', 'fenced_code', 'toc']
    )

    title = "AI Product Photo Prompt Master Pack"
    if is_sample:
        title += " — FREE SAMPLE"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
    <style>{get_css()}</style>
</head>
<body>
{create_cover_html() if not is_sample else ''}
{html_body}
</body>
</html>"""

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"HTML written to: {output_path}")
    print(f"Size: {os.path.getsize(output_path):,} bytes")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.join(base_dir, 'AI-Product-Photo-Prompt-Master-Pack.md')
    html_path = os.path.join(base_dir, 'AI-Product-Photo-Prompt-Master-Pack.html')

    convert_md_to_html(md_path, html_path)
