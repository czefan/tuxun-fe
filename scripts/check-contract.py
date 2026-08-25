#!/usr/bin/env python3
"""前端契约校验脚本 (check:contract)

校验内容：
1. JSON 格式与 OpenAPI 3.0 基础结构校验
2. 全量路由 operationId 唯一性与非空校验
3. 全量 $ref 内部引用解析校验（防止悬空引用）
4. 与 contract/api.md 接口清单的双向一致性比对校验
"""

import json
import os
import re
import sys
from pathlib import Path

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
    print(f"❌ 错误: 契约文件不存在 ({json_path})")
    sys.exit(1)

# 2. JSON 格式与 OpenAPI 基础结构
try:
    with open(json_path, "r", encoding="utf-8") as f:
        spec = json.load(f)
except Exception as e:
    print(f"❌ 契约 JSON 解析失败: {e}")
    sys.exit(1)

if not isinstance(spec, dict) or "openapi" not in spec or "paths" not in spec:
    print("❌ 契约格式错误: 缺少 openapi 或 paths 根属性")
    sys.exit(1)

errors = []

# 3. operationId 唯一性与非空校验
HTTP_METHODS = {"get", "post", "put", "delete", "patch", "options", "head"}
operation_ids = {}
spec_endpoints = set()

paths = spec.get("paths", {})
for path, path_item in paths.items():
    if not isinstance(path_item, dict):
        continue
    for method, op in path_item.items():
        if method.lower() in HTTP_METHODS:
            method_upper = method.upper()
            spec_endpoints.add((method_upper, path))
            if not isinstance(op, dict):
                errors.append(f"{method_upper} {path}: operation 定义非法")
                continue
            op_id = op.get("operationId")
            if not op_id:
                errors.append(f"{method_upper} {path}: 缺少 operationId")
            elif op_id in operation_ids:
                errors.append(
                    f"{method_upper} {path}: operationId '{op_id}' 与 {operation_ids[op_id]} 重复"
                )
            else:
                operation_ids[op_id] = f"{method_upper} {path}"

# 4. $ref 引用解析校验
def resolve_ref(ref_str: str, doc: dict) -> bool:
    if not ref_str.startswith("#/"):
        return True
    parts = ref_str[2:].split("/")
    curr = doc
    for p in parts:
        p = p.replace("~1", "/").replace("~0", "~")
        if isinstance(curr, dict) and p in curr:
            curr = curr[p]
        elif isinstance(curr, list) and p.isdigit() and int(p) < len(curr):
            curr = curr[int(p)]
        else:
            return False
    return True

def check_all_refs(node, path=""):
    if isinstance(node, dict):
        for k, v in node.items():
            if k == "$ref" and isinstance(v, str):
                if not resolve_ref(v, spec):
                    errors.append(f"悬空 $ref 引用: {path}/$ref -> '{v}'")
            else:
                check_all_refs(v, f"{path}/{k}")
    elif isinstance(node, list):
        for idx, item in enumerate(node):
            check_all_refs(item, f"{path}[{idx}]")

check_all_refs(spec)

# 5. 与 contract/api.md 接口清单双向一致性校验
if md_path.exists():
    try:
        with open(md_path, "r", encoding="utf-8") as f:
            md_content = f.read()
        md_raw_matches = re.findall(
            r"(GET|POST|PUT|DELETE|PATCH)\s+/api([/\w{}-]+)",
            md_content,
            re.IGNORECASE,
        )
        md_endpoints = {(m.upper(), p) for m, p in md_raw_matches}

        missing_in_md = spec_endpoints - md_endpoints
        extra_in_md = md_endpoints - spec_endpoints

        if missing_in_md:
            for m, p in sorted(missing_in_md):
                errors.append(f"api.md 缺少契约中定义的接口: {m} /api{p}")
        if extra_in_md:
            for m, p in sorted(extra_in_md):
                errors.append(f"api.md 包含契约中未定义的接口: {m} /api{p}")
    except Exception as e:
        errors.append(f"读取 api.md 失败: {e}")

# 6. 校验汇总与退出
if errors:
    print(f"❌ 契约校验失败，共发现 {len(errors)} 处错误:")
    for err in errors:
        print(f"  - {err}")
    sys.exit(1)
else:
    print(f"✔ 契约校验通过: {len(spec_endpoints)} 个接口与 {len(operation_ids)} 个 operationId 均合法且一致")
    sys.exit(0)
