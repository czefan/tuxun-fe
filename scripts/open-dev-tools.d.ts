import type { Plugin } from 'vite'

export interface OpenDevToolsOptions {
  mode?: string
  wechatDevtoolsCliPath?: string
}

export default function openDevTools(options?: OpenDevToolsOptions): Plugin
