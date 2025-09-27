// Python-based resume parser service
const PYTHON_PARSER_URL = import.meta.env.VITE_PYTHON_PARSER_URL || 'http://localhost:5006'

export const parsePDFWithPython = async (file) => {
  try {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    
    const response = await fetch(`${PYTHON_PARSER_URL}/parse-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64,
        type: 'application/pdf'
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Python parser error:', error)
    // Return fallback
    return {
      name: '',
      email: '',
      phone: '',
      _fallback: true,
      _error: `Python parser error: ${error.message}`
    }
  }
}

export const parseDOCXWithPython = async (file) => {
  try {
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    
    const response = await fetch(`${PYTHON_PARSER_URL}/parse-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Python parser error:', error)
    // Return fallback
    return {
      name: '',
      email: '',
      phone: '',
      _fallback: true,
      _error: `Python parser error: ${error.message}`
    }
  }
}

export const checkPythonParserHealth = async () => {
  try {
    const response = await fetch(`${PYTHON_PARSER_URL}/health`)
    if (response.ok) {
      const health = await response.json()
      console.log('🐍 Python parser health:', health)
      return true
    }
    return false
  } catch (error) {
    console.warn('Python parser not available:', error.message)
    return false
  }
}
