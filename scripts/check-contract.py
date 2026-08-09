#!/usr/bin/env python3
"""前端契约校验包装脚本 (check:contract)

读取 OPENAPI_SCHEMA_PATH 环境变量（默认 contract/apifox-import.json），
校验 JSON 合法性、operationId 唯一性、$ref 可解析性以及与 api.md 接口清单一致性。
"""

import os
import sys
from pathlib import Path

# 获取项目根目录 (tuxun-fe)
FE_ROOT = Path(__file__).resolve().parent.parent

# 1. 确定输入文件路径
schema_env = os.getenv("OPENAPI_SCHEMA_PATH")
if schema_env:
    json_path = Path(schema_env).resolve()
    md_path = json_path.parent / "api.md"
else:
    json_path = FE_ROOT / "contract" / "apifox-import.json"
    md_path = FE_ROOT / "contract" / "api.md"

if not json_path.exists():
    print(f"错误: 契约文件不存在 ({json_path})。")
    sys.exit(1)

# 2. 导入同级或上级 api-docs 目录下的 check_contract 逻辑
API_DOCS_DIR = FE_ROOT.parent / "api-docs"
if API_DOCS_DIR.exists():
    sys.path.insert(0, str(API_DOCS_DIR))

try:
    import check_contract
    # 动态覆盖目标文件
    check_contract.JSON_FILE = json_path
    check_contract.MD_FILE = md_path
    sys.exit(check_contract.main())
except ImportError:
    print(f"错误: 找不到 check_contract 模块 ({API_DOCS_DIR})。")
    sys.exit(1)
