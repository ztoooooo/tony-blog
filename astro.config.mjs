// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.uuoooo.com',
	integrations: [mdx(), sitemap()],
	// 字体策略：使用系统字体栈（SF Pro / Segoe UI Variable / 苹方），
	// 不加载任何 Web Font —— 既还原 Apple 观感，又省掉一次字体请求。
});
