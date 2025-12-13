/**
 * Format và clean up Markdown content cho đúng chuẩn
 * @param markdown - Markdown string cần format
 * @returns Markdown string đã được format
 */
export function formatMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  let formatted = markdown;

  // 1. Detect và format các heading từ text thuần (không có **)
  // Pattern: Dòng ngắn, có thể có dấu chấm hỏi, dấu gạch ngang, và có paragraph sau đó
  formatted = formatted.replace(/^([^\n]{5,120}?)\s*\n([^\n#\*\-\d\s]{20,})/gm, (match, line, next) => {
    const trimmed = line.trim();
    // Nếu là heading:
    // - Ngắn (< 120 ký tự)
    // - Không kết thúc bằng dấu chấm (có thể có dấu chấm hỏi, chấm than)
    // - Không phải là câu văn dài
    // - Có paragraph dài sau đó (> 20 ký tự)
    const isShortLine = trimmed.length < 120 && trimmed.length > 5;
    const isNotLongSentence = !trimmed.endsWith('.') || trimmed.endsWith('?') || trimmed.endsWith('!');
    const hasLongParagraphAfter = next.trim().length > 20;
    const isNotNumber = !trimmed.match(/^[\d\.\-\s]+$/);
    const isNotList = !trimmed.match(/^[\-\*]\s/);

    if (isShortLine && isNotLongSentence && hasLongParagraphAfter && isNotNumber && isNotList) {
      // Kiểm tra thêm: nếu có dấu gạch ngang (MES – ...) hoặc là câu hỏi → chắc chắn là heading
      const hasDash = trimmed.includes('–') || trimmed.includes('-');
      const isQuestion = trimmed.endsWith('?');

      if (hasDash || isQuestion || (!trimmed.includes('.') && trimmed.length < 80)) {
        return `## ${trimmed}\n\n${next}`;
      }
    }
    return match;
  });

  // 2. Fix các heading được viết dưới dạng **Text** ở đầu dòng → ## Text
  formatted = formatted.replace(/^\*\*([^*]+?)\*\*\s*$/gm, (match, text) => {
    const trimmed = text.trim();
    // Nếu là heading thực sự (text ngắn, không kết thúc bằng dấu chấm)
    if (trimmed.length < 80 && !trimmed.endsWith('.') && !trimmed.includes('.')) {
      return `## ${trimmed}`;
    }
    // Giữ lại bold nếu không phải heading
    return match;
  });

  // 3. Fix các heading có ** ở đầu dòng và có text sau đó
  formatted = formatted.replace(/^\*\*([^*\n]+?)\*\*\s*\n([^\n#\*\-\s])/gm, (match, text, next) => {
    const trimmed = text.trim();
    if (trimmed.length < 80 && !trimmed.endsWith('.') && !trimmed.includes('.')) {
      return `## ${trimmed}\n\n${next}`;
    }
    return match;
  });

  // 4. Đảm bảo có khoảng trống giữa các heading và paragraph
  formatted = formatted.replace(/(## .+)\n([^\n#\s])/g, '$1\n\n$2');
  formatted = formatted.replace(/([^\n#])\n(## )/g, '$1\n\n$2');

  // 5. Detect và format list items từ text thuần
  // Dòng ngắn bắt đầu bằng số, chữ cái, hoặc dấu - → list item
  formatted = formatted.replace(/^(\d+[\.\)]\s*[^\n]{1,80}?)$/gm, '- $1'); // Số. text
  formatted = formatted.replace(/^([A-Za-z][\.\)]\s*[^\n]{1,80}?)$/gm, '- $1'); // Chữ. text

  // 6. Fix các list items - đảm bảo có dấu - và khoảng trống
  formatted = formatted.replace(/^[\-\*]\s*([^\n]+)$/gm, '- $1');

  // 5. Đảm bảo có khoảng trống giữa các paragraph
  // Giữa 2 đoạn văn (không phải heading, list) cần có 1 dòng trống
  formatted = formatted.replace(/([^\n#\-\*])\n([^\n#\-\*\s])/g, (match, p1, p2) => {
    // Nếu không phải là list item, heading, hoặc dòng trống, thêm dòng trống
    if (!p2.match(/^[\-\*#]/) && p1.trim() && p2.trim()) {
      return `${p1}\n\n${p2}`;
    }
    return match;
  });

  // 6. Fix các bold text trong paragraph - đảm bảo format đúng
  // Giữ nguyên **text** nếu đã đúng format
  // Chỉ fix nếu thiếu khoảng trống xung quanh

  // 7. Clean up các dòng trống thừa (giữ lại tối đa 2 dòng trống)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // 8. Loại bỏ dòng trống ở đầu và cuối
  formatted = formatted.trim();

  // 9. Đảm bảo kết thúc bằng 1 dòng trống
  if (formatted && !formatted.endsWith('\n')) {
    formatted += '\n';
  }

  return formatted;
}

/**
 * Smart format Markdown - tự động detect và format
 * @param content - Content có thể là HTML hoặc Markdown
 * @returns Markdown đã được format đúng chuẩn
 */
export function smartFormatMarkdown(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Nếu đã là Markdown format tốt, chỉ cần format nhẹ
  if (!/<[a-z][\s\S]*>/i.test(content)) {
    return formatMarkdown(content);
  }

  // Nếu là HTML, cần parse trước (sẽ được xử lý bởi htmlToMarkdown)
  return content;
}

