#!/bin/bash

echo "==> Testing root (should redirect to /vibesynq/)"
curl -s -H "Host: localhost" http://localhost:3000/ -L | head -n 10

echo ""
echo "==> Testing /vibesynq (should hit vibesynq public)"
curl -s -H "Host: localhost" http://localhost:3000/vibesynq/ | head -n 10

echo ""
echo "==> Testing /admin (should hit admin public)"
curl -s -H "Host: localhost" http://localhost:3000/admin/ | head -n 10

echo ""
echo "==> Testing /multisynq-client.txt from root public"
curl -s -H "Host: localhost" http://localhost:3000/multisynq-client.txt | head -n 10

echo ""
echo "==> Testing llm subdomain root (should hit public/llm/index.html)"
curl -s -H "Host: llm.localhost" http://localhost:3000/ | head -n 10

echo ""
echo "==> Testing llm subdomain /test.json (should hit public/llm/test.json)"
curl -s -H "Host: llm.localhost" http://localhost:3000/test.json | head -n 10

echo ""
echo "==> Testing llm subdomain nested path (should hit public/llm/nested/nested-test.json)"
curl -s -H "Host: llm.localhost" http://localhost:3000/nested/nested-test.json | head -n 10
