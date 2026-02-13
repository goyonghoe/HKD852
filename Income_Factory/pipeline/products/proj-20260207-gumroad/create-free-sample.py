#!/usr/bin/env python3
"""Extract 1 prompt per category to create free sample PDF content."""

import re
import os
import markdown

def get_css():
    return """
    @page { size: letter; margin: 2cm 2.5cm; }
    body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        color: #1a1a1a; line-height: 1.7; font-size: 11pt;
    }
    h1 { font-size: 28pt; color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 12px; }
    h2 { font-size: 18pt; color: #5b21b6; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 28px; }
    h3 { font-size: 13pt; color: #6d28d9; margin-top: 16px; }
    pre {
        background: #1e1b2e; color: #e2e8f0; padding: 14px 18px;
        border-radius: 8px; font-size: 9.5pt; line-height: 1.5;
        overflow-wrap: break-word; white-space: pre-wrap;
        border-left: 4px solid #7c3aed;
    }
    pre code { background: none; padding: 0; color: #e2e8f0; font-size: 9.5pt; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 10pt; }
    blockquote {
        border-left: 4px solid #7c3aed; background: #f5f3ff;
        padding: 12px 20px; margin: 16px 0; border-radius: 0 8px 8px 0;
    }
    strong { color: #4c1d95; }
    .cta-box {
        background: linear-gradient(135deg, #7c3aed, #5b21b6);
        color: white; padding: 24px 32px; border-radius: 12px;
        text-align: center; margin: 40px 0;
    }
    .cta-box h2 { color: white; border: none; }
    .cta-box a { color: #fbbf24; font-weight: bold; }
    hr { border: none; border-top: 2px solid #e5e7eb; margin: 24px 0; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 10pt; }
    th { background: #7c3aed; color: white; padding: 10px 14px; text-align: left; }
    td { padding: 8px 14px; border-bottom: 1px solid #e5e7eb; }
    """

def extract_sample_prompts(md_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Categories and their section headers
    categories = [
        ("Clothing & Fashion", "의류/패션"),
        ("Jewelry & Accessories", "주얼리/액세서리"),
        ("Food & Beverage", "식품/음료"),
        ("Cosmetics & Skincare", "화장품/스킨케어"),
        ("Electronics & Gadgets", "전자기기"),
        ("Furniture & Home Decor", "가구/인테리어"),
        ("Handmade & Crafts", "핸드메이드/공예"),
        ("Pet Products", "반려동물 용품"),
        ("Stationery & Office", "문구/사무용품"),
        ("Sports & Outdoor", "스포츠/아웃도어"),
    ]

    sample_md = """# AI Product Photo Prompt Master Pack
## FREE SAMPLE — 10 Prompts (1 Per Category)

> This is a free preview of the full **200-prompt** pack.
> The full version includes **20 prompts per category** across **10 categories**.

---

"""

    for i, (eng_name, kor_name) in enumerate(categories, 1):
        # Find the first prompt in each category section
        # Pattern: look for "## N. Category Name" then find the first "### Prompt N:" block
        section_pattern = rf'## {i}\. {re.escape(eng_name)}.*?\n(### Prompt \d+:.*?)(?=### Prompt \d+:|## \d+\.)'
        match = re.search(section_pattern, content, re.DOTALL)

        if match:
            prompt_block = match.group(1).strip()
            sample_md += f"## {i}. {eng_name} ({kor_name})\n\n"
            sample_md += prompt_block + "\n\n"
            sample_md += f"> *19 more prompts in the full pack for this category!*\n\n---\n\n"
        else:
            # Fallback: try broader match
            lines = content.split('\n')
            in_section = False
            prompt_lines = []
            found = False
            for line in lines:
                if re.match(rf'## {i}\. {re.escape(eng_name)}', line):
                    in_section = True
                    continue
                if in_section and line.startswith('### Prompt'):
                    if not found:
                        found = True
                        prompt_lines.append(line)
                        continue
                    else:
                        break
                if in_section and found:
                    prompt_lines.append(line)
                if in_section and not found:
                    continue

            if prompt_lines:
                sample_md += f"## {i}. {eng_name} ({kor_name})\n\n"
                sample_md += '\n'.join(prompt_lines) + "\n\n"
                sample_md += f"> *19 more prompts in the full pack for this category!*\n\n---\n\n"

    sample_md += """
## What's in the Full Pack?

| Category | Prompts | Styles |
|----------|---------|--------|
| Clothing & Fashion | 20 | Studio, Lifestyle, Editorial, Seasonal |
| Jewelry & Accessories | 20 | Macro, Luxury, Lifestyle, Display |
| Food & Beverage | 20 | Overhead, Action, Ingredients, Moody |
| Cosmetics & Skincare | 20 | Beauty, Clinical, Flat Lay, Lifestyle |
| Electronics & Gadgets | 20 | Tech, Minimal, Lifestyle, Unboxing |
| Furniture & Home Decor | 20 | Room Setting, Detail, Styled, Catalog |
| Handmade & Crafts | 20 | Artisan, Process, Rustic, Market |
| Pet Products | 20 | Pet Model, Lifestyle, Studio, Playful |
| Stationery & Office | 20 | Workspace, Flat Lay, Detail, Creative |
| Sports & Outdoor | 20 | Action, Lifestyle, Studio, Adventure |

**Total: 200 prompts across 10 categories**

---

## Get the Full Pack

**AI Product Photo Prompt Master Pack**
- 200+ Professional Prompts
- 10 E-commerce Categories
- Works with Midjourney, DALL-E 3, Stable Diffusion & Firefly
- Includes Usage Guide & Platform-Specific Tips

**Launch Price: $9.99** (Regular $19.99)

---

*Thank you for trying the free sample!*
"""

    return sample_md

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.join(base_dir, 'AI-Product-Photo-Prompt-Master-Pack.md')

    # Extract sample prompts
    sample_md = extract_sample_prompts(md_path)

    # Save sample MD
    sample_md_path = os.path.join(base_dir, 'Free-Sample-10-Prompts.md')
    with open(sample_md_path, 'w', encoding='utf-8') as f:
        f.write(sample_md)
    print(f"Sample MD: {sample_md_path}")

    # Convert to HTML
    html_body = markdown.markdown(sample_md, extensions=['tables', 'fenced_code'])
    sample_html_path = os.path.join(base_dir, 'Free-Sample-10-Prompts.html')
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AI Product Photo Prompt Master Pack — FREE SAMPLE</title>
<style>{get_css()}</style>
</head>
<body>
<div style="text-align:center; padding: 40px 0 20px;">
    <h1 style="border:none; margin:0;">AI Product Photo Prompt Master Pack</h1>
    <p style="font-size: 16pt; color: #6b7280; margin-top: 8px;">FREE SAMPLE — 10 Prompts Preview</p>
    <p style="font-size: 11pt; color: #9ca3af;">Full version: 200 prompts across 10 categories</p>
</div>
<hr>
{html_body}
</body>
</html>"""

    with open(sample_html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Sample HTML: {sample_html_path} ({os.path.getsize(sample_html_path):,} bytes)")
