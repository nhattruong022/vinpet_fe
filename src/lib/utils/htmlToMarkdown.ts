import TurndownService from 'turndown';
import { formatMarkdown } from './formatMarkdown';

// Tạo instance của TurndownService với cấu hình tối ưu
const turndownService = new TurndownService({
  headingStyle: 'atx', // Sử dụng ## thay vì HTML heading
  codeBlockStyle: 'fenced', // Sử dụng ``` thay vì indented
  bulletListMarker: '-', // Sử dụng - cho list
  emDelimiter: '*', // Sử dụng * cho italic
  strongDelimiter: '**', // Sử dụng ** cho bold
  linkStyle: 'inlined', // Link inline [text](url)
  linkReferenceStyle: 'full', // Full reference style
});

// Thêm rules tùy chỉnh để parse tốt hơn
turndownService.addRule('preserveLineBreaks', {
  filter: ['br'],
  replacement: function () {
    return '\n';
  }
});

turndownService.addRule('preserveParagraphs', {
  filter: ['p'],
  replacement: function (content) {
    return '\n\n' + content.trim() + '\n\n';
  }
});

/**
 * Convert HTML string về Markdown format
 * @param html - HTML string cần convert
 * @returns Markdown string
 */
export function htmlToMarkdown(html: string | undefined | null): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Nếu đã là Markdown (không có thẻ HTML), trả về nguyên bản
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html;
  }

  try {
    // Convert HTML về Markdown
    let markdown = turndownService.turndown(html);

    // Format lại Markdown cho đúng chuẩn
    markdown = formatMarkdown(markdown);

    return markdown;
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    // Nếu có lỗi, thử format lại nếu đã là Markdown
    try {
      return formatMarkdown(html);
    } catch {
      return html;
    }
  }
}

