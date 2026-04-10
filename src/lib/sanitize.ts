/**
 * XSS防护工具
 * 
 * 用于过滤用户输入的HTML内容，防止XSS攻击
 * 基于sanitize-html库
 * 
 * 铁律合规：
 * - 安全设计：XSS防护是基本安全要求
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Markdown渲染后的HTML安全过滤
 * 
 * 允许的标签和属性经过精心选择，平衡了安全性和功能性
 */
export function sanitizeMarkdownHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'em', 'strong', 'u', 's',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'class'],
      'code': ['class'],
      'pre': ['class'],
      'td': ['align'],
      'th': ['align'],
      'div': ['class'],
      'span': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // 强制在所有链接添加安全属性
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
    // 拒绝javascript:协议
    allowedScriptHostnames: [],
    disallowedTagsMode: 'discard',
  });
}

/**
 * 通用HTML安全过滤
 * 
 * 比sanitizeMarkdownHtml更严格，用于用户输入的任意HTML
 */
export function sanitizeUserHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'em', 'strong', 'u'],
    allowedAttributes: {},
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
    disallowedTagsMode: 'discard',
  });
}

/**
 * 检查字符串是否包含潜在XSS风险
 * 
 * 用于在存储前检查用户输入
 */
export function containsXssRisk(text: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // 事件处理器
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<style/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(text));
}
