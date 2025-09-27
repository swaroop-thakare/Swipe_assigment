#!/usr/bin/env python3
"""
Local development server for testing the resume parser
Run this with: python run_local.py
"""

import json
import re
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64

# Try to import PDF libraries, fallback if not available
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("PyPDF2 not available, PDF parsing will be limited")

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False
    print("pdfplumber not available, using PyPDF2 only")

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("python-docx not available, DOCX parsing will not work")

app = Flask(__name__)
CORS(app)

def extract_text_from_pdf(file_content):
    """Extract text from PDF using available methods"""
    text = ""
    
    if PDFPLUMBER_AVAILABLE:
        try:
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                if text.strip():
                    return text
        except Exception as e:
            print(f"pdfplumber failed: {e}")
    
    if PDF_AVAILABLE:
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            print(f"PyPDF2 failed: {e}")
    
    return text

def extract_text_from_docx(file_content):
    """Extract text from DOCX file"""
    if not DOCX_AVAILABLE:
        return ""
    
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
            if not PDF_AVAILABLE and not PDFPLUMBER_AVAILABLE:
                return jsonify({
                    "name": "",
                    "email": "",
                    "phone": "",
                    "_fallback": True,
                    "_error": "PDF parsing libraries not available. Please install PyPDF2 or pdfplumber."
                })
            text = extract_text_from_pdf(file_content)
        elif file_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            if not DOCX_AVAILABLE:
                return jsonify({
                    "name": "",
                    "email": "",
                    "phone": "",
                    "_fallback": True,
                    "_error": "DOCX parsing library not available. Please install python-docx."
                })
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
    return jsonify({
        "status": "healthy", 
        "service": "resume-parser",
        "pdf_available": PDF_AVAILABLE,
        "pdfplumber_available": PDFPLUMBER_AVAILABLE,
        "docx_available": DOCX_AVAILABLE
    })

if __name__ == '__main__':
    print("🚀 Starting Resume Parser Server...")
    print("📄 PDF Support:", "✅" if PDF_AVAILABLE or PDFPLUMBER_AVAILABLE else "❌")
    print("📝 DOCX Support:", "✅" if DOCX_AVAILABLE else "❌")
    print("🌐 Server will be available at: http://localhost:5006")
    print("🔗 Health check: http://localhost:5006/health")
    print("📋 Parse endpoint: http://localhost:5006/parse-resume")
    print()
    
    app.run(debug=True, host='0.0.0.0', port=5006)
