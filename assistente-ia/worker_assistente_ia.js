/**
 * ============================================================================
 * CLOUDFLARE WORKER — PROXY SEGURO DO ASSISTENTE VIRTUAL IA (GEMINI)
 * Endpoint: https://assistente-virtual-laboratorio-tecnologias.gabrielsehna.workers.dev/
 * Escola de Tecnologias
 * ============================================================================
 */

const FALLBACK_MODEL = "gemini-3.8-flash";

const ALLOWED_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.8-lite"
];

const MAX_PAYLOAD_BYTES = 512 * 1024; // 512 KB

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8"
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS
  });
}

export default {
  async fetch(request, env) {
    // 1. Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 2. Healthcheck informativo (GET)
    if (request.method === "GET") {
      const defaultModel = (env && env.DEFAULT_MODEL) ? env.DEFAULT_MODEL : FALLBACK_MODEL;
      return jsonResponse({
        status: "online",
        service: "Assistente Virtual IA - Escola de Tecnologias",
        defaultModel,
        fallbackModel: FALLBACK_MODEL,
        allowedModels: ALLOWED_MODELS
      });
    }

    // 3. Apenas POST é aceito para inferência
    if (request.method !== "POST") {
      return jsonResponse(
        {
          error: {
            code: 405,
            type: "METHOD_NOT_ALLOWED",
            message: "Método não permitido. Utilize POST."
          }
        },
        405
      );
    }

    const apiKey = env?.GEMINI_API_KEY || env?.GOOGLE_API_KEY;
    if (!apiKey) {
      return jsonResponse(
        {
          error: {
            code: 500,
            type: "MISSING_API_KEY",
            message: "Chave GEMINI_API_KEY não configurada nas variáveis de ambiente do Worker."
          }
        },
        500
      );
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_PAYLOAD_BYTES) {
      return jsonResponse(
        {
          error: {
            code: 413,
            type: "PAYLOAD_TOO_LARGE",
            message: "O tamanho da requisição excede o limite máximo de 512 KB."
          }
        },
        413
      );
    }

    let body;
    try {
      const rawText = await request.text();
      if (new TextEncoder().encode(rawText).byteLength > MAX_PAYLOAD_BYTES) {
        return jsonResponse(
          {
            error: {
              code: 413,
              type: "PAYLOAD_TOO_LARGE",
              message: "O tamanho da requisição excede o limite máximo de 512 KB."
            }
          },
          413
        );
      }
      body = JSON.parse(rawText);
    } catch {
      return jsonResponse(
        {
          error: {
            code: 400,
            type: "INVALID_JSON",
            message: "Corpo da requisição JSON inválido."
          }
        },
        400
      );
    }

    // 4. Seleção e validação do modelo permitido
    const configuredDefault = (env && env.DEFAULT_MODEL && ALLOWED_MODELS.includes(env.DEFAULT_MODEL))
      ? env.DEFAULT_MODEL
      : FALLBACK_MODEL;

    const requestedModel = typeof body.model === "string" ? body.model.trim() : "";
    const selectedModel = ALLOWED_MODELS.includes(requestedModel)
      ? requestedModel
      : configuredDefault;

    // 5. Montagem do payload para a API Google Gemini
    const geminiPayload = {
      contents: body.contents || []
    };

    if (body.system_instruction) {
      geminiPayload.system_instruction = body.system_instruction;
    } else if (body.systemInstruction) {
      geminiPayload.system_instruction = body.systemInstruction;
    }

    if (body.generationConfig) {
      geminiPayload.generationConfig = body.generationConfig;
    }

    if (body.safetySettings) {
      geminiPayload.safetySettings = body.safetySettings;
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
      const googleResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload)
      });

      const responseData = await googleResponse.json().catch(() => ({}));

      // 6. Tratamento padronizado para Erro de Cota / Rate Limit (HTTP 429)
      if (
        googleResponse.status === 429 ||
        responseData?.error?.code === 429 ||
        responseData?.error?.status === "RESOURCE_EXHAUSTED"
      ) {
        return jsonResponse(
          {
            error: {
              code: 429,
              type: "QUOTA_EXCEEDED",
              message: "A cota de uso da IA foi temporariamente atingida. Por favor, aguarde alguns instantes antes de enviar uma nova pergunta."
            }
          },
          429
        );
      }

      if (!googleResponse.ok) {
        return jsonResponse(
          {
            error: {
              code: googleResponse.status,
              type: responseData?.error?.status || "UPSTREAM_ERROR",
              message: responseData?.error?.message || `Erro ao consultar a API do Gemini (HTTP ${googleResponse.status}).`
            }
          },
          googleResponse.status
        );
      }

      return jsonResponse(responseData, 200);
    } catch (err) {
      return jsonResponse(
        {
          error: {
            code: 502,
            type: "NETWORK_ERROR",
            message: `Falha de comunicação com a API do Google Gemini: ${err.message || "Erro desconhecido"}`
          }
        },
        502
      );
    }
  }
};

