# AI 에이전트 코드

## 📂 구조

### core/
핵심 에이전트
- input_handler.py: 입력 처리
- review_agent.py: 검토
- spec_generator.py: 명세서 생성

### utils/
유틸리티
- data_manager.py: 데이터 관리

### mcp_servers/
MCP 서버 (향후 확장)

## 🔧 사용법

```python
from core.input_handler import InputHandler
from core.review_agent import ReviewAgent
from core.spec_generator import SpecGenerator

# 파이프라인 실행
handler = InputHandler()
reviewer = ReviewAgent()
generator = SpecGenerator()
```

import 경로가 변경되었으니 주의하세요!
