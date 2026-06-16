from flask import Flask, jsonify, render_template, request
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
import time
import threading

app = Flask(__name__)

# Cache configuration
CACHE_EXPIRY_SECONDS = 3600  # Cache feed for 1 hour
cache_data = None
cache_timestamp = 0
cache_lock = threading.Lock()

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
ATOM_NS = {'atom': 'http://www.w3.org/2005/Atom'}

def parse_release_notes(xml_content):
    """Parses BigQuery release notes Atom feed into structured JSON-ready dictionary."""
    root = ET.fromstring(xml_content)
    parsed_updates = []
    
    for entry in root.findall('atom:entry', ATOM_NS):
        # Extract metadata
        date_str = entry.find('atom:title', ATOM_NS).text.strip()
        updated_str = entry.find('atom:updated', ATOM_NS).text.strip()
        
        link_elem = entry.find("atom:link[@rel='alternate']", ATOM_NS)
        href = link_elem.attrib.get('href') if link_elem is not None else "https://cloud.google.com/bigquery/docs/release-notes"
        
        content_elem = entry.find('atom:content', ATOM_NS)
        if content_elem is None or not content_elem.text:
            continue
            
        html_content = content_elem.text
        soup = BeautifulSoup(html_content, 'html.parser')
        
        current_category = "General"
        current_elements = []
        entry_updates = []
        
        # Parse the HTML structure (usually <h3>Category</h3> followed by paragraphs/lists)
        for child in soup.contents:
            if child.name == 'h3':
                # Save the accumulated section if it exists
                if current_elements:
                    desc_html = "".join(str(el) for el in current_elements).strip()
                    desc_text = "".join(el.get_text() if hasattr(el, 'get_text') else str(el) for el in current_elements).strip()
                    if desc_html:
                        entry_updates.append({
                            'category': current_category,
                            'description_html': desc_html,
                            'description_text': desc_text
                        })
                    current_elements = []
                current_category = child.get_text().strip()
            elif child.name is not None or (isinstance(child, str) and child.strip()):
                current_elements.append(child)
                
        # Save the final accumulated section
        if current_elements:
            desc_html = "".join(str(el) for el in current_elements).strip()
            desc_text = "".join(el.get_text() if hasattr(el, 'get_text') else str(el) for el in current_elements).strip()
            if desc_html:
                entry_updates.append({
                    'category': current_category,
                    'description_html': desc_html,
                    'description_text': desc_text
                })
                
        # Add entry updates to main list
        for update in entry_updates:
            # Clean up double slashes or absolute path conversions if necessary
            # e.g., make sure standard hyperlinks work
            parsed_updates.append({
                'date': date_str,
                'updated': updated_str,
                'link': href,
                'category': update['category'],
                'description_html': update['description_html'],
                'description_text': update['description_text']
            })
            
    return parsed_updates

def get_feed_data(force_refresh=False):
    """Retrieves and parses the feed with in-memory caching."""
    global cache_data, cache_timestamp
    
    current_time = time.time()
    
    with cache_lock:
        if force_refresh or not cache_data or (current_time - cache_timestamp > CACHE_EXPIRY_SECONDS):
            try:
                response = requests.get(FEED_URL, timeout=15)
                response.raise_for_status()
                parsed_data = parse_release_notes(response.content)
                cache_data = parsed_data
                cache_timestamp = current_time
            except Exception as e:
                # If loading fails but we have stale cache, keep it as fallback
                if cache_data:
                    print(f"Error fetching feed: {e}. Serving stale cache.")
                else:
                    raise e
                    
        return cache_data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def api_release_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        notes = get_feed_data(force_refresh=force_refresh)
        return jsonify({
            'status': 'success',
            'timestamp': cache_timestamp,
            'count': len(notes),
            'notes': notes
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
