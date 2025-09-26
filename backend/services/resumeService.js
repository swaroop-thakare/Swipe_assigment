const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const aiService = require('./aiService');

class ResumeService {
  async parsePDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  async parseDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }

  async extractProfile(resumeText) {
    try {
      // First try AI extraction
      const aiResult = await aiService.extractProfileFromResume(resumeText);
      
      if (aiResult.confidence > 0.8) {
        return {
          name: aiResult.name,
          email: aiResult.email,
          phone: aiResult.phone,
          extractedBy: 'ai',
          confidence: aiResult.confidence
        };
      }
      
      // Fallback to regex extraction
      return this.regexExtraction(resumeText);
      
    } catch (error) {
      console.error('AI extraction failed, using regex:', error);
      return this.regexExtraction(resumeText);
    }
  }

  regexExtraction(text) {
    const profile = {
      name: null,
      email: null,
      phone: null,
      extractedBy: 'regex',
      confidence: 0.5
    };

    // Extract email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      profile.email = emailMatch[0];
    }

    // Extract phone (various formats)
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      profile.phone = phoneMatch[0].replace(/\D/g, '').replace(/^1/, '');
    }

    // Extract name (look for common patterns)
    const lines = text.split('\n').filter(line => line.trim());
    const namePatterns = [
      /^[A-Z][a-z]+ [A-Z][a-z]+/, // First Last
      /^[A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+/, // First M. Last
      /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+/ // First Middle Last
    ];

    for (const line of lines.slice(0, 10)) { // Check first 10 lines
      for (const pattern of namePatterns) {
        if (pattern.test(line.trim()) && 
            !line.includes('@') && 
            !line.includes('phone') && 
            !line.includes('email')) {
          profile.name = line.trim();
          break;
        }
      }
      if (profile.name) break;
    }

    // Calculate confidence based on extracted fields
    const extractedFields = [profile.name, profile.email, profile.phone].filter(f => f !== null).length;
    profile.confidence = extractedFields / 3;

    return profile;
  }

  async processResume(file) {
    try {
      let resumeText;
      
      if (file.mimetype === 'application/pdf') {
        resumeText = await this.parsePDF(file.buffer);
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        resumeText = await this.parseDOCX(file.buffer);
      } else {
        throw new Error('Unsupported file type');
      }

      const profile = await this.extractProfile(resumeText);
      
      return {
        success: true,
        profile,
        resumeText: resumeText.substring(0, 1000), // First 1000 chars for preview
        fileType: file.mimetype,
        fileSize: file.size
      };

    } catch (error) {
      console.error('Resume processing error:', error);
      return {
        success: false,
        error: error.message,
        profile: { name: null, email: null, phone: null, extractedBy: 'none', confidence: 0 }
      };
    }
  }

  validateProfile(profile) {
    const missing = [];
    
    if (!profile.name || profile.name.trim() === '') {
      missing.push('name');
    }
    
    if (!profile.email || profile.email.trim() === '') {
      missing.push('email');
    }
    
    if (!profile.phone || profile.phone.trim() === '') {
      missing.push('phone');
    }

    return {
      isValid: missing.length === 0,
      missing,
      profile: {
        name: profile.name?.trim() || '',
        email: profile.email?.trim() || '',
        phone: profile.phone?.trim() || ''
      }
    };
  }
}

module.exports = new ResumeService();
