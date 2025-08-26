/**
 * Tool Call Parser Utility
 * Detects and manages tool calls from assistant messages with stable state
 */

import { ToolCallState } from '@/components/ToolCall';

/**
 * Parse and extract stable tool call state from message text
 * Now handles the new format: search_products_started, search_products_completed
 * Prioritizes completed status over started status when both are present
 */
export function parseToolCallFromText(text: string): { toolCall: ToolCallState | null; cleanText: string } {
  console.log('🔍 Raw input text:', JSON.stringify(text));
  
  let cleanText = text;

  // Handle the concatenated case: "search_products_startedsearch_products_completed"
  // First, let's find any "_started" or "_completed" and work backwards to find the tool name
  
  let toolName = null;
  let status = 'running';
  
  // Look for completed first (higher priority)
  const completedMatch = text.match(/([a-zA-Z_]+)_completed/);
  if (completedMatch) {
    toolName = completedMatch[1];
    status = 'completed';
    console.log('🔍 Found completed match:', completedMatch);
  } else {
    // Look for started
    const startedMatch = text.match(/([a-zA-Z_]+)_started/);
    if (startedMatch) {
      toolName = startedMatch[1];
      status = 'running';
      console.log('🔍 Found started match:', startedMatch);
    }
  }
  
  // If we found a tool name but it looks wrong (contains "started" or "completed"), 
  // extract just the actual tool name
  if (toolName && (toolName.includes('started') || toolName.includes('completed'))) {
    console.log('🔧 Tool name contains started/completed, fixing:', toolName);
    // Extract the part before "_started"
    const cleanMatch = toolName.match(/^([a-zA-Z_]+?)(?:_started|_completed|started|completed)/);
    if (cleanMatch) {
      toolName = cleanMatch[1];
      console.log('🔧 Cleaned tool name:', toolName);
    }
  }
  
  const matches = toolName ? [[`${toolName}_${status}`, toolName, status]] : [];
  
  console.log('🔍 All matches found:', matches);

  if (matches.length === 0) {
    // Pattern: Thinking process - "💭 ..." 
    const thinkingPattern = /💭\s*(.+)/g;
    const thinkingMatch = thinkingPattern.exec(text);

    if (thinkingMatch) {
      // Remove thinking pattern from clean text but don't show a tool call card
      cleanText = text.replace(/💭\s*[^\n]*\n?/g, '').trim();
      
      return {
        toolCall: null,
        cleanText
      };
    }
    
    // No tool call found
    return {
      toolCall: null,
      cleanText: text.trim()
    };
  }

  // We already have the best match from above logic
  const finalToolName = matches[0][1];
  const finalStatus = matches[0][2];
  
  console.log('🎯 Selected tool:', finalToolName, 'status:', finalStatus);
  
  // Remove ALL tool call patterns from text, regardless of which one we're displaying
  // Use a more aggressive approach to remove concatenated patterns
  cleanText = text
    .replace(/[a-zA-Z_]+_started/g, '')
    .replace(/[a-zA-Z_]+_completed/g, '');
  
  // Clean up extra whitespace and normalize
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  console.log('🧹 Clean text result:', JSON.stringify(cleanText));
  console.log('🏷️ Tool display name:', getToolDisplayName(finalToolName));
  
  return {
    toolCall: {
      toolName: finalToolName,
      displayName: getToolDisplayName(finalToolName),
      status: finalStatus as 'running' | 'completed'
    },
    cleanText
  };
}

/**
 * Get display name for tool
 */
export function getToolDisplayName(toolName: string): string {
  const toolNames: Record<string, string> = {
    'search_products': 'חיפוש מוצרים',
    'add_to_cart': 'הוספה לעגלה', 
    'get_cart': 'צפייה בעגלה',
    'remove_from_cart': 'הסרה מהעגלה',
    'get_product_details': 'פרטי מוצר',
    'search_deals': 'חיפוש מבצעים',
    'compare_prices': 'השוואת מחירים',
    'check_availability': 'בדיקת זמינות',
    'get_product_info': 'מידע על מוצר',
    'view_cart': 'צפייה בעגלה',
    'clear_cart': 'ניקוי עגלה'
  };

  return toolNames[toolName] || toolName.replace(/_/g, ' ');
}

/**
 * Get tool icon
 */
export function getToolIcon(toolName: string): string {
  const toolIcons: Record<string, string> = {
    'search_products': '🔍',
    'add_to_cart': '🛒',
    'get_cart': '🛍️',
    'remove_from_cart': '🗑️',
    'get_product_details': '📋',
    'search_deals': '💰',
    'compare_prices': '⚖️',
    'check_availability': '✅'
  };

  return toolIcons[toolName] || '🔧';
}