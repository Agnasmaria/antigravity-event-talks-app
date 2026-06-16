import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
ATOM_NS = {'atom': 'http://www.w3.org/2005/Atom'}

def test_parse():
    print("Fetching release notes from feed...")
    response = requests.get(FEED_URL)
    print(f"Status Code: {response.status_code}")
    response.raise_for_status()
    
    print("Parsing Atom XML...")
    root = ET.fromstring(response.content)
    
    entries = root.findall('atom:entry', ATOM_NS)
    print(f"Found {len(entries)} raw entries in the feed.")
    
    total_parsed_updates = 0
    categories = {}
    
    for i, entry in enumerate(entries[:5]): # Check first 5 entries
        date_str = entry.find('atom:title', ATOM_NS).text.strip()
        print(f"\n--- Entry {i+1}: {date_str} ---")
        
        content_elem = entry.find('atom:content', ATOM_NS)
        if content_elem is None or not content_elem.text:
            print("No content found.")
            continue
            
        soup = BeautifulSoup(content_elem.text, 'html.parser')
        
        current_category = "General"
        current_elements = []
        entry_updates = []
        
        for child in soup.contents:
            if child.name == 'h3':
                if current_elements:
                    desc_text = "".join(el.get_text() if hasattr(el, 'get_text') else str(el) for el in current_elements).strip()
                    entry_updates.append((current_category, desc_text))
                    current_elements = []
                current_category = child.get_text().strip()
            elif child.name is not None or (isinstance(child, str) and child.strip()):
                current_elements.append(child)
                
        if current_elements:
            desc_text = "".join(el.get_text() if hasattr(el, 'get_text') else str(el) for el in current_elements).strip()
            entry_updates.append((current_category, desc_text))
            
        print(f"Split entry into {len(entry_updates)} updates:")
        for category, text in entry_updates:
            total_parsed_updates += 1
            categories[category] = categories.get(category, 0) + 1
            snippet = text[:60] + "..." if len(text) > 60 else text
            print(f"  [{category}] {snippet}")
            
    print("\nSummary of categories in first 5 entries:")
    for cat, count in categories.items():
        print(f"  {cat}: {count}")
        
    print("\nParser test completed successfully!")

if __name__ == '__main__':
    test_parse()
