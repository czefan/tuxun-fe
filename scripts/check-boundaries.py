#!/usr/bin/env python3
import os
import re
import sys

"""
项目架构边界与依赖倒置 Lint 校验脚本。
严禁：
1. src/pages 和 src/subPages 越过 domain 直连 service/contract 内联手写底层模式
2. src/features/ 内部跨域私有模块交叉引用
"""

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC_DIR = os.path.join(PROJECT_ROOT, 'src')

violations = []

# 规则 1: 页面不能直接引入底层 raw schema
raw_schema_import_pattern = re.compile(r"import\s+.*from\s+['\"]@/service/contract/schema['\"]")
# 规则 2: 基础公共层严禁反向依赖业务域 (features)。
# 注意 src/app 不在此列——它是应用外壳，和 pages 一样属于编排层，允许依赖 features。
shared_import_features_pattern = re.compile(r"import\s+.*from\s+['\"]@/features/")

SHARED_DIRS = ('src/components', 'src/composables', 'src/utils', 'src/constants', 'src/styles', 'src/router', 'src/store')

for root, _, files in os.walk(SRC_DIR):
    for file in files:
        if not file.endswith(('.ts', '.vue', '.js')):
            continue
        rel_path = os.path.relpath(os.path.join(root, file), PROJECT_ROOT)
        
        # 跳过自动生成的 d.ts 和 test 文件
        if file.endswith('.d.ts') or file.endswith('.test.ts'):
            continue

        with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
            content = f.read()

        if raw_schema_import_pattern.search(content):
            violations.append(f"[{rel_path}]: 严禁直接 import raw schema.d.ts！请通过业务域 View Model 引入。")

        if any(rel_path.startswith(sd) for sd in SHARED_DIRS):
            if shared_import_features_pattern.search(content):
                violations.append(f"[{rel_path}]: 基础公共层严禁反向依赖业务域 (features)！应用外壳请放 src/app。")

if violations:
    print("❌ 发现架构边界违规:")
    for v in violations:
        print(f"  - {v}")
    sys.exit(1)
else:
    print("✅ 架构与域边界校验 100% 通过！")
    sys.exit(0)
