# app.py - Main Flask application file
from flask import Flask, render_template, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import csv
import io
import os
import socket
import logging
import tempfile
import werkzeug.utils

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mathkb.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
db = SQLAlchemy(app)

# Define the many-to-many relationship table
knowledge_item_tags = db.Table('knowledge_item_tags',
    db.Column('knowledge_item_id', db.Integer, db.ForeignKey('knowledge_items.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key=True)
)

# Define the KnowledgeItem model
class KnowledgeItem(db.Model):
    __tablename__ = 'knowledge_items'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tags = db.relationship('Tag', secondary=knowledge_item_tags, backref=db.backref('knowledge_items', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'tags': [tag.name for tag in self.tags]
        }

# Define the Tag model
class Tag(db.Model):
    __tablename__ = 'tags'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def __repr__(self):
        return f"<Tag {self.name}>"

# Create database tables
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

# API to get all knowledge items
@app.route('/api/knowledge', methods=['GET'])
def get_knowledge():
    # Get sort parameters
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    # Validate sort_by parameter
    valid_sort_fields = ['created_at', 'updated_at']
    if sort_by not in valid_sort_fields:
        sort_by = 'created_at'
    
    # Build query with sorting
    query = KnowledgeItem.query
    
    if sort_order.lower() == 'asc':
        query = query.order_by(getattr(KnowledgeItem, sort_by))
    else:
        query = query.order_by(getattr(KnowledgeItem, sort_by).desc())
    
    items = query.all()
    return jsonify([item.to_dict() for item in items])

# API to get a single knowledge item
@app.route('/api/knowledge/<int:id>', methods=['GET'])
def get_knowledge_item(id):
    item = KnowledgeItem.query.get_or_404(id)
    return jsonify(item.to_dict())

# API to create a new knowledge item
@app.route('/api/knowledge', methods=['POST'])
def create_knowledge():
    data = request.json
    content = data.get('content')
    tag_names = data.get('tags', [])
    
    # Create new knowledge item
    new_item = KnowledgeItem(content=content)
    
    # Process tags
    for tag_name in tag_names:
        tag = Tag.query.filter_by(name=tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.session.add(tag)
        new_item.tags.append(tag)
    
    db.session.add(new_item)
    db.session.commit()
    
    return jsonify(new_item.to_dict()), 201

# API to update a knowledge item
@app.route('/api/knowledge/<int:id>', methods=['PUT'])
def update_knowledge(id):
    item = KnowledgeItem.query.get_or_404(id)
    data = request.json
    
    if 'content' in data:
        item.content = data['content']
    
    if 'tags' in data:
        # Clear existing tags
        item.tags = []
        
        # Add new tags
        for tag_name in data['tags']:
            tag = Tag.query.filter_by(name=tag_name).first()
            if not tag:
                tag = Tag(name=tag_name)
                db.session.add(tag)
            item.tags.append(tag)
    
    db.session.commit()
    return jsonify(item.to_dict())

# API to delete a knowledge item
@app.route('/api/knowledge/<int:id>', methods=['DELETE'])
def delete_knowledge(id):
    item = KnowledgeItem.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return '', 204

# API to get all tags
@app.route('/api/tags', methods=['GET'])
def get_tags():
    tags = Tag.query.all()
    return jsonify([tag.name for tag in tags])

# API to get tag counts
@app.route('/api/tags/counts', methods=['GET'])
def get_tag_counts():
    tag_counts = {}
    tags = Tag.query.all()
    
    for tag in tags:
        tag_counts[tag.name] = tag.knowledge_items.count()
    
    return jsonify(tag_counts)

# API to update a tag name
@app.route('/api/tags/<tag_name>', methods=['PUT'])
def update_tag(tag_name):
    data = request.json
    new_name = data.get('new_name')
    
    if not new_name or new_name.strip() == '':
        return jsonify({'error': 'New tag name cannot be empty'}), 400
    
    if Tag.query.filter_by(name=new_name).first():
        return jsonify({'error': 'Tag already exists'}), 400
    
    tag = Tag.query.filter_by(name=tag_name).first()
    if not tag:
        return jsonify({'error': 'Tag not found'}), 404
    
    tag.name = new_name
    db.session.commit()
    
    return jsonify({'name': new_name}), 200

# API to delete a tag
@app.route('/api/tags/<tag_name>', methods=['DELETE'])
def delete_tag(tag_name):
    tag = Tag.query.filter_by(name=tag_name).first()
    if not tag:
        return jsonify({'error': 'Tag not found'}), 404
    
    # Remove the tag from all knowledge items
    for item in tag.knowledge_items:
        item.tags.remove(tag)
    
    db.session.delete(tag)
    db.session.commit()
    
    return '', 204

# API to filter knowledge items by tags
@app.route('/api/knowledge/filter', methods=['GET'])
def filter_knowledge():
    tag_filter = request.args.get('tags')
    
    if not tag_filter:
        items = KnowledgeItem.query.all()
    else:
        tag_names = tag_filter.split(',')
        items = KnowledgeItem.query.join(KnowledgeItem.tags).filter(Tag.name.in_(tag_names)).all()
    
    return jsonify([item.to_dict() for item in items])

# API to search knowledge items by content
@app.route('/api/knowledge/search', methods=['GET'])
def search_knowledge():
    query = request.args.get('q', '')
    items = KnowledgeItem.query.filter(KnowledgeItem.content.like(f'%{query}%')).all()
    return jsonify([item.to_dict() for item in items])

# API for advanced search
@app.route('/api/knowledge/advanced-search', methods=['POST'])
def advanced_search():
    search_params = request.json
    
    # Start with all items
    query = KnowledgeItem.query
    
    # Filter by keywords if provided
    if 'keywords' in search_params and search_params['keywords']:
        keywords = search_params['keywords'].strip()
        
        # Parse quoted terms for exact matches
        exact_terms = []
        import re
        quoted_pattern = r'"([^"]*)"'
        for quoted_match in re.finditer(quoted_pattern, keywords):
            exact_terms.append(quoted_match.group(1))
            # Remove the quoted term from the original keywords
            keywords = keywords.replace(quoted_match.group(0), '')
        
        # Filter by exact match terms (terms in quotes)
        for term in exact_terms:
            if term.strip():
                query = query.filter(KnowledgeItem.content.ilike(f'%{term}%'))
        
        # Handle remaining keywords as individual words if not in exact match mode
        if keywords.strip() and not search_params.get('exact_match', False):
            # Split by whitespace and filter out empty strings
            word_list = [word.strip() for word in keywords.split() if word.strip()]
            for word in word_list:
                query = query.filter(KnowledgeItem.content.ilike(f'%{word}%'))
        elif keywords.strip() and search_params.get('exact_match', False):
            # If exact match mode is enabled, search for the exact phrase
            query = query.filter(KnowledgeItem.content.ilike(f'%{keywords.strip()}%'))
    
    # Filter by date range if provided
    if 'start_date' in search_params and search_params['start_date']:
        start_date = datetime.strptime(search_params['start_date'], '%Y-%m-%d')
        query = query.filter(KnowledgeItem.created_at >= start_date)
    
    if 'end_date' in search_params and search_params['end_date']:
        end_date = datetime.strptime(search_params['end_date'] + ' 23:59:59', '%Y-%m-%d %H:%M:%S')
        query = query.filter(KnowledgeItem.created_at <= end_date)
    
    # Apply sorting if provided, default to newest first
    sort_by = search_params.get('sort_by', 'created_at')
    sort_order = search_params.get('sort_order', 'desc')
    
    if sort_order.lower() == 'asc':
        query = query.order_by(getattr(KnowledgeItem, sort_by))
    else:
        query = query.order_by(getattr(KnowledgeItem, sort_by).desc())
    
    # Execute query
    items = query.all()
    return jsonify([item.to_dict() for item in items])

# API to filter knowledge items by advanced tag criteria
@app.route('/api/knowledge/advanced-tag-filter', methods=['POST'])
def advanced_tag_filter():
    filter_params = request.json
    
    # Base query
    query = KnowledgeItem.query
    
    # Tags to include (AND)
    if 'include_all' in filter_params and filter_params['include_all']:
        for tag_name in filter_params['include_all']:
            tag = Tag.query.filter_by(name=tag_name).first()
            if tag:
                query = query.filter(KnowledgeItem.tags.contains(tag))
    
    # At least one of these tags (OR)
    if 'include_any' in filter_params and filter_params['include_any']:
        tag_names = filter_params['include_any']
        tags = Tag.query.filter(Tag.name.in_(tag_names)).all()
        if tags:
            # Subquery to find items with any of these tags
            subquery = db.session.query(knowledge_item_tags.c.knowledge_item_id)\
                .join(Tag, knowledge_item_tags.c.tag_id == Tag.id)\
                .filter(Tag.name.in_(tag_names))\
                .distinct()
            query = query.filter(KnowledgeItem.id.in_(subquery))
    
    # Exclude items with these tags
    if 'exclude' in filter_params and filter_params['exclude']:
        tag_names = filter_params['exclude']
        for tag_name in tag_names:
            tag = Tag.query.filter_by(name=tag_name).first()
            if tag:
                query = query.filter(~KnowledgeItem.tags.contains(tag))
    
    # Execute query
    items = query.all()
    return jsonify([item.to_dict() for item in items])

# API to export knowledge items
@app.route('/api/export', methods=['GET'])
def export_knowledge():
    format_type = request.args.get('format', 'json')
    tag_filter = request.args.get('tags')
    
    # Get items based on tag filter
    if not tag_filter:
        items = KnowledgeItem.query.all()
    else:
        tag_names = tag_filter.split(',')
        items = KnowledgeItem.query.join(KnowledgeItem.tags).filter(Tag.name.in_(tag_names)).all()
    
    if format_type == 'json':
        return export_json(items)
    elif format_type == 'txt':
        return export_txt(items)
    elif format_type == 'csv':
        return export_csv(items)
    else:
        return jsonify({'error': 'Unsupported format'}), 400

def export_json(items):
    data = [item.to_dict() for item in items]
    return jsonify(data)

def export_txt(items):
    output = io.StringIO()
    # Modified format: {content1};{content2} with no tags or metadata
    contents = [f"{{{item.content}}}" for item in items]
    output.write(';'.join(contents))
    
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/plain',
        as_attachment=True,
        download_name='mathkb_export.txt'
    )

def export_csv(items):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Content', 'Tags', 'Created', 'Updated'])
    
    for item in items:
        tags_str = ','.join([tag.name for tag in item.tags])
        writer.writerow([item.content, tags_str, item.created_at, item.updated_at])
    
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name='mathkb_export.csv'
    )

# API to get import templates
@app.route('/api/import/templates/<format_type>', methods=['GET'])
def get_import_template(format_type):
    if format_type == 'json':
        template = [
            {
                "content": "Example content 1 with LaTeX: $E = mc^2$",
                "tags": ["physics", "equation"]
            },
            {
                "content": "Example content 2 with LaTeX: $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$",
                "tags": ["math", "summation"]
            }
        ]
        return jsonify(template)
    
    elif format_type == 'txt':
        template = "{Example content 1 with LaTeX: $E = mc^2$};{Example content 2 with LaTeX: $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$}"
        return send_file(
            io.BytesIO(template.encode('utf-8')),
            mimetype='text/plain',
            as_attachment=True,
            download_name='mathkb_template.txt'
        )
    
    elif format_type == 'csv':
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Content', 'Tags'])
        writer.writerow(['Example content 1 with LaTeX: $E = mc^2$', 'physics,equation'])
        writer.writerow(['Example content 2 with LaTeX: $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$', 'math,summation'])
        
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='mathkb_template.csv'
        )
    
    else:
        return jsonify({'error': 'Unsupported format'}), 400

# API to preview imported data
@app.route('/api/import/preview', methods=['POST'])
def preview_import():
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    # Check if file is empty
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Determine file type from extension
    filename = file.filename.lower()
    
    try:
        # Process file based on extension
        if filename.endswith('.json'):
            content = file.read().decode('utf-8')
            data = json.loads(content)
            
            # Validate data format
            if not isinstance(data, list):
                return jsonify({'error': 'JSON file must contain an array of items'}), 400
            
            items = []
            for item in data:
                if not isinstance(item, dict) or 'content' not in item:
                    continue
                    
                item_data = {
                    'content': item.get('content', ''),
                    'tags': item.get('tags', [])
                }
                items.append(item_data)
            
            return jsonify({'items': items, 'format': 'json'})
        
        elif filename.endswith('.txt'):
            content = file.read().decode('utf-8')
            # Parse the {content1};{content2} format
            items = []
            
            if content:
                # Split by semicolons
                parts = content.split(';')
                
                for part in parts:
                    # Extract content between curly braces
                    if part.startswith('{') and part.endswith('}'):
                        content_text = part[1:-1]  # Remove the curly braces
                        if content_text.strip():
                            items.append({
                                'content': content_text,
                                'tags': []
                            })
            
            return jsonify({'items': items, 'format': 'txt'})
        
        elif filename.endswith('.csv'):
            content = file.read().decode('utf-8')
            reader = csv.reader(io.StringIO(content))
            
            # Get header row
            try:
                headers = next(reader)
            except StopIteration:
                return jsonify({'error': 'CSV file is empty or invalid'}), 400
            
            # Determine column indices
            content_idx = -1
            tags_idx = -1
            
            for i, header in enumerate(headers):
                header_lower = header.lower()
                if header_lower == 'content':
                    content_idx = i
                elif header_lower == 'tags':
                    tags_idx = i
            
            if content_idx == -1:
                return jsonify({'error': 'CSV file must contain a "Content" column'}), 400
            
            # Process rows
            items = []
            for row in reader:
                if len(row) <= content_idx:
                    continue
                
                content_text = row[content_idx]
                
                # Process tags if available
                tags = []
                if tags_idx != -1 and len(row) > tags_idx and row[tags_idx]:
                    tags = [tag.strip() for tag in row[tags_idx].split(',')]
                
                if content_text.strip():
                    items.append({
                        'content': content_text,
                        'tags': tags
                    })
            
            return jsonify({'items': items, 'format': 'csv'})
        
        else:
            return jsonify({'error': 'Unsupported file format. Please upload a JSON, TXT, or CSV file.'}), 400
    
    except Exception as e:
        return jsonify({'error': f'Error processing file: {str(e)}'}), 400

# API to import knowledge items
@app.route('/api/import/confirm', methods=['POST'])
def confirm_import():
    data = request.json
    items = data.get('items', [])
    
    if not items:
        return jsonify({'message': 'No items to import'}), 200
    
    imported_count = 0
    
    # First, ensure all tags exist
    all_tag_names = set()
    for item_data in items:
        tag_names = item_data.get('tags', [])
        for tag_name in tag_names:
            all_tag_names.add(tag_name.strip())
    
    # Create missing tags first and commit them to ensure they exist
    for tag_name in all_tag_names:
        if not tag_name:
            continue
        
        tag = Tag.query.filter_by(name=tag_name).first()
        if not tag:
            new_tag = Tag(name=tag_name)
            db.session.add(new_tag)
    
    # Commit tags first to ensure they're available for the items
    db.session.commit()
    
    for item_data in items:
        content = item_data.get('content', '').strip()
        tag_names = item_data.get('tags', [])
        
        if not content:
            continue
        
        # Create new knowledge item
        new_item = KnowledgeItem(content=content)
        
        # Process tags - now we know they all exist
        for tag_name in tag_names:
            tag_name = tag_name.strip()
            if not tag_name:
                continue
                
            tag = Tag.query.filter_by(name=tag_name).first()
            if tag:  # This should always be true now
                new_item.tags.append(tag)
        
        db.session.add(new_item)
        imported_count += 1
    
    db.session.commit()
    
    return jsonify({
        'message': f'Successfully imported {imported_count} items',
        'count': imported_count
    }), 200

def find_free_port(start_port=5000, max_attempts=50):
    """
    Find a free port on localhost starting from start_port.
    
    Args:
        start_port (int): The port to start checking from
        max_attempts (int): Maximum number of ports to check
        
    Returns:
        int: A free port number, or None if no free port is found
    """
    logging.info(f"Searching for a free port starting at {start_port}")
    
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                logging.info(f"Found free port: {port}")
                return port
        except OSError:
            logging.debug(f"Port {port} is in use, trying next port")
    
    logging.error(f"No free ports found after {max_attempts} attempts starting from {start_port}")
    return None

def setup_app_port():
    """
    Set up the port for the Flask application with fallback to auto-discovery.
    
    Returns:
        tuple: (host, port, debug_mode)
    """
    # Get environment variables, with defaults
    host = os.environ.get('MATHKB_HOST', '0.0.0.0')
    port = os.environ.get('MATHKB_PORT')
    start_port = int(os.environ.get('MATHKB_START_PORT', 5000))
    debug_mode = os.environ.get('MATHKB_DEBUG', 'True').lower() in ('true', '1', 't')
    
    # Configure logging
    log_level = logging.DEBUG if debug_mode else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Use the specified port if provided
    if port:
        try:
            return host, int(port), debug_mode
        except ValueError:
            logging.error(f"Invalid port specified: {port}. Using port auto-discovery.")
    
    # Find a free port
    port = find_free_port(start_port=start_port)
    if port is None:
        # If no port is found, default to the starting port and let the application 
        # handle the potential error when it tries to bind
        logging.warning(f"No free ports found. Defaulting to {start_port} which may not be available.")
        port = start_port
    
    return host, port, debug_mode

if __name__ == '__main__':
    host, port, debug_mode = setup_app_port()
    
    # Log the URL where the application will be available
    protocol = "http"
    if host == '0.0.0.0':
        url = f"{protocol}://localhost:{port}"
        url_network = f"{protocol}://<your-network-ip>:{port}"
        print(f"MathKB-Local is running at:")
        print(f"  Local:    {url}")
        print(f"  Network:  {url_network}")
    else:
        url = f"{protocol}://{host}:{port}"
        print(f"MathKB-Local is running at: {url}")
    
    # Run the application
    try:
        app.run(host=host, port=port, debug=debug_mode)
    except OSError as e:
        logging.error(f"Failed to start the application: {e}")
        print(f"Error: Could not start server on port {port}. The port may be in use.")
        print("Please try setting a different port with the MATHKB_PORT environment variable.")
        exit(1)
