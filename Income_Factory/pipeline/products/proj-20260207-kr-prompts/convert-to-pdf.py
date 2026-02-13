#!/usr/bin/env python3
"""Convert Korean Marketing Prompt Pack MD → styled HTML for PDF generation."""

import markdown
import os

def get_css():
    return """
    @page { size: letter; margin: 2cm 2.5cm; }
    body {
        font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif;
        color: #1a1a1a; line-height: 1.8; font-size: 11pt; max-width: 100%;
    }
    h1 {
        font-size: 26pt; color: #1e3a5f; border-bottom: 3px solid #0d9488;
        padding-bottom: 12px; margin-top: 40px; page-break-before: always;
    }
    h1:first-of-type { page-break-before: avoid; }
    h2 {
        font-size: 18pt; color: #1e3a5f; border-bottom: 2px solid #e5e7eb;
        padding-bottom: 8px; margin-top: 30px; page-break-before: always;
    }
    h2:first-of-type { page-break-before: avoid; }
    h3 { font-size: 13pt; color: #0d9488; margin-top: 20px; margin-bottom: 8px; }
    h4 { font-size: 11pt; color: #1e3a5f; margin-top: 16px; }
    code {
        background: #f0fdfa; padding: 2px 6px; border-radius: 4px;
        font-size: 10pt; font-family: 'D2Coding', 'SF Mono', monospace;
    }
    pre {
        background: #0f172a; color: #e2e8f0; padding: 16px 20px;
        border-radius: 8px; font-size: 9.5pt; line-height: 1.5;
        overflow-wrap: break-word; white-space: pre-wrap;
        page-break-inside: avoid; border-left: 4px solid #0d9488;
    }
    pre code { background: none; padding: 0; color: #e2e8f0; font-size: 9.5pt; }
    blockquote {
        border-left: 4px solid #0d9488; background: #f0fdfa;
        padding: 12px 20px; margin: 16px 0; border-radius: 0 8px 8px 0;
    }
    strong { color: #134e4a; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 10pt; }
    th { background: #1e3a5f; color: white; padding: 10px 14px; text-align: left; }
    td { padding: 8px 14px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) { background: #f0fdfa; }
    ul, ol { padding-left: 24px; }
    li { margin: 4px 0; }
    hr { border: none; border-top: 2px solid #e5e7eb; margin: 30px 0; }
    .cover-page {
        text-align: center; padding-top: 100px; page-break-after: always;
    }
    .cover-page h1 {
        font-size: 34pt; border: none; color: #1e3a5f; page-break-before: avoid;
    }
    .cover-page .subtitle { font-size: 16pt; color: #0d9488; margin-top: 16px; }
    .cover-page .desc { font-size: 12pt; color: #6b7280; margin-top: 30px; line-height: 2; }
    .cover-page .stats { margin-top: 50px; }
    .cover-page .stat {
        display: inline-block; margin: 0 16px; padding: 14px 22px;
        background: #f0fdfa; border-radius: 12px; color: #1e3a5f; font-weight: bold;
        border: 2px solid #0d9488;
    }
    .cover-page .footer { margin-top: 80px; font-size: 9pt; color: #9ca3af; }
    """

def create_cover():
    return """
    <div class="cover-page">
        <h1>마케팅 카피라이팅<br>AI 프롬프트 마스터팩</h1>
        <div class="subtitle">한국 이커머스 특화 50개 프롬프트</div>
        <div class="desc">
            ChatGPT · Claude · Gemini에서 바로 사용 가능<br>
            모든 프롬프트에 Before/After 실전 예시 포함<br>
            스마트스토어 · 쿠팡 · 인스타그램 · 카카오톡 · 네이버 블로그
        </div>
        <div class="stats">
            <span class="stat">50+ 프롬프트</span>
            <span class="stat">10개 카테고리</span>
            <span class="stat">Before/After 예시</span>
        </div>
        <div class="footer">&copy; 2026 — 상업적 사용 가능</div>
    </div>
    """

if __name__ == '__main__':
    base = os.path.dirname(os.path.abspath(__file__))

    # Main product
    md_path = os.path.join(base, '마케팅-카피-AI-프롬프트-마스터팩.md')
    html_path = os.path.join(base, '마케팅-카피-AI-프롬프트-마스터팩.html')

    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()
    html_body = markdown.markdown(md_content, extensions=['tables', 'fenced_code', 'toc'])
    html = f"""<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>마케팅 카피라이팅 AI 프롬프트 마스터팩</title>
<style>{get_css()}</style></head>
<body>{create_cover()}{html_body}</body></html>"""

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Main HTML: {html_path} ({os.path.getsize(html_path):,} bytes)")

    # Free sample (extract first prompt from each category)
    import re
    categories = []
    current_cat = None
    current_prompt = []
    in_first_prompt = False

    for line in md_content.split('\n'):
        if re.match(r'^## 카테고리 \d+', line) or re.match(r'^## \d+\.', line):
            if current_cat and current_prompt:
                categories.append((current_cat, '\n'.join(current_prompt)))
            current_cat = line
            current_prompt = []
            in_first_prompt = False
        elif re.match(r'^### 프롬프트 \d+', line):
            if not in_first_prompt and current_cat:
                in_first_prompt = True
                current_prompt = [line]
            elif in_first_prompt:
                in_first_prompt = False
        elif in_first_prompt:
            current_prompt.append(line)

    if current_cat and current_prompt:
        categories.append((current_cat, '\n'.join(current_prompt)))

    sample_md = """# 마케팅 카피라이팅 AI 프롬프트 마스터팩
## 무료 샘플 — 카테고리별 1개씩 미리보기

> 이것은 전체 **50개 프롬프트 팩**의 무료 미리보기입니다.
> 전체 버전에는 **카테고리당 5개**, 총 **10개 카테고리**의 프롬프트가 포함됩니다.

---

"""
    for cat_title, prompt_content in categories[:10]:
        sample_md += f"{cat_title}\n\n{prompt_content}\n\n"
        sample_md += "> *이 카테고리에 4개 프롬프트가 더 있습니다!*\n\n---\n\n"

    sample_md += """
## 전체 팩 구매하기

**마케팅 카피라이팅 AI 프롬프트 마스터팩**
- 50개 한국 이커머스 특화 프롬프트
- 10개 카테고리 (스마트스토어, 쿠팡, 인스타그램, 카카오톡 등)
- 모든 프롬프트에 Before/After 예시 포함
- ChatGPT, Claude, Gemini 호환

---
*무료 샘플을 이용해 주셔서 감사합니다!*
"""

    sample_html_path = os.path.join(base, '무료-샘플-10개-프롬프트.html')
    sample_body = markdown.markdown(sample_md, extensions=['tables', 'fenced_code'])
    sample_html = f"""<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><title>마케팅 카피 AI 프롬프트 — 무료 샘플</title>
<style>{get_css()}</style></head>
<body>
<div style="text-align:center; padding: 40px 0 20px;">
    <h1 style="border:none; margin:0; page-break-before:avoid;">마케팅 카피라이팅 AI 프롬프트</h1>
    <p style="font-size: 16pt; color: #0d9488; margin-top: 8px;">무료 샘플 — 10개 프롬프트 미리보기</p>
</div>
<hr>
{sample_body}
</body></html>"""

    with open(sample_html_path, 'w', encoding='utf-8') as f:
        f.write(sample_html)
    print(f"Sample HTML: {sample_html_path} ({os.path.getsize(sample_html_path):,} bytes)")
