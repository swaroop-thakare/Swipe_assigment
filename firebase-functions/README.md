# Professional Resume Parser

A robust Python-based resume parser inspired by the intake curation agent pattern for reliable document processing.

## Features

- ✅ **PDF Support**: Uses pdfplumber + PyPDF2 for maximum compatibility
- ✅ **DOCX Support**: Full Microsoft Word document processing
- ✅ **Professional Error Handling**: Graceful fallbacks and detailed logging
- ✅ **Structured Output**: Consistent JSON response format
- ✅ **Health Monitoring**: Built-in health check endpoints
- ✅ **Production Ready**: Designed for Firebase Functions deployment

## Quick Start

### Local Development

```bash
# Install dependencies
pip3 install PyPDF2 pdfplumber python-docx flask flask-cors

# Run the parser
python3 professional_parser.py
```

### API Endpoints

- **Health Check**: `GET /health`
- **Parse Resume**: `POST /parse-resume`

### Request Format

```json
{
  "file": "base64_encoded_file_content",
  "type": "application/pdf",
  "filename": "resume.pdf"
}
```

### Response Format

```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "phone": "1234567890",
  "_fallback": false,
  "_error": "",
  "_missing_fields": [],
  "_message": ""
}
```

## Architecture

### Professional Agent Pattern

Following the intake curation agent pattern:

1. **Initialization**: Setup logging and library detection
2. **Processing**: Multi-method text extraction with fallbacks
3. **Analysis**: Structured profile information extraction
4. **Response**: Consistent JSON format with error handling

### Error Handling

- **Library Detection**: Graceful fallbacks when libraries unavailable
- **Text Extraction**: Multiple methods for maximum compatibility
- **Profile Extraction**: Robust regex patterns with validation
- **Response Format**: Consistent structure regardless of success/failure

### Logging

Professional logging with:
- **Structured Format**: Timestamp, level, message
- **Processing Metrics**: Timing and character counts
- **Error Tracking**: Detailed exception information
- **Status Reporting**: Clear success/failure indicators

## Deployment

### Firebase Functions

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init functions

# Deploy
firebase deploy --only functions
```

### Environment Variables

```bash
# Optional: Custom parser URL
VITE_PYTHON_PARSER_URL=https://your-function-url
```

## Testing

### Health Check
```bash
curl http://localhost:5006/health
```

### Parse Resume
```bash
curl -X POST http://localhost:5006/parse-resume \
  -H "Content-Type: application/json" \
  -d '{"file":"base64_content","type":"application/pdf","filename":"test.pdf"}'
```

## Integration

### Frontend Integration

The parser automatically integrates with the React frontend:

1. **Health Check**: Frontend checks parser availability
2. **Automatic Fallback**: Falls back to JavaScript parser if Python unavailable
3. **Error Handling**: Graceful degradation with manual entry option
4. **Response Format**: Compatible with existing frontend expectations

### Backend Integration

- **API Routes**: RESTful endpoints for resume processing
- **CORS Support**: Cross-origin requests enabled
- **Error Responses**: Consistent error format
- **Logging**: Professional logging for debugging

## Performance

- **Multi-threaded**: Handles concurrent requests
- **Memory Efficient**: Streams large files
- **Fast Processing**: Optimized text extraction
- **Caching**: Library initialization caching

## Security

- **Input Validation**: File type and size validation
- **Error Sanitization**: Safe error message formatting
- **CORS Protection**: Configurable origin restrictions
- **Rate Limiting**: Built-in request throttling

## Monitoring

### Health Endpoints

- **Status**: Service availability
- **Libraries**: PDF/DOCX support status
- **Version**: Parser version information
- **Timestamp**: Last health check time

### Logging

- **Processing Time**: Request duration tracking
- **Success Rate**: Processing success metrics
- **Error Rate**: Failure tracking and analysis
- **Performance**: Character extraction metrics

## Troubleshooting

### Common Issues

1. **Library Not Available**: Install missing dependencies
2. **Port Already in Use**: Kill existing processes
3. **PDF Extraction Fails**: Try different PDF files
4. **Response Format**: Check frontend compatibility

### Debug Mode

```bash
# Enable debug logging
export FLASK_DEBUG=1
python3 professional_parser.py
```

### Library Issues

```bash
# Reinstall libraries
pip3 uninstall PyPDF2 pdfplumber python-docx
pip3 install PyPDF2 pdfplumber python-docx
```

## Contributing

1. Follow the professional agent pattern
2. Maintain consistent error handling
3. Add comprehensive logging
4. Test with various file types
5. Update documentation

## License

MIT License - See LICENSE file for details.
