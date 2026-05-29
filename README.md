# cost-optimizer

AI token cost optimization engine — compare providers, estimate costs, set budgets, and automatically pick the cheapest model for the job.

## What This Gives You

- **Multi-provider cost comparison** — OpenAI, Anthropic, Cohere with real per-token pricing
- **Token estimation** — count tokens before making API calls to predict spend
- **Budget-aware recommendations** — set a max budget and get only providers that fit
- **Smart provider switching** — automatically routes to the cheapest provider that meets constraints
- **Spending history** — KV-backed request log for cost tracking and analysis
- **Queue-driven alerts** — budget threshold notifications via Cloudflare Queues

## Quick Start

```bash
wrangler deploy

# Get cost estimates for 1K input / 500 output tokens
curl https://cost-optimizer.<your-subdomain>.workers.dev/api/costs

# Get recommendations with a budget cap
curl "https://cost-optimizer.<your-subdomain>.workers.dev/api/recommendations?inputTokens=2000&outputTokens=1000&budget=0.005"

# Optimize a prompt end-to-end
curl -X POST https://cost-optimizer.<your-subdomain>.workers.dev/api/optimize \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Summarize this article...", "maxTokens": 500, "budget": 0.01}'
```

### Response

```json
{
  "optimized": true,
  "inputTokens": 52,
  "budget": 0.01,
  "optimalProvider": {
    "provider": "cohere",
    "estimatedCost": 0.000052,
    "latency": 200
  },
  "estimatedSavings": 0.000058
}
```

## How It Fits

A Cocapn Fleet vessel for cost management. Part of the SuperInstance ecosystem.

Related repos:
- [config-vault](https://github.com/SuperInstance/config-vault) — fleet configuration management
- [cocapn-fleet-integration](https://github.com/SuperInstance/cocapn-fleet-integration) — fleet orchestration
- [cocapn-telemetry](https://github.com/SuperInstance/cocapn-telemetry) — fleet observability

## License

Apache 2.0
