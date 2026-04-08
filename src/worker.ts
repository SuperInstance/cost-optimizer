interface Env {
  COST_DATA: KVNamespace;
  BUDGET_ALERTS: Queue;
  PROVIDER_API_KEYS: string;
}

interface CostEstimate {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  latency: number;
}

interface OptimizationRequest {
  prompt: string;
  maxTokens?: number;
  budget?: number;
  preferredProviders?: string[];
}

interface ProviderConfig {
  name: string;
  baseUrl: string;
  costPerInputToken: number;
  costPerOutputToken: number;
  maxTokens: number;
  latencyMs: number;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  "openai": {
    name: "openai",
    baseUrl: "https://api.openai.com/v1",
    costPerInputToken: 0.0000015,
    costPerOutputToken: 0.000002,
    maxTokens: 4096,
    latencyMs: 300
  },
  "anthropic": {
    name: "anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    costPerInputToken: 0.0000025,
    costPerOutputToken: 0.000008,
    maxTokens: 4096,
    latencyMs: 400
  },
  "cohere": {
    name: "cohere",
    baseUrl: "https://api.cohere.ai/v1",
    costPerInputToken: 0.000001,
    costPerOutputToken: 0.000002,
    maxTokens: 2048,
    latencyMs: 200
  }
};

const DEFAULT_BUDGET = 0.01;

class CostOptimizer {
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  static calculateCost(
    provider: ProviderConfig,
    inputTokens: number,
    outputTokens: number
  ): number {
    return (
      inputTokens * provider.costPerInputToken +
      outputTokens * provider.costPerOutputToken
    );
  }

  static async getRecommendations(
    inputTokens: number,
    outputTokens: number,
    budget?: number
  ): Promise<CostEstimate[]> {
    const estimates: CostEstimate[] = [];

    for (const [key, provider] of Object.entries(PROVIDERS)) {
      const cost = this.calculateCost(provider, inputTokens, outputTokens);
      
      if (!budget || cost <= budget) {
        estimates.push({
          provider: key,
          model: `${key}-latest`,
          inputTokens,
          outputTokens,
          estimatedCost: cost,
          latency: provider.latencyMs
        });
      }
    }

    return estimates.sort((a, b) => a.estimatedCost - b.estimatedCost);
  }
}

const htmlResponse = (content: string) => {
  return new Response(content, {
    headers: {
      "content-type": "text/html;charset=UTF-8",
      "x-frame-options": "DENY",
      "content-security-policy": "default-src 'self'; style-src 'self' 'unsafe-inline';"
    }
  });
};

const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "x-frame-options": "DENY",
      "content-security-policy": "default-src 'self'"
    }
  });
};

const renderDashboard = () => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cost Optimizer Hero</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --dark-bg: #0a0a0f;
            --accent: #22c55e;
            --text-primary: #ffffff;
            --text-secondary: #a0a0b0;
            --card-bg: #151520;
            --border-color: #2a2a3a;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--dark-bg);
            color: var(--text-primary);
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        header {
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--border-color);
        }
        
        .hero-title {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, var(--accent), #10b981);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .hero-subtitle {
            font-size: 1.2rem;
            color: var(--text-secondary);
            max-width: 600px;
            margin: 0 auto;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .feature-card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 2rem;
            border: 1px solid var(--border-color);
            transition: transform 0.3s ease, border-color 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-4px);
            border-color: var(--accent);
        }
        
        .feature-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: var(--accent);
        }
        
        .feature-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
        
        .feature-desc {
            color: var(--text-secondary);
        }
        
        .endpoints {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 3rem;
            border: 1px solid var(--border-color);
        }
        
        .endpoints h2 {
            margin-bottom: 1.5rem;
            color: var(--accent);
        }
        
        .endpoint-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .endpoint {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: rgba(34, 197, 94, 0.1);
            border-radius: 8px;
            border-left: 4px solid var(--accent);
        }
        
        .method {
            padding: 0.25rem 0.75rem;
            background: var(--accent);
            color: var(--dark-bg);
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .path {
            font-family: monospace;
            color: var(--text-primary);
        }
        
        .desc {
            color: var(--text-secondary);
            margin-left: auto;
            font-size: 0.9rem;
        }
        
        footer {
            text-align: center;
            padding: 2rem;
            border-top: 1px solid var(--border-color);
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .fleet-footer {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        
        .fleet-dot {
            width: 8px;
            height: 8px;
            background: var(--accent);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        .fleet-dot:nth-child(2) {
            animation-delay: 0.4s;
        }
        
        .fleet-dot:nth-child(3) {
            animation-delay: 0.8s;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .hero-title {
                font-size: 2rem;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1 class="hero-title">Cost Optimizer Hero</h1>
            <p class="hero-subtitle">AI token cost optimization with model comparison, budget alerts, and intelligent provider switching</p>
        </header>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">💰</div>
                <h3 class="feature-title">Model Cost Comparison</h3>
                <p class="feature-desc">Real-time cost analysis across multiple AI providers to find the most economical option.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3 class="feature-title">Token Estimation</h3>
                <p class="feature-desc">Accurate token counting and cost prediction before making API calls.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">⚠️</div>
                <h3 class="feature-title">Budget Alerts</h3>
                <p class="feature-desc">Set spending limits and receive alerts when approaching your budget thresholds.</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🔄</div>
                <h3 class="feature-title">Provider Switching</h3>
                <p class="feature-desc">Automatically switch between providers based on cost, latency, and availability.</p>
            </div>
        </div>
        
        <div class="endpoints">
            <h2>API Endpoints</h2>
            <div class="endpoint-list">
                <div class="endpoint">
                    <span class="method">POST</span>
                    <span class="path">/api/optimize</span>
                    <span class="desc">Optimize costs for a given prompt</span>
                </div>
                <div class="endpoint">
                    <span class="method">GET</span>
                    <span class="path">/api/costs</span>
                    <span class="desc">Get current cost estimates</span>
                </div>
                <div class="endpoint">
                    <span class="method">GET</span>
                    <span class="path">/api/recommendations</span>
                    <span class="desc">Get provider recommendations</span>
                </div>
                <div class="endpoint">
                    <span class="method">GET</span>
                    <span class="path">/health</span>
                    <span class="desc">Health check endpoint</span>
                </div>
            </div>
        </div>
    </div>
    
    <footer>
        <p>Cost Optimizer Hero • AI Cost Management System</p>
        <div class="fleet-footer">
            <div class="fleet-dot"></div>
            <div class="fleet-dot"></div>
            <div class="fleet-dot"></div>
            <span>Fleet Operational</span>
        </div>
    </footer>
</body>
</html>`;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/" || path === "/dashboard") {
      return htmlResponse(renderDashboard());
    }

    if (path === "/health") {
      return jsonResponse({ status: "healthy", timestamp: new Date().toISOString() });
    }

    if (path === "/api/costs") {
      const inputTokens = 1000;
      const outputTokens = 500;
      const estimates = await CostOptimizer.getRecommendations(inputTokens, outputTokens);
      
      return jsonResponse({
        estimates,
        timestamp: new Date().toISOString(),
        currency: "USD"
      });
    }

    if (path === "/api/recommendations") {
      const params = url.searchParams;
      const inputTokens = parseInt(params.get("inputTokens") || "1000");
      const outputTokens = parseInt(params.get("outputTokens") || "500");
      const budget = params.get("budget") ? parseFloat(params.get("budget")!) : undefined;
      
      const recommendations = await CostOptimizer.getRecommendations(
        inputTokens,
        outputTokens,
        budget
      );
      
      return jsonResponse({
        recommendations,
        optimal: recommendations[0],
        inputTokens,
        outputTokens,
        budget
      });
    }

    if (path === "/api/optimize" && request.method === "POST") {
      try {
        const body: OptimizationRequest = await request.json();
        
        if (!body.prompt) {
          return jsonResponse({ error: "Prompt is required" }, 400);
        }

        const inputTokens = CostOptimizer.estimateTokens(body.prompt);
        const outputTokens = body.maxTokens || 500;
        const budget = body.budget || DEFAULT_BUDGET;

        const recommendations = await CostOptimizer.getRecommendations(
          inputTokens,
          outputTokens,
          budget
        );

        const optimal = recommendations[0];
        
        if (optimal) {
          await env.BUDGET_ALERTS.send({
            type: "optimization_request",
            inputTokens,
            outputTokens,
            estimatedCost: optimal.estimatedCost,
            budget,
            timestamp: new Date().toISOString()
          });

          await env.COST_DATA.put(
            `request_${Date.now()}`,
            JSON.stringify({
              prompt: body.prompt.substring(0, 100),
              inputTokens,
              outputTokens,
              cost: optimal.estimatedCost,
              provider: optimal.provider,
              timestamp: new Date().toISOString()
            }),
            { expirationTtl: 86400 }
          );
        }

        return jsonResponse({
          optimized: true,
          inputTokens,
          outputTokens,
          budget,
          recommendations,
          optimalProvider: optimal,
          estimatedSavings: optimal ? 
            recommendations[recommendations.length - 1].estimatedCost - optimal.estimatedCost : 0
        });
      } catch (error) {
        return jsonResponse({ error: "Invalid request body" }, 400);
      }
    }

    return jsonResponse({ error: "Not found" }, 404);
  }
};