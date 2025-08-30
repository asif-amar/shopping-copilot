import json
import re
from typing import List, Dict, Any, Optional
from enum import Enum


class ParsingState(Enum):
    SEARCHING = "searching"
    INSIDE_PRODUCTS = "inside_products" 
    PARSING_JSON = "parsing_json"


class ProductStreamParser:
    """
    Real-time parser for streaming XML-wrapped product data.
    
    Handles partial chunks and streams individual products as soon as they're complete,
    without waiting for the entire product array to be received.
    """
    
    def __init__(self):
        self.state = ParsingState.SEARCHING
        self.buffer = ""
        self.json_buffer = ""
        self.brace_count = 0
        self.inside_string = False
        self.escape_next = False
        self.products_started = False
        self.text_before_products = ""
        
    def parse_chunk(self, chunk: str) -> List[Dict[str, Any]]:
        """
        Parse a chunk of streaming content and return parsed results.
        
        Returns a list of results, each with:
        - {'type': 'text', 'content': str} - Regular text content
        - {'type': 'product_start'} - Product section started
        - {'type': 'product', 'product': dict} - Individual product
        - {'type': 'product_end'} - Product section ended
        """
        results = []
        self.buffer += chunk
        
        while self.buffer:
            old_buffer_len = len(self.buffer)
            old_state = self.state
            
            if self.state == ParsingState.SEARCHING:
                results.extend(self._handle_searching_state())
            elif self.state == ParsingState.INSIDE_PRODUCTS:
                results.extend(self._handle_inside_products_state())
            elif self.state == ParsingState.PARSING_JSON:
                results.extend(self._handle_parsing_json_state())
                
            # Prevent infinite loops - if buffer didn't change and state didn't change, break
            if len(self.buffer) == old_buffer_len and self.state == old_state:
                break
                
        return results
    
    def _handle_searching_state(self) -> List[Dict[str, Any]]:
        """Handle the state where we're looking for the opening XML tag"""
        results = []
        
        # Look for opening tag
        start_tag = "<product_search_results>"
        tag_pos = self.buffer.find(start_tag)
        
        if tag_pos != -1:
            # Found opening tag
            before_tag = self.buffer[:tag_pos]
            if before_tag:
                results.append({'type': 'text', 'content': before_tag})
            
            # Signal that products section started
            results.append({'type': 'product_start'})
            self.products_started = True
            
            # Move to inside products state
            self.buffer = self.buffer[tag_pos + len(start_tag):]
            self.state = ParsingState.INSIDE_PRODUCTS
            self.json_buffer = ""
            
        else:
            # No tag found, but don't emit text yet in case tag is split across chunks
            # Only emit if buffer is getting large or we're sure there's no tag coming
            if len(self.buffer) > 100:
                # Emit most of the buffer, keep last 30 chars in case tag is split
                emit_length = len(self.buffer) - 30
                results.append({'type': 'text', 'content': self.buffer[:emit_length]})
                self.buffer = self.buffer[emit_length:]
            else:
                # Buffer is small, don't emit anything yet
                pass
                
        return results
    
    def _handle_inside_products_state(self) -> List[Dict[str, Any]]:
        """Handle the state where we're inside the product XML section"""
        results = []
        
        # Add current buffer content to json buffer for processing
        self.json_buffer += self.buffer
        self.buffer = ""
        
        # Look for individual product tags in the accumulated content
        while True:
            # Look for complete <product>...</product> tags
            product_start = self.json_buffer.find("<product>")
            if product_start == -1:
                break
                
            product_end = self.json_buffer.find("</product>", product_start)
            if product_end == -1:
                # Incomplete product tag, wait for more content
                break
            
            # Extract the product JSON content
            json_start = product_start + len("<product>")
            json_content = self.json_buffer[json_start:product_end].strip()
            
            try:
                product = json.loads(json_content)
                results.append({'type': 'product', 'product': product})
                print(f"📦 Streamed individual product: {product.get('name', 'Unknown')}")
            except json.JSONDecodeError as e:
                print(f"Error parsing individual product JSON: {e}")
                print(f"JSON content: {json_content[:200]}...")
            
            # Remove the processed product from buffer
            self.json_buffer = self.json_buffer[product_end + len("</product>"):]
        
        # Look for closing tag
        end_tag = "</product_search_results>"
        tag_pos = self.json_buffer.find(end_tag)
        
        if tag_pos != -1:
            # Found closing tag - signal end of products section
            results.append({'type': 'product_end'})
            
            # Move back to searching state for any content after
            remaining_content = self.json_buffer[tag_pos + len(end_tag):]
            self.buffer = remaining_content
            self.state = ParsingState.SEARCHING
            self.json_buffer = ""
            self.brace_count = 0
            self.inside_string = False
            self.escape_next = False
                
        return results
    
    def _handle_parsing_json_state(self) -> List[Dict[str, Any]]:
        """Handle JSON parsing state (currently not used but kept for future expansion)"""
        # This state could be used for more complex JSON parsing if needed
        return []
    
    def _extract_complete_products(self) -> List[Dict[str, Any]]:
        """Extract complete product JSON objects from the buffer using proper JSON parsing"""
        products = []
        
        if not self.json_buffer.strip():
            return products
        
        # Try to find complete JSON objects using brace counting
        buffer = self.json_buffer.strip()
        
        # Look for complete JSON objects by counting braces
        i = 0
        while i < len(buffer):
            # Skip whitespace and commas
            while i < len(buffer) and buffer[i] in ' \t\n\r,[':
                i += 1
            
            if i >= len(buffer):
                break
                
            # Found start of potential object
            if buffer[i] == '{':
                start = i
                brace_count = 0
                in_string = False
                escape_next = False
                
                # Count braces to find complete object
                while i < len(buffer):
                    char = buffer[i]
                    
                    if escape_next:
                        escape_next = False
                    elif char == '\\' and in_string:
                        escape_next = True
                    elif char == '"':
                        in_string = not in_string
                    elif not in_string:
                        if char == '{':
                            brace_count += 1
                        elif char == '}':
                            brace_count -= 1
                            
                    i += 1
                    
                    # Found complete object
                    if brace_count == 0:
                        obj_str = buffer[start:i].strip()
                        try:
                            product = json.loads(obj_str)
                            products.append(product)
                            
                            # Remove processed part from buffer
                            self.json_buffer = buffer[i:].lstrip(' \t\n\r,')
                            
                            # Return one product at a time for streaming
                            return [product]
                            
                        except json.JSONDecodeError as e:
                            print(f"JSON decode error: {e} for object: {obj_str}")
                            break
                        
                break
            else:
                i += 1
                
        return products
    
    def _extract_final_products(self) -> List[Dict[str, Any]]:
        """Extract any remaining products at the end of the array (without trailing comma)"""
        products = []
        
        if not self.json_buffer.strip():
            return products
            
        # Try to parse any remaining JSON objects
        # This is called when closing tag is found, so we need to get everything left
        buffer = self.json_buffer.strip()
        
        # Try to parse the entire remaining buffer as a complete JSON array or extract objects
        try:
            # First, try to parse the whole buffer as JSON array
            if buffer.startswith('[') and buffer.endswith(']'):
                products_array = json.loads(buffer)
                return products_array if isinstance(products_array, list) else []
        except json.JSONDecodeError:
            pass
        
        # If that fails, extract individual objects using the same logic
        max_iterations = 10  # Safety limit to prevent infinite loops
        iteration = 0
        while iteration < max_iterations and self.json_buffer.strip():
            extracted = self._extract_complete_products()
            if not extracted:
                break
            products.extend(extracted)
            iteration += 1
            
        return products
    
    def flush(self) -> List[Dict[str, Any]]:
        """Flush any remaining content from the buffer"""
        results = []
        
        # Then handle any remaining text buffer
        if self.buffer.strip():
            results.append({'type': 'text', 'content': self.buffer})
            self.buffer = ""
            
        return results