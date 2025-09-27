import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Use a simple worker configuration that works
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
} catch (error) {
  // Fallback: disable worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = null
}

export const parsePDF = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText += pageText + ' '
    }

    return extractProfileInfo(fullText)
  } catch (error) {
    console.error('Error parsing PDF:', error)
    // Return a fallback profile that prompts for manual entry
    return {
      name: '',
      email: '',
      phone: '',
      _fallback: true,
      _error: 'PDF parsing failed. Please enter information manually.'
    }
  }
}

export const parseDOCX = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return extractProfileInfo(result.value)
  } catch (error) {
    console.error('Error parsing DOCX:', error)
    throw new Error('Failed to parse DOCX file')
  }
}

const extractProfileInfo = (text) => {
  const profile = {
    name: null,
    email: null,
    phone: null
  }

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  const emailMatch = text.match(emailRegex)
  if (emailMatch) {
    profile.email = emailMatch[0]
  }

  // Extract phone (various formats)
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/
  const phoneMatch = text.match(phoneRegex)
  if (phoneMatch) {
    profile.phone = phoneMatch[0].replace(/\D/g, '').replace(/^1/, '')
  }

  // Extract name (look for common patterns)
  const lines = text.split('\n').filter(line => line.trim())
  const namePatterns = [
    /^[A-Z][a-z]+ [A-Z][a-z]+/, // First Last
    /^[A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+/, // First M. Last
    /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+/ // First Middle Last
  ]

  for (const line of lines.slice(0, 10)) { // Check first 10 lines
    for (const pattern of namePatterns) {
      if (pattern.test(line.trim()) && !line.includes('@') && !line.includes('phone') && !line.includes('email')) {
        profile.name = line.trim()
        break
      }
    }
    if (profile.name) break
  }

  return profile
}
