import { connect, Table } from "vectordb";
import path from "path";
import { storage } from "../storage.js";
import { DocumentChunk } from "../../shared/schema.js";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// LanceDB configuration
const LANCEDB_PATH = path.join(process.cwd(), "lancedb-data");

export class VectorService {
  private db: any = null;
  private table: Table<any> | null = null;

  async initialize() {
    try {
      // Connect to LanceDB
      this.db = await connect(LANCEDB_PATH);
      
      // Create or open the documents table
      const tableNames = await this.db.tableNames();
      
      if (tableNames.includes("documents")) {
        this.table = await this.db.openTable("documents");
      } else {
        // Create table with initial data
        this.table = await this.db.createTable("documents", [
          {
            vector: Array(1536).fill(0), // OpenAI ada-002 embedding size
            text: "init",
            documentId: 0,
            chunkIndex: 0,
            subjectId: 0,
          }
        ]);
      }

      console.log("Vector service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize vector service:", error);
      throw error;
    }
  }

  // Get embeddings from OpenAI
  async getEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  }

  // Process and store document chunks with embeddings
  async processDocumentChunks(documentId: number, subjectId: number, chunks: string[]) {
    if (!this.table) {
      await this.initialize();
    }

    try {
      // Process each chunk and create embeddings
      const records = await Promise.all(
        chunks.map(async (chunk, index) => {
          const embedding = await this.getEmbedding(chunk);
          return {
            vector: embedding,
            text: chunk,
            documentId,
            chunkIndex: index,
            subjectId,
          };
        })
      );

      // Add to vector database
      await this.table!.add(records);

      // Update database with embedding status
      const documentChunks = await storage.getDocumentChunks(documentId);
      for (let i = 0; i < documentChunks.length; i++) {
        // Mark as having embeddings (we'll store a flag instead of the actual embedding)
        await storage.updateDocumentChunk(documentChunks[i].id, {
          embedding: { processed: true },
        });
      }

      console.log(`Processed ${chunks.length} chunks for document ${documentId}`);
    } catch (error) {
      console.error(`Failed to process chunks for document ${documentId}:`, error);
      throw error;
    }
  }

  // Search for relevant documents based on a query
  async searchDocuments(query: string, subjectId?: number, topK: number = 5) {
    if (!this.table) {
      await this.initialize();
    }

    try {
      // Get query embedding
      const queryEmbedding = await this.getEmbedding(query);

      // Build search query
      let searchQuery = this.table!
        .search(queryEmbedding)
        .limit(topK);

      // Add filter if subject is specified
      if (subjectId !== undefined) {
        searchQuery = searchQuery.where(`"subjectId" = ${subjectId}`);
      }

      // Execute search
      const results = await searchQuery.execute();

      // Transform results to include full document info
      const enrichedResults = await Promise.all(
        results.map(async (result: any) => {
          const document = await storage.getDocument(result.documentId);
          
          return {
            content: result.text,
            score: result._distance || 0,
            documentId: result.documentId,
            chunkIndex: result.chunkIndex,
            documentName: document?.name || "Unknown",
            documentType: document?.type || "unknown",
            subjectId: result.subjectId,
          };
        })
      );

      return enrichedResults;
    } catch (error) {
      console.error("Failed to search documents:", error);
      throw error;
    }
  }

  // Generate answer using retrieved context
  async generateAnswerWithContext(query: string, subjectId?: number) {
    try {
      // Search for relevant documents
      const relevantDocs = await this.searchDocuments(query, subjectId, 5);
      
      // Build context from relevant documents
      const context = relevantDocs
        .map((doc, index) => 
          `[Tài liệu ${index + 1}: ${doc.documentName} - ${doc.documentType === 'theory' ? 'Lý thuyết' : 'Bài tập'}]\n${doc.content}`
        )
        .join("\n\n");

      // Build prompt with context
      const systemPrompt = `Tôi là trợ lý AI hỗ trợ học tập. Khi trả lời, tôi sẽ:

**Ưu tiên sử dụng nội dung từ tài liệu dưới đây:**
${context}

**Cách thức trả lời:**
- Tập trung chủ yếu vào thông tin từ tài liệu có liên quan
- Câu trả lời gọn gàng, đủ ý và có cấu trúc rõ ràng
- Xuống dòng và cách dòng hợp lý để dễ đọc
- Tạo bảng khi cần thiết để trình bày thông tin
- Gợi ý thêm bài tập cùng dạng ở cuối nếu phù hợp

Nếu thông tin trong tài liệu chưa đủ, tôi sẽ nói rõ và bổ sung kiến thức cần thiết.`;

      return {
        systemPrompt,
        relevantDocs,
        context,
      };
    } catch (error) {
      console.error("Failed to generate answer with context:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const vectorService = new VectorService();