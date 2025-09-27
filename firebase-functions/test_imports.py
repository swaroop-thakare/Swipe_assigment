#!/usr/bin/env python3
"""
Test script to check if libraries are available
"""

print("Testing library imports...")

try:
    import PyPDF2
    print("✅ PyPDF2 imported successfully")
    print(f"   Version: {PyPDF2.__version__}")
    PDF_AVAILABLE = True
except ImportError as e:
    print(f"❌ PyPDF2 import failed: {e}")
    PDF_AVAILABLE = False

try:
    import pdfplumber
    print("✅ pdfplumber imported successfully")
    PDFPLUMBER_AVAILABLE = True
except ImportError as e:
    print(f"❌ pdfplumber import failed: {e}")
    PDFPLUMBER_AVAILABLE = False

try:
    from docx import Document
    print("✅ python-docx imported successfully")
    DOCX_AVAILABLE = True
except ImportError as e:
    print(f"❌ python-docx import failed: {e}")
    DOCX_AVAILABLE = False

print(f"\nFinal status:")
print(f"PDF_AVAILABLE: {PDF_AVAILABLE}")
print(f"PDFPLUMBER_AVAILABLE: {PDFPLUMBER_AVAILABLE}")
print(f"DOCX_AVAILABLE: {DOCX_AVAILABLE}")

# Test actual functionality
if PDF_AVAILABLE:
    try:
        # Create a simple PDF test
        import io
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(b"dummy"))
        print("✅ PyPDF2 functionality test passed")
    except Exception as e:
        print(f"❌ PyPDF2 functionality test failed: {e}")

if PDFPLUMBER_AVAILABLE:
    try:
        import io
        with pdfplumber.open(io.BytesIO(b"dummy")) as pdf:
            pass
        print("✅ pdfplumber functionality test passed")
    except Exception as e:
        print(f"❌ pdfplumber functionality test failed: {e}")
