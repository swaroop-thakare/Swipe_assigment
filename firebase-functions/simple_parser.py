#!/usr/bin/env python3
"""
Simple Resume Parser - Works without external dependencies
Based on the professional agent pattern but simplified for easy deployment.
"""

import json
import re
import io
import base64
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS

# Try to import PDF libraries, but don't fail if they're not available
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

# Suppress noisy logging
logging.getLogger('werkzeug').setLevel(logging.WARNING)

class SimpleResumeParser:
    """
    Simple Resume Parser with professional error handling
    """

    def __init__(self):
        """Initialize with logging."""
        self.logger = logging.getLogger(self.__class__.__name__)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)

        self.logger.info("SimpleResumeParser initialized")
        self.logger.info(f"PDF Support: {'✅' if PDF_AVAILABLE or PDFPLUMBER_AVAILABLE else '❌'}")
        self.logger.info(f"DOCX Support: {'✅' if DOCX_AVAILABLE else '❌'}")

    def process_resume(self, file_data: bytes, filename: str, file_type: str) -> Dict[str, Any]:
        """
        Process a resume file and extract profile information.
        
        Args:
            file_data (bytes): Raw file content
            filename (str): Original filename
            file_type (str): MIME type of the file
            
        Returns:
            Dict[str, Any]: Structured profile information
        """
        start_time = datetime.now()
        self.logger.info(f"Processing: {filename} (type: {file_type})")
        
        try:
            # Extract text based on file type
            if file_type == 'application/pdf':
                text = self._extract_pdf_text(file_data)
            elif file_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                text = self._extract_docx_text(file_data)
            else:
                return self._create_fallback_response(f"Unsupported file type: {file_type}")

            if not text.strip():
                return self._create_fallback_response("Could not extract text from file")

            # Extract profile information
            profile = self._extract_profile_info(text)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            self.logger.info(f"✅ Processed {filename} in {processing_time:.2f}s")
            
            # Return only the profile fields that the frontend expects
            return {
                "name": profile.get("name", ""),
                "email": profile.get("email", ""),
                "phone": profile.get("phone", ""),
                "_fallback": profile.get("_fallback", False),
                "_error": profile.get("_error", ""),
                "_missing_fields": profile.get("_missing_fields", []),
                "_message": profile.get("_message", "")
            }
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            self.logger.error(f"❌ Error processing {filename}: {e}")
            
            return self._create_fallback_response(f"Processing failed: {str(e)}")

    def _extract_pdf_text(self, file_data: bytes) -> str:
        """Extract text from PDF using available methods."""
        self.logger.info("Extracting PDF text...")
        
        # Try pdfplumber first (better quality)
        if PDFPLUMBER_AVAILABLE:
            try:
                with pdfplumber.open(io.BytesIO(file_data)) as pdf:
                    text = ""
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                    if text.strip():
                        self.logger.info(f"✅ PDF text extracted: {len(text)} chars")
                        return text
            except Exception as e:
                self.logger.warning(f"pdfplumber failed: {e}")
        
        # Fallback to PyPDF2
        if PDF_AVAILABLE:
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_data))
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                self.logger.info(f"✅ PDF text extracted: {len(text)} chars")
                return text
            except Exception as e:
                self.logger.error(f"PyPDF2 failed: {e}")
        
        raise Exception("No PDF processing libraries available")

    def _extract_docx_text(self, file_data: bytes) -> str:
        """Extract text from DOCX file."""
        if not DOCX_AVAILABLE:
            raise Exception("DOCX processing library not available")
        
        self.logger.info("Extracting DOCX text...")
        try:
            doc = Document(io.BytesIO(file_data))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            self.logger.info(f"✅ DOCX text extracted: {len(text)} chars")
            return text
        except Exception as e:
            self.logger.error(f"DOCX extraction failed: {e}")
            raise

    def _extract_profile_info(self, text: str) -> Dict[str, Any]:
        """Extract structured profile information from text."""
        self.logger.info("Extracting profile information...")
        
        profile = {
            "name": self._extract_name(text),
            "email": self._extract_email(text),
            "phone": self._extract_phone(text)
        }
        
        # Check if we have essential information
        missing_fields = [k for k, v in profile.items() if not v and k in ['name', 'email', 'phone']]
        
        if missing_fields:
            profile["_fallback"] = True
            profile["_missing_fields"] = missing_fields
            profile["_message"] = f"Missing: {', '.join(missing_fields)}. Please enter manually."
        
        self.logger.info(f"Profile extracted. Missing: {missing_fields}")
        return profile

    def _extract_name(self, text: str) -> Optional[str]:
        """Extract candidate name from resume text."""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        # Look for name patterns in first few lines
        name_patterns = [
            r'^[A-Z][a-z]+ [A-Z][a-z]+$',  # First Last
            r'^[A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+$',  # First M. Last
            r'^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$'  # First Middle Last
        ]
        
        for line in lines[:10]:  # Check first 10 lines
            if not any(char in line.lower() for char in ['@', 'phone', 'email', 'tel', 'fax']):
                for pattern in name_patterns:
                    if re.match(pattern, line):
                        return line
        return None

    def _extract_email(self, text: str) -> Optional[str]:
        """Extract email address from text."""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, text)
        return match.group(0) if match else None

    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number from text."""
        phone_patterns = [
            r'(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',
            r'(\+?[0-9]{1,3}[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',
            r'\+?[0-9]{10,15}'
        ]
        
        for pattern in phone_patterns:
            match = re.search(pattern, text)
            if match:
                phone = re.sub(r'\D', '', match.group(0))
                if len(phone) >= 10:
                    return phone
        return None

    def _create_fallback_response(self, message: str) -> Dict[str, Any]:
        """Create a fallback response when processing fails."""
        return {
            "name": "",
            "email": "",
            "phone": "",
            "_fallback": True,
            "_error": message
        }

# Flask app setup
app = Flask(__name__)
CORS(app)

# Initialize the parser
parser = SimpleResumeParser()

@app.route('/parse-resume', methods=['POST'])
def parse_resume():
    """Flask endpoint for resume parsing."""
    try:
        data = request.get_json()
        
        if not data or 'file' not in data:
            return jsonify({"error": "No file provided"}), 400
        
        # Decode base64 file content
        file_content = base64.b64decode(data['file'])
        file_type = data.get('type', '')
        filename = data.get('filename', 'unknown')
        
        # Process the resume
        result = parser.process_resume(file_content, filename, file_type)
        
        return jsonify(result)
        
    except Exception as e:
        parser.logger.error(f"Endpoint error: {e}")
        return jsonify({
            "status": "ERROR",
            "error": str(e),
            **parser._create_fallback_response(f"Server error: {str(e)}")
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "simple-resume-parser",
        "timestamp": datetime.now().isoformat(),
        "pdf_available": PDF_AVAILABLE or PDFPLUMBER_AVAILABLE,
        "docx_available": DOCX_AVAILABLE,
        "version": "1.0.0"
    })

if __name__ == '__main__':
    print("🚀 Starting Simple Resume Parser...")
    print("📄 PDF Support:", "✅" if PDF_AVAILABLE or PDFPLUMBER_AVAILABLE else "❌")
    print("📝 DOCX Support:", "✅" if DOCX_AVAILABLE else "❌")
    print("🌐 Server: http://localhost:5006")
    print("🔗 Health: http://localhost:5006/health")
    print("📋 Parse: http://localhost:5006/parse-resume")
    print()
    
    app.run(debug=True, host='0.0.0.0', port=5006)
