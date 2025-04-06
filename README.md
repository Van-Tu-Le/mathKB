# MathKB - Your Personal Mathematics Knowledge Base

MathKB is a local web application designed to help you organize, search, and manage your mathematics knowledge. With support for LaTeX rendering, comprehensive tag management, and robust search capabilities, MathKB makes it easy to build your personal repository of mathematical concepts, theorems, proofs, and notes.


## Features

- **LaTeX Support**: Write and view mathematical expressions with full LaTeX support
- **Tag Organization**: Organize knowledge with tags, displayed alphabetically with item counts
- **Advanced Filtering**: Filter knowledge items with complex tag logic (AND, OR, WITHOUT)
- **Smart Search**: Search by keywords with Google-like syntax (including exact phrase matching)
- **Sorting Options**: Sort your knowledge items by creation or update date
- **Import/Export**: Import and export your knowledge in JSON, CSV, or TXT formats
- **Preview & Edit**: Preview your LaTeX content while editing
- **Responsive UI**: Works on desktop and mobile devices
- **Bulk Operations**: Perform actions on multiple items at once
- **Auto Port Selection**: Application automatically finds an available port to run on

## Installation

### Prerequisites
- Python 3.6 or higher
- pip (Python package manager)

### Setup

1. Clone the repository or download the files
   ```bash
   git clone https://github.com/Van-Tu-Le/mathKB.git
   cd mathkb
   ```

2. Create a virtual environment (recommended)
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Start the application
   ```bash
   python app.py
   ```

5. Open your browser and navigate to the URL displayed in the terminal (usually http://localhost:5000)

## Usage Guide

### Adding Knowledge Items

1. Click "Add New Item" in the sidebar
2. Enter your mathematical content using LaTeX for formulas (e.g., `$E = mc^2$`)
3. Add relevant tags separated by commas
4. Preview your content to ensure LaTeX renders correctly
5. Click "Save"

### Filtering by Tags

- Click on any tag in the sidebar to filter items containing that tag
- Use "Advanced Tag Filtering" for complex logic:
  - "ALL" - Items must have all selected tags
  - "ANY" - Items must have at least one of the selected tags
  - "WITHOUT" - Items must not have any of the excluded tags

### Searching Content

- Use the search box to find items containing specific text
- Advanced search supports:
  - Regular keywords (finds items with any of the words)
  - Exact phrase matching using quotes: `"exact phrase"`
  - Date range filtering
  - Custom sorting options

### Sorting Items

- Use the sorting controls to order items by:
  - Creation date (newest or oldest first)
  - Last update date (newest or oldest first)

### Managing Tags

1. Click "Manage Tags" in the sidebar
2. View all tags with their usage counts
3. Edit tag names or delete unused tags
4. Add new tags if needed

### Bulk Operations

1. Click "Bulk Edit" to enter bulk mode
2. Select multiple items using checkboxes
3. Choose an operation:
   - Edit tags (add/remove/replace)
   - Delete selected items
   - Export selected items

### Import and Export

#### Exporting Knowledge
- Use the Export buttons to save your knowledge in JSON, TXT, or CSV format
- Filter items before export to save specific subsets

#### Importing Knowledge
1. Click "Import Knowledge"
2. Download a template if needed
3. Upload your JSON, TXT, or CSV file
4. Preview and edit items before import
5. Click "Import" to add items to your database

## File Structure

```
mathkb/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── static/
│   ├── css/
│   │   └── style.css       # Application styles
│   └── js/
│       └── main.js         # Client-side JavaScript
└── templates/
    └── index.html          # Main HTML template
```

## Configuration

MathKB can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| MATHKB_HOST | The host to bind to | '0.0.0.0' |
| MATHKB_PORT | Specific port to use (overrides auto-discovery) | None |
| MATHKB_START_PORT | Starting port for auto-discovery | 5000 |
| MATHKB_DEBUG | Enable debug mode | 'True' |

Example:
```bash
# On Windows
set MATHKB_PORT=8080
python app.py

# On macOS/Linux
export MATHKB_PORT=8080
python app.py
```

## Database

MathKB uses SQLite for data storage. The database file (`mathkb.db`) is created in the root directory on first run.

### Database Schema

The application uses the following models:
- **KnowledgeItem**: Stores content, creation date, and update date
- **Tag**: Stores tag names
- **knowledge_item_tags**: Junction table for the many-to-many relationship

## Advanced Features

### LaTeX Support

MathKB uses MathJax to render LaTeX expressions. You can include inline math using `$...$` or `\(...\)` syntax.

Example:
```
The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$
```

### Tag Count Display

Tags are displayed with their item counts, making it easy to see which tags are most used.

### Word-Based Search

The search functionality splits your query into words and finds content containing any of these words. For exact phrases, use double quotes (e.g., `"binomial theorem"`).

### Import File Formats

MathKB supports three import formats:

1. **JSON**:
   ```json
   [
     {
       "content": "Example content with LaTeX: $E = mc^2$",
       "tags": ["physics", "equation"]
     }
   ]
   ```

2. **CSV**:
   ```
   Content,Tags
   "Example content with LaTeX: $E = mc^2$","physics,equation"
   ```

3. **TXT**:
   ```
   {Example content with LaTeX: $E = mc^2$};{Another example}
   ```

## Troubleshooting

### Application Won't Start
- Check if another application is using the default port
- Set a different port using the `MATHKB_PORT` environment variable

### LaTeX Not Rendering
- Ensure you're using proper LaTeX syntax with `$...$` delimiters
- Check your internet connection (MathJax is loaded from CDN)

### Search Not Finding Content
- For exact phrase searching, use quotes: `"exact phrase"`
- Search is case-insensitive, so capitalization doesn't matter

### Import Errors
- Ensure your file format matches the expected templates
- Check that JSON is valid using a JSON validator
- For CSV, make sure column names match expected headers

## Technologies Used

- **Backend**: Python, Flask, SQLAlchemy
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLite
- **LaTeX Rendering**: MathJax
- **CSS Framework**: Custom CSS

## License

This project is free to use!!!!

## Acknowledgments

- MathJax for LaTeX rendering
- Flask and SQLAlchemy for the backend framework
- The open-source community for inspiration and resources

---

Built with ❤️ for mathematics enthusiasts
