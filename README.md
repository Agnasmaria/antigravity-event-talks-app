# Antigravity Event Talks App

Welcome to the **Antigravity Event Talks App** repository. This is a unified workspace containing a Flask-based data exploration dashboard and sample JSON datasets.

## Project Structure

```
├── bq-release-notes/       # Python Flask Web Application
│   ├── static/             # Frontend assets (CSS and JS)
│   ├── templates/          # HTML templates
│   ├── app.py              # Flask server and XML parser
│   ├── requirements.txt    # Python dependencies
│   └── test_parser.py      # Local XML parser validation script
├── Documents/              # Organized folder for text documents
├── Images/                 # Organized folder for image files
├── Videos/                 # Organized folder for video files
├── README.md               # Project documentation
├── reviews.json            # Synthetic smartphone reviews dataset
└── sales.json              # 7-day daily sales records dataset
```

---

## 🚀 BigQuery Release Notes Explorer

The core component of this repository is a premium web dashboard that fetches, parses, filters, and shares Google Cloud BigQuery release notes from the official Atom feed.

### Key Features
* **Live Feed Parser**: Parses the official XML feed and splits daily composite summaries into individual, clean update cards.
* **Category Filtering & Search**: Instant client-side filtering by categories (`Features`, `Issues`, `Breaking`, `Announcements`, `Changes`) and real-time keyword search.
* **In-Memory Caching**: Minimizes backend load by caching feed results with an automatic refresh indicator and force-sync capability.
* **X / Twitter Composer**: Select any update to open a custom dark-themed X composer modal. It auto-generates a post under the 280-character limit, shows a live preview card, and opens the X web intent to share.

### Getting Started

#### 1. Install Dependencies
Make sure you have Python installed, then run:
```bash
pip install -r bq-release-notes/requirements.txt
```

#### 2. Run the Application
Navigate to the Flask project and run the server:
```bash
cd bq-release-notes
python app.py
```

#### 3. Open in Browser
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 📊 Sample Datasets

### 1. Smartphone Reviews (`reviews.json`)
A dataset of 3 synthetic customer reviews for a smartphone (`SMARTPHONE_X`), featuring:
* `reviewId` (UUID)
* `productId`
* `rating` (1-5)
* `reviewText` (20-50 words)
* `reviewDate` (YYYY-MM-DD)

### 2. Daily Sales Records (`sales.json`)
A dataset representing 7 daily sales records across different regions, featuring:
* `date` (YYYY-MM-DD)
* `revenue` (float)
* `unitsSold` (integer)
* `region` (North, South, East, West)
