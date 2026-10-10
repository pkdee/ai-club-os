import { toolKey } from "./tool-key"

export type KnownTool = {
  // 저장하고 보여 주는 표기.
  name: string
  // 같은 도구를 가리키는 다른 표기. 한글로 적은 이름과 줄여 부르는 이름을 넣는다.
  // 대소문자나 공백만 다른 표기는 자동으로 같게 보므로 넣지 않아도 된다.
  aliases?: string[]
}

// 널리 쓰는 AI 도구 목록. 도구 칸에서 검색해 고를 수 있고, 다르게 적어도 이 표기로 맞춘다.
// 목록에 없는 도구도 그대로 적어 넣을 수 있다. 빠진 도구가 있으면 여기에 한 줄 더한다.
// 여러 도구를 함께 가리키는 말(코파일럿 등)은 넣지 않는다. 그런 말은 고르는 목록에서 직접 고르게 한다.
export const KNOWN_TOOLS: KnownTool[] = [
  // 가장 많이 쓰는 도구. 칸을 누르면 이 순서대로 먼저 보인다.
  { name: "ChatGPT", aliases: ["챗지피티", "챗GPT", "쳇지피티", "지피티"] },
  { name: "Claude", aliases: ["클로드"] },
  { name: "Gemini", aliases: ["제미나이", "제미니", "재미나이"] },
  { name: "Claude Code", aliases: ["클로드 코드"] },
  { name: "Cursor", aliases: ["커서"] },
  { name: "Codex", aliases: ["코덱스", "OpenAI Codex", "Codex CLI"] },
  { name: "Antigravity", aliases: ["안티그래비티", "안티그라비티", "Google Antigravity"] },
  { name: "GitHub Copilot", aliases: ["깃허브 코파일럿", "깃헙 코파일럿", "GH Copilot"] },

  // 대화형 도우미
  { name: "Perplexity", aliases: ["퍼플렉시티"] },
  { name: "Microsoft Copilot", aliases: ["MS Copilot", "마이크로소프트 코파일럿", "MS 코파일럿"] },
  { name: "Grok", aliases: ["그록"] },
  { name: "DeepSeek", aliases: ["딥시크"] },
  { name: "NotebookLM", aliases: ["노트북LM", "노트북엘엠"] },
  { name: "Le Chat", aliases: ["르샤"] },
  { name: "Meta AI", aliases: ["메타 AI"] },
  { name: "뤼튼", aliases: ["wrtn"] },
  { name: "CLOVA X", aliases: ["클로바 X", "클로바엑스"] },
  { name: "Genspark", aliases: ["젠스파크"] },
  { name: "Manus", aliases: ["마누스"] },

  // 코드 작성
  { name: "Windsurf", aliases: ["윈드서프"] },
  { name: "Gemini CLI", aliases: ["제미나이 CLI"] },
  { name: "Cline", aliases: ["클라인"] },
  { name: "Roo Code", aliases: ["루 코드"] },
  { name: "Aider", aliases: ["에이더"] },
  { name: "Continue", aliases: ["컨티뉴"] },
  { name: "Zed", aliases: ["제드"] },
  { name: "Kiro", aliases: ["키로"] },
  { name: "Jules", aliases: ["줄스"] },
  { name: "Devin", aliases: ["데빈"] },
  { name: "Replit", aliases: ["레플릿", "Replit Agent"] },
  { name: "v0", aliases: ["v0.dev", "브이제로"] },
  { name: "Bolt", aliases: ["bolt.new", "볼트"] },
  { name: "Lovable", aliases: ["러버블"] },
  { name: "Amp", aliases: ["앰프"] },
  { name: "OpenCode", aliases: ["오픈코드"] },
  { name: "Trae", aliases: ["트레이"] },
  { name: "Junie", aliases: ["주니", "JetBrains Junie"] },
  { name: "Warp", aliases: ["워프"] },
  { name: "Tabnine", aliases: ["탭나인"] },

  // 그림, 영상, 소리
  { name: "Midjourney", aliases: ["미드저니"] },
  { name: "DALL·E", aliases: ["DALL-E", "DALLE", "달리"] },
  { name: "Stable Diffusion", aliases: ["스테이블 디퓨전"] },
  { name: "FLUX", aliases: ["플럭스"] },
  { name: "Nano Banana", aliases: ["나노 바나나"] },
  { name: "Imagen", aliases: ["이마젠"] },
  { name: "Adobe Firefly", aliases: ["Firefly", "파이어플라이"] },
  { name: "ComfyUI", aliases: ["컴피UI", "컴피유아이"] },
  { name: "Sora", aliases: ["소라"] },
  { name: "Veo", aliases: ["비오"] },
  { name: "Runway", aliases: ["런웨이"] },
  { name: "Pika", aliases: ["피카"] },
  { name: "Kling", aliases: ["클링"] },
  { name: "ElevenLabs", aliases: ["일레븐랩스"] },
  { name: "Suno", aliases: ["수노"] },
  { name: "Udio", aliases: ["유디오"] },
  { name: "Whisper", aliases: ["위스퍼"] },

  // 모델과 모델을 돌리는 도구
  { name: "Ollama", aliases: ["올라마"] },
  { name: "LM Studio", aliases: ["엘엠 스튜디오"] },
  { name: "llama.cpp" },
  { name: "vLLM" },
  { name: "Hugging Face", aliases: ["허깅페이스", "HF"] },
  { name: "Llama", aliases: ["라마"] },
  { name: "Gemma", aliases: ["젬마"] },
  { name: "Qwen", aliases: ["큐원"] },
  { name: "Mistral", aliases: ["미스트랄"] },
  { name: "EXAONE", aliases: ["엑사원"] },
  { name: "HyperCLOVA X", aliases: ["하이퍼클로바 X", "하이퍼클로바엑스"] },
  { name: "Solar", aliases: ["솔라", "Upstage Solar"] },

  // API 와 클라우드
  { name: "OpenAI API", aliases: ["오픈AI API"] },
  { name: "Claude API", aliases: ["Anthropic API", "클로드 API"] },
  { name: "Gemini API", aliases: ["제미나이 API"] },
  { name: "Google AI Studio", aliases: ["AI Studio", "AI 스튜디오"] },
  { name: "OpenRouter", aliases: ["오픈라우터"] },
  { name: "Amazon Bedrock", aliases: ["Bedrock", "베드록"] },
  { name: "Vertex AI", aliases: ["버텍스 AI"] },
  { name: "Azure OpenAI", aliases: ["애저 OpenAI"] },

  // 만들 때 쓰는 틀과 라이브러리
  { name: "LangChain", aliases: ["랭체인"] },
  { name: "LangGraph", aliases: ["랭그래프"] },
  { name: "LangSmith", aliases: ["랭스미스"] },
  { name: "LlamaIndex", aliases: ["라마인덱스"] },
  { name: "CrewAI", aliases: ["크루AI"] },
  { name: "AutoGen", aliases: ["오토젠"] },
  { name: "DSPy" },
  { name: "Haystack", aliases: ["헤이스택"] },
  { name: "Semantic Kernel", aliases: ["시맨틱 커널"] },
  { name: "OpenAI Agents SDK" },
  { name: "Claude Agent SDK" },
  { name: "Vercel AI SDK", aliases: ["AI SDK"] },
  { name: "MCP", aliases: ["Model Context Protocol"] },
  { name: "Streamlit", aliases: ["스트림릿"] },
  { name: "Gradio", aliases: ["그라디오"] },
  { name: "PyTorch", aliases: ["파이토치"] },
  { name: "TensorFlow", aliases: ["텐서플로", "텐서플로우"] },
  { name: "Transformers", aliases: ["트랜스포머스"] },
  { name: "scikit-learn", aliases: ["사이킷런", "sklearn"] },
  { name: "Keras", aliases: ["케라스"] },

  // 검색과 저장
  { name: "Chroma", aliases: ["ChromaDB", "크로마"] },
  { name: "Pinecone", aliases: ["파인콘"] },
  { name: "Weaviate", aliases: ["위비에이트"] },
  { name: "Qdrant", aliases: ["큐드런트"] },
  { name: "Milvus", aliases: ["밀버스"] },
  { name: "FAISS", aliases: ["파이스"] },
  { name: "pgvector" },
  { name: "Elasticsearch", aliases: ["엘라스틱서치"] },

  // 자동화와 실험 환경
  { name: "n8n" },
  { name: "Dify", aliases: ["디파이"] },
  { name: "Flowise", aliases: ["플로와이즈"] },
  { name: "Langflow", aliases: ["랭플로우"] },
  { name: "Zapier", aliases: ["재피어"] },
  { name: "Make", aliases: ["메이크"] },
  { name: "Google Colab", aliases: ["Colab", "코랩"] },
  { name: "Jupyter", aliases: ["주피터", "Jupyter Notebook"] },
  { name: "Kaggle", aliases: ["캐글"] },
  { name: "Weights & Biases", aliases: ["W&B", "wandb"] },
  { name: "MLflow" },

  // 문서와 디자인
  { name: "Notion AI", aliases: ["노션 AI"] },
  { name: "Gamma", aliases: ["감마"] },
  { name: "Canva", aliases: ["캔바"] },
  { name: "Figma Make", aliases: ["피그마 메이크"] },
]

type Entry = { tool: KnownTool; keys: string[] }

const ENTRIES: Entry[] = KNOWN_TOOLS.map((tool) => ({
  tool,
  keys: [tool.name, ...(tool.aliases ?? [])].map(toolKey),
}))

const BY_KEY = new Map<string, KnownTool>()
for (const entry of ENTRIES) {
  for (const key of entry.keys) {
    if (!BY_KEY.has(key)) {
      BY_KEY.set(key, entry.tool)
    }
  }
}

// 적은 이름이 목록의 도구를 가리키면 그 도구의 표기를 돌려준다. 목록에 없으면 null 이다.
export function knownToolName(value: string): string | null {
  return BY_KEY.get(toolKey(value))?.name ?? null
}

// 한 도구를 가리키는 모든 표기. 목록에 없는 도구면 받은 이름 하나만 돌려준다.
export function toolSpellings(name: string): string[] {
  const tool = BY_KEY.get(toolKey(name))
  return tool ? [tool.name, ...(tool.aliases ?? [])] : [name]
}

// 도구 칸에 적는 동안 보여 줄 도구들.
// 이 Club 에서 이미 쓰는 도구를 먼저, 그다음 목록의 도구를 보여 준다. 이름이나 다른 표기에 적은 글자가 들어 있으면 맞는 것으로 본다.
export function suggestTools(
  draft: string,
  clubTools: string[],
  chosen: string[],
  limit = 8
): string[] {
  const needle = toolKey(draft)
  const taken = new Set(chosen.map((tool) => toolKey(knownToolName(tool) ?? tool)))
  const candidates: { name: string; keys: string[] }[] = [
    ...clubTools.map((tool) => {
      const name = knownToolName(tool) ?? tool
      return { name, keys: toolSpellings(name).map(toolKey) }
    }),
    ...ENTRIES.map((entry) => ({ name: entry.tool.name, keys: entry.keys })),
  ]

  const starts: string[] = []
  const contains: string[] = []
  const seen = new Set<string>()
  for (const candidate of candidates) {
    const key = toolKey(candidate.name)
    if (seen.has(key) || taken.has(key)) {
      continue
    }
    if (needle === "" || candidate.keys.some((item) => item.startsWith(needle))) {
      seen.add(key)
      starts.push(candidate.name)
    } else if (candidate.keys.some((item) => item.includes(needle))) {
      seen.add(key)
      contains.push(candidate.name)
    }
  }
  return [...starts, ...contains].slice(0, limit)
}

// 찾는 글자에 도구를 가리키는 낱말이 있으면 그 도구의 다른 표기도 함께 찾게 한다.
// "클로드" 로 찾으면 "Claude" 로 적은 기록도 나온다. 낱말 안에서 | 로 이은 것은 그 가운데 하나만 있어도 된다는 뜻이다.
export function expandSearch(query: string): string {
  const alternatives = (value: string) =>
    Array.from(new Set(toolSpellings(value).map(toolKey))).join("|")

  // 찾는 글자 전체가 한 도구의 이름이면 낱말로 나누지 않는다. "클로드 코드" 를 두 낱말로 나누면 도구를 찾지 못한다.
  if (knownToolName(query)) {
    return alternatives(query)
  }
  return query
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (knownToolName(word) ? alternatives(word) : word))
    .join(" ")
}

// 도구로 고를 때 데이터베이스에 넘기는 값. 그 도구의 모든 표기를 | 로 이어서, 예전에 다르게 적어 둔 기록도 함께 고른다.
export function toolFilterValue(name: string): string {
  return toolSpellings(name).join("|")
}

// 데이터베이스에서 읽은 도구별 횟수를 목록의 표기로 맞추고, 같은 도구가 된 것은 합친다. 많이 쓰인 순서로 돌려준다.
export function mergeToolCounts(
  rows: { name: string; logCount: number }[]
): { name: string; logCount: number }[] {
  const merged = new Map<string, { name: string; logCount: number }>()
  for (const row of rows) {
    const name = knownToolName(row.name) ?? row.name
    const key = toolKey(name)
    const current = merged.get(key)
    if (current) {
      current.logCount += row.logCount
    } else {
      merged.set(key, { name, logCount: row.logCount })
    }
  }
  return [...merged.values()].sort(
    (a, b) => b.logCount - a.logCount || a.name.localeCompare(b.name)
  )
}
