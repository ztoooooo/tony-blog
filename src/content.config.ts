import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

const software = defineCollection({
	// Load Markdown files in the `src/content/software/` directory.
	loader: glob({ base: './src/content/software', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			// 引用其他集合的条目，用于内嵌展示；留空表示不引用
			reference: z.string().optional(),
			// 软件名称
			title: z.string(),
			// 一句话简介（卡片与详情页摘要）
			description: z.string(),
			// 分类，用于列表页筛选：效率工具 / 开发工具 / 影音 / 系统 / 其他
			category: z.string().default('其他'),
			// 支持平台
			platforms: z.array(z.string()).default([]),
			// 当前版本号
			version: z.string().optional(),
			// 图标：emoji 优先，其次使用图片
			icon: z.string().optional(),
			logo: z.optional(image()),
			// 主题色：blue / purple / pink / teal / green / orange / red
			accent: z
				.enum(['blue', 'purple', 'pink', 'teal', 'green', 'orange', 'red'])
				.default('blue'),
			// 官网 / 项目主页
			homepage: z.string().url().optional(),
			// 下载地址
			download: z.string().optional(),
			// 标签
			tags: z.array(z.string()).default([]),
			// 排序权重，数字越小越靠前
			order: z.number().default(100),
			// 是否为精选（列表页优先展示）
			featured: z.boolean().default(false),
			// 更新时间
			updatedDate: z.coerce.date().optional(),
		}),
});

export const collections = { blog, software };
