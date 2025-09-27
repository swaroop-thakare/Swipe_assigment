import json
import re
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import pdfplumber
from docx import Document
import base64

app = Flask(__name__)
CORS(app)

def extract_text_from_pdf(file_content):
    """Extract text from PDF using multiple methods for better accuracy"""
    try:
        # Method 1: Using pdfplumber (better for complex layouts)
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            if text.strip():
                return text
    except Exception as e:
        print(f"pdfplumber failed: {e}")
    
    try:
        # Method 2: Using PyPDF2 (fallback)
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"PyPDF2 failed: {e}")
        return ""

def extract_text_from_docx(file_content):
    """Extract text from DOCX file"""
    try:
        doc = Document(io.BytesIO(file_content))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        print(f"DOCX extraction failed: {e}")
        return ""

def extract_profile_info(text):
    """Extract name, email, and phone from text"""
    profile = {
        "name": None,
        "email": None,
        "phone": None
    }
    
    # Extract email
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_match = re.search(email_pattern, text)
    if email_match:
        profile["email"] = email_match.group(0)
    
    # Extract phone (various formats)
    phone_patterns = [
        r'(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',
        r'(\+?[0-9]{1,3}[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',
        r'\+?[0-9]{10,15}'
    ]
    
    for pattern in phone_patterns:
        phone_match = re.search(pattern, text)
        if phone_match:
            phone = re.sub(r'\D', '', phone_match.group(0))
            if len(phone) >= 10:
                profile["phone"] = phone
                break
    
    # Extract name (look for common patterns)
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Common name patterns
    name_patterns = [
        r'^[A-Z][a-z]+ [A-Z][a-z]+$',  # First Last
        r'^[A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+$',  # First M. Last
        r'^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$'  # First Middle Last
    ]
    
    for line in lines[:10]:  # Check first 10 lines
        if not any(char in line for char in ['@', 'phone', 'email', 'tel', 'fax']):
            for pattern in name_patterns:
                if re.match(pattern, line):
                    profile["name"] = line
                    break
            if profile["name"]:
                break
    
    return profile

@app.route('/parse-resume', methods=['POST'])
def parse_resume():
    """Parse resume and extract profile information"""
    try:
        data = request.get_json()
        
        if not data or 'file' not in data:
            return jsonify({"error": "No file provided"}), 400
        
        # Decode base64 file content
        file_content = base64.b64decode(data['file'])
        file_type = data.get('type', '')
        
        # Extract text based on file type
        if file_type == 'application/pdf':
            text = extract_text_from_pdf(file_content)
        elif file_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            text = extract_text_from_docx(file_content)
        else:
            return jsonify({"error": "Unsupported file type"}), 400
        
        if not text.strip():
            return jsonify({
                "name": "",
                "email": "",
                "phone": "",
                "_fallback": True,
                "_error": "Could not extract text from file. Please enter information manually."
            })
        
        # Extract profile information
        profile = extract_profile_info(text)
        
        return jsonify(profile)
        
    except Exception as e:
        print(f"Error parsing resume: {e}")
        return jsonify({
            "name": "",
            "email": "",
            "phone": "",
            "_fallback": True,
            "_error": f"Error parsing file: {str(e)}"
        })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "resume-parser"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
