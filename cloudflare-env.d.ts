declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    DEEPSEEK_API_KEY?: string;
    DASHSCOPE_API_KEY?: string;
    ZAI_API_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
