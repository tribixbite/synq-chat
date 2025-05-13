# LLM Files Directory

This directory contains files that are served when accessing the `llm.synq.chat` domain.

## Usage

Files placed in this directory will be accessible in two ways:

1. Through the subdomain (production):
   - URL: `llm.synq.chat/[filename]`

2. Through path-based routing (development):
   - URL: `http://localhost:5173/llm/[filename]`

## Examples

- The file `example.txt` is accessible at:
  - Production: `llm.synq.chat/example.txt`
  - Development: `http://localhost:5173/llm/example.txt`

- The file `test.json` is accessible at:
  - Production: `llm.synq.chat/test.json`
  - Development: `http://localhost:5173/llm/test.json`

- Nested files are also supported: 
  - Production: `llm.synq.chat/nested/nested-test.json`
  - Development: `http://localhost:5173/llm/nested/nested-test.json`

- Add additional files as needed and they will be automatically served

## Structure

```
public/llm/
├── example.txt
├── index.html   # Served for the root URL: llm.synq.chat/
├── README.md
├── test.json
├── multisynq-react.txt
└── nested/
    └── nested-test.json
```

## Notes

- This directory is specifically for the `llm.synq.chat` subdomain in production
- In development, files are accessible through path-based routing
- Files are served with appropriate content types based on file extensions
- To test the subdomain routing locally, you may need to modify your hosts file or use a tool like ngrok
