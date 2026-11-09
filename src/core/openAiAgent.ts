import type { Editor } from "@tiptap/core";
import type { WysiwygCommandRegistry } from "../plugins/commandRegistry";

export type OpenAiConfig = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

export type AiAgentMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: AiToolCall[];
};

export type AiToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type AiExecutionResult = {
  success: boolean;
  message: string;
  toolUsed?: string;
  generatedHtml?: string;
};

/**
 * Standard OpenAI Tools (Function Calling) schema for WYSIWYG Editor control via NLP.
 */
export const EDITOR_AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "insert_content",
      description:
        "Insere texto ou conteúdo HTML formatado no editor na posição atual do cursor ou substituindo o texto selecionado.",
      parameters: {
        type: "object",
        properties: {
          html: {
            type: "string",
            description: "O conteúdo HTML a ser inserido (pode conter h1, h2, p, strong, em, ul, ol, etc.).",
          },
        },
        required: ["html"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_table",
      description:
        "Cria uma tabela estruturada no editor com linhas, colunas e cabeçalhos apropriados.",
      parameters: {
        type: "object",
        properties: {
          rows: { type: "number", description: "Número de linhas da tabela (padrão: 3)" },
          cols: { type: "number", description: "Número de colunas da tabela (padrão: 3)" },
          headers: {
            type: "array",
            items: { type: "string" },
            description: "Nomes das colunas no cabeçalho.",
          },
          data: {
            type: "array",
            items: {
              type: "array",
              items: { type: "string" },
            },
            description: "Matriz 2D de dados para preencher a tabela.",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "format_selection",
      description:
        "Aplica comandos de formatação visual ao texto selecionado no editor.",
      parameters: {
        type: "object",
        properties: {
          formatType: {
            type: "string",
            enum: [
              "bold",
              "italic",
              "underline",
              "heading1",
              "heading2",
              "bulletList",
              "orderedList",
              "alignLeft",
              "alignCenter",
              "alignRight",
              "alignJustify",
            ],
            description: "O tipo de formatação a ser aplicada.",
          },
        },
        required: ["formatType"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "insert_merge_tag",
      description: "Insere uma merge tag dinâmica (ex: {{cliente_nome}}, {{data_emissao}}) no editor.",
      parameters: {
        type: "object",
        properties: {
          tagToken: {
            type: "string",
            description: "O token completo da tag, por exemplo '{{cliente_nome}}'.",
          },
        },
        required: ["tagToken"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "replace_selection",
      description:
        "Substitui o trecho atualmente selecionado por um novo texto melhorado, resumido ou traduzido.",
      parameters: {
        type: "object",
        properties: {
          replacement: {
            type: "string",
            description: "O texto ou HTML que substituirá a seleção atual.",
          },
        },
        required: ["replacement"],
      },
    },
  },
];

/**
 * Resolves standard OpenAI configuration from props and environment variables.
 */
export function resolveOpenAiConfig(customConfig?: OpenAiConfig): OpenAiConfig {
  let envApiKey = "";
  let envBaseUrl = "https://api.openai.com/v1";
  let envModel = "gpt-4o-mini";

  // Vite environment variables
  try {
    // @ts-ignore
    if (typeof import.meta !== "undefined" && import.meta.env) {
      // @ts-ignore
      envApiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY || "";
      // @ts-ignore
      envBaseUrl = import.meta.env.VITE_OPENAI_BASE_URL || import.meta.env.OPENAI_BASE_URL || envBaseUrl;
      // @ts-ignore
      envModel = import.meta.env.VITE_OPENAI_MODEL || import.meta.env.OPENAI_MODEL || envModel;
    }
  } catch {
    // Fallback if import.meta is unavailable
  }

  // Node / bundler process.env fallback
  try {
    const proc = (globalThis as any).process;
    if (!envApiKey && proc && proc.env) {
      envApiKey = proc.env.VITE_OPENAI_API_KEY || proc.env.OPENAI_API_KEY || "";
      envBaseUrl = proc.env.VITE_OPENAI_BASE_URL || proc.env.OPENAI_BASE_URL || envBaseUrl;
      envModel = proc.env.VITE_OPENAI_MODEL || proc.env.OPENAI_MODEL || envModel;
    }
  } catch {
    // Ignore fallback errors
  }

  return {
    apiKey: customConfig?.apiKey || envApiKey,
    baseUrl: (customConfig?.baseUrl || envBaseUrl).replace(/\/+$/, ""),
    model: customConfig?.model || envModel,
    temperature: customConfig?.temperature ?? 0.7,
    maxTokens: customConfig?.maxTokens ?? 2000,
  };
}

/**
 * Executes a resolved AI tool directly on the editor instance.
 */
export function executeAiToolAction({
  name,
  args,
  editor,
  commandRegistry,
}: {
  name: string;
  args: Record<string, unknown>;
  editor: Editor;
  commandRegistry?: WysiwygCommandRegistry | null;
}): boolean {
  switch (name) {
    case "insert_content": {
      const html = String(args.html ?? "");
      if (html) {
        editor.chain().focus().insertContent(html).run();
        return true;
      }
      return false;
    }
    case "create_table": {
      const rows = Number(args.rows ?? 3) || 3;
      const cols = Number(args.cols ?? 3) || 3;
      const headers = Array.isArray(args.headers) ? (args.headers as string[]) : [];
      const data = Array.isArray(args.data) ? (args.data as string[][]) : [];

      if (headers.length > 0 || data.length > 0) {
        let tableHtml = "<table><thead><tr>";
        const actualCols = headers.length > 0 ? headers.length : cols;

        if (headers.length > 0) {
          headers.forEach((h) => {
            tableHtml += `<th>${h}</th>`;
          });
        } else {
          for (let c = 1; c <= actualCols; c++) {
            tableHtml += `<th>Coluna ${c}</th>`;
          }
        }
        tableHtml += "</tr></thead><tbody>";

        if (data.length > 0) {
          data.forEach((row) => {
            tableHtml += "<tr>";
            row.forEach((cell) => {
              tableHtml += `<td>${cell}</td>`;
            });
            tableHtml += "</tr>";
          });
        } else {
          for (let r = 1; r <= rows; r++) {
            tableHtml += "<tr>";
            for (let c = 1; c <= actualCols; c++) {
              tableHtml += `<td>Item ${r}.${c}</td>`;
            }
            tableHtml += "</tr>";
          }
        }
        tableHtml += "</tbody></table>";
        editor.chain().focus().insertContent(tableHtml).run();
        return true;
      }

      return editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    }
    case "format_selection": {
      const formatType = String(args.formatType ?? "");
      const map: Record<string, string> = {
        bold: "text.bold",
        italic: "text.italic",
        underline: "text.underline",
        heading1: "text.heading1",
        heading2: "text.heading2",
        bulletList: "text.bulletList",
        orderedList: "text.orderedList",
        alignLeft: "text.alignLeft",
        alignCenter: "text.alignCenter",
        alignRight: "text.alignRight",
        alignJustify: "text.alignJustify",
      };
      const cmdId = map[formatType];
      if (cmdId && commandRegistry) {
        return commandRegistry.execute(cmdId);
      }
      return false;
    }
    case "insert_merge_tag": {
      const token = String(args.tagToken ?? "");
      if (token) {
        editor.chain().focus().insertContent(` ${token} `).run();
        return true;
      }
      return false;
    }
    case "replace_selection": {
      const replacement = String(args.replacement ?? "");
      if (replacement) {
        editor.chain().focus().insertContent(replacement).run();
        return true;
      }
      return false;
    }
    default:
      return false;
  }
}

/**
 * Standard caller for OpenAI-compatible Chat Completions API with Function Calling / Tools support.
 */
export async function sendOpenAiAgentRequest({
  userPrompt,
  editor,
  config: customConfig,
  commandRegistry,
  contextSelection,
}: {
  userPrompt: string;
  editor: Editor;
  config?: OpenAiConfig;
  commandRegistry?: WysiwygCommandRegistry | null;
  contextSelection?: string;
}): Promise<AiExecutionResult> {
  const config = resolveOpenAiConfig(customConfig);

  if (!config.apiKey) {
    return {
      success: false,
      message:
        "Chave da API da OpenAI não configurada. Defina a variável VITE_OPENAI_API_KEY ou configure via aplicativo.",
    };
  }

  const selection = contextSelection ?? editor.state.doc.textBetween(
    editor.state.selection.from,
    editor.state.selection.to,
    " "
  );
  const currentHtml = editor.getHTML();

  const systemMessage: AiAgentMessage = {
    role: "system",
    content: `Você é o Agente de IA Integrado do Nexus WYSIWYG Editor.
Sua missão é ajudar o usuário a escrever, reescrever, melhorar textos e manipular o editor via Processamento de Linguagem Natural (NLP).

Você tem ferramentas (functions) disponíveis para interagir com o editor:
- 'insert_content': Inserir texto ou HTML formatado.
- 'create_table': Criar tabelas com linhas, colunas e cabeçalhos.
- 'format_selection': Aplicar formatação (negrito, itálico, alinhamento, listas).
- 'replace_selection': Substituir o texto selecionado por uma versão melhorada.
- 'insert_merge_tag': Inserir tags dinâmicas como {{cliente_nome}}, {{data_emissao}}, etc.

Regras:
1. Se o usuário pedir para gerar, criar ou redigir texto, use 'insert_content' ou 'replace_selection'.
2. Se o usuário pedir para criar uma tabela, use 'create_table'.
3. Se o usuário pedir para formatar o texto selecionado, use 'format_selection'.
4. Sempre responda em Português do Brasil com tom profissional e cortês.
5. Quando executar uma ferramenta, confirme com uma mensagem amigável explicando o que foi feito.

Texto selecionado atualmente pelo usuário: "${selection || "(nenhum texto selecionado)"}".
Tamanho aproximado do documento: ${currentHtml.length} caracteres.`,
  };

  const userMessage: AiAgentMessage = {
    role: "user",
    content: userPrompt,
  };

  try {
    const endpoint = `${config.baseUrl}/chat/completions`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [systemMessage, userMessage],
        tools: EDITOR_AI_TOOLS,
        tool_choice: "auto",
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        message: `Erro na API da OpenAI (${response.status}): ${errText}`,
      };
    }

    const data = await response.json();
    const choice = data?.choices?.[0];
    const message = choice?.message;

    if (!message) {
      return {
        success: false,
        message: "Nenhuma resposta retornada pelo modelo de IA.",
      };
    }

    // Check if the model decided to call tools
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const fnName = toolCall.function?.name;
        let fnArgs: Record<string, unknown> = {};
        try {
          fnArgs = JSON.parse(toolCall.function?.arguments || "{}");
        } catch {
          fnArgs = {};
        }

        executeAiToolAction({
          name: fnName,
          args: fnArgs,
          editor,
          commandRegistry,
        });

        return {
          success: true,
          message:
            message.content ||
            `Ação executada com sucesso: ${fnName} aplicada ao editor.`,
          toolUsed: fnName,
        };
      }
    }

    // Direct content response
    if (message.content) {
      // If there is an active selection and user asked to rewrite, or by default insert
      return {
        success: true,
        message: message.content,
        generatedHtml: message.content,
      };
    }

    return {
      success: true,
      message: "Comando processado com sucesso.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Falha na requisição para o modelo de IA: ${error?.message || error}`,
    };
  }
}
