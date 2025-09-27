"""
Professional Resume Parser Agent
Inspired by the intake curation agent pattern for robust document processing.
"""

import json
import re
import io
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS

# PDF processing libraries
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

class ResumeParserAgent:
    """
    Professional Resume Parser Agent
    Extracts structured profile information from resumes with robust error handling.
    """

    def __init__(self):
        """Initialize the agent with professional logging."""
        self.logger = logging.getLogger(self.__class__.__name__)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)

        self.logger.info("ResumeParserAgent initialized")
        self.logger.info(f"PDF Support: {'✅' if PDF_AVAILABLE or PDFPLUMBER_AVAILABLE else '❌'}")
        self.logger.info(f"DOCX Support: {'✅' if DOCX_AVAILABLE else '❌'}")

    def process_resume(self, file_data: bytes, filename: str, file_type: str) -> Dict[str, Any]:
        """
        Main entry point for processing a resume file.
        
        Args:
            file_data (bytes): Raw file content
            filename (str): Original filename
            file_type (str): MIME type of the file
            
        Returns:
            Dict[str, Any]: Structured profile information
        """
        start_time = datetime.now()
        self.logger.info(f"Processing resume: {filename} (type: {file_type})")
        
        try:
            # Extract text based on file type
            if file_type == 'application/pdf':
                text = self._extract_pdf_text(file_data)
            elif file_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                text = self._extract_docx_text(file_data)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")

            if not text.strip():
                return self._create_fallback_response("Could not extract text from file")

            # Extract structured profile information
            profile = self._extract_profile_info(text)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            self.logger.info(f"Successfully processed {filename} in {processing_time:.2f}s")
            
            return {
                "status": "SUCCESS",
                "processing_time_seconds": processing_time,
                "filename": filename,
                "extracted_text_length": len(text),
                **profile
            }
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            self.logger.error(f"Error processing {filename}: {e}", exc_info=True)
            
            return {
                "status": "ERROR",
                "processing_time_seconds": processing_time,
                "filename": filename,
                "error": str(e),
                **self._create_fallback_response(f"Processing failed: {str(e)}")
            }

    def _extract_pdf_text(self, file_data: bytes) -> str:
        """Extract text from PDF using multiple methods for better accuracy."""
        self.logger.info("Extracting text from PDF...")
        
        # Method 1: Try pdfplumber first (better for complex layouts)
        if PDFPLUMBER_AVAILABLE:
            try:
                with pdfplumber.open(io.BytesIO(file_data)) as pdf:
                    text = ""
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                    if text.strip():
                        self.logger.info(f"PDF text extracted using pdfplumber: {len(text)} chars")
                        return text
            except Exception as e:
                self.logger.warning(f"pdfplumber failed: {e}")
        
        # Method 2: Fallback to PyPDF2
        if PDF_AVAILABLE:
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_data))
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                self.logger.info(f"PDF text extracted using PyPDF2: {len(text)} chars")
                return text
            except Exception as e:
                self.logger.error(f"PyPDF2 failed: {e}")
        
        raise Exception("No PDF processing libraries available")

    def _extract_docx_text(self, file_data: bytes) -> str:
        """Extract text from DOCX file."""
        if not DOCX_AVAILABLE:
            raise Exception("DOCX processing library not available")
        
        self.logger.info("Extracting text from DOCX...")
        try:
            doc = Document(io.BytesIO(file_data))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            self.logger.info(f"DOCX text extracted: {len(text)} chars")
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
            "phone": self._extract_phone(text),
            "skills": self._extract_skills(text),
            "experience": self._extract_experience(text),
            "education": self._extract_education(text),
            "summary": self._extract_summary(text)
        }
        
        # Check if we have essential information
        missing_fields = [k for k, v in profile.items() if not v and k in ['name', 'email', 'phone']]
        
        if missing_fields:
            profile["_fallback"] = True
            profile["_missing_fields"] = missing_fields
            profile["_message"] = f"Missing essential fields: {', '.join(missing_fields)}. Please enter manually."
        
        self.logger.info(f"Profile extraction complete. Missing fields: {missing_fields}")
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
            if not any(char in line.lower() for char in ['@', 'phone', 'email', 'tel', 'fax', 'linkedin']):
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

    def _extract_skills(self, text: str) -> List[str]:
        """Extract skills from resume text."""
        # Common technical skills
        skill_keywords = [
            'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'MongoDB',
            'AWS', 'Docker', 'Git', 'HTML', 'CSS', 'TypeScript', 'Angular', 'Vue.js',
            'Machine Learning', 'AI', 'Data Science', 'Analytics', 'Project Management'
        ]
        
        found_skills = []
        text_lower = text.lower()
        
        for skill in skill_keywords:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        return found_skills[:10]  # Limit to top 10 skills

    def _extract_experience(self, text: str) -> str:
        """Extract work experience summary."""
        # Look for experience-related sections
        experience_keywords = ['experience', 'work history', 'employment', 'career']
        
        lines = text.split('\n')
        experience_lines = []
        
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in experience_keywords):
                # Capture next few lines as experience
                for j in range(i, min(i + 10, len(lines))):
                    if lines[j].strip():
                        experience_lines.append(lines[j].strip())
        
        return ' '.join(experience_lines[:200])  # Limit length

    def _extract_education(self, text: str) -> str:
        """Extract education information."""
        education_keywords = ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd']
        
        lines = text.split('\n')
        education_lines = []
        
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in education_keywords):
                for j in range(i, min(i + 5, len(lines))):
                    if lines[j].strip():
                        education_lines.append(lines[j].strip())
        
        return ' '.join(education_lines[:100])  # Limit length

    def _extract_summary(self, text: str) -> str:
        """Extract professional summary or objective."""
        summary_keywords = ['summary', 'objective', 'profile', 'about']
        
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if any(keyword in line.lower() for keyword in summary_keywords):
                # Get next few lines as summary
                summary_lines = []
                for j in range(i + 1, min(i + 4, len(lines))):
                    if lines[j].strip():
                        summary_lines.append(lines[j].strip())
                return ' '.join(summary_lines[:150])  # Limit length
        
        return ""

    def _create_fallback_response(self, message: str) -> Dict[str, Any]:
        """Create a fallback response when processing fails."""
        return {
            "name": "",
            "email": "",
            "phone": "",
            "skills": [],
            "experience": "",
            "education": "",
            "summary": "",
            "_fallback": True,
            "_error": message
        }

# Flask app setup
app = Flask(__name__)
CORS(app)

# Initialize the agent
parser_agent = ResumeParserAgent()

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
        result = parser_agent.process_resume(file_content, filename, file_type)
        
        return jsonify(result)
        
    except Exception as e:
        parser_agent.logger.error(f"Endpoint error: {e}", exc_info=True)
        return jsonify({
            "status": "ERROR",
            "error": str(e),
            **parser_agent._create_fallback_response(f"Server error: {str(e)}")
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "resume-parser-agent",
        "timestamp": datetime.now().isoformat(),
        "pdf_available": PDF_AVAILABLE or PDFPLUMBER_AVAILABLE,
        "docx_available": DOCX_AVAILABLE,
        "version": "1.0.0"
    })

if __name__ == '__main__':
    print("🚀 Starting Professional Resume Parser Agent...")
    print("📄 PDF Support:", "✅" if PDF_AVAILABLE or PDFPLUMBER_AVAILABLE else "❌")
    print("📝 DOCX Support:", "✅" if DOCX_AVAILABLE else "❌")
    print("🌐 Server: http://localhost:5006")
    print("🔗 Health: http://localhost:5006/health")
    print("📋 Parse: http://localhost:5006/parse-resume")
    print()
    
    app.run(debug=True, host='0.0.0.0', port=5006)
