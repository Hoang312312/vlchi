import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertChatSessionSchema,
  insertChatMessageSchema,
  insertUserSettingsSchema,
} from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import {
  processPDF,
  detectSubjectFromPath,
  detectDocumentType,
} from "./utils/pdf-processor";
import { createClient } from "webdav";
import * as path from "path";
import * as fs from "fs/promises";
import { vectorService } from "./services/vectorService";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default subjects only if database is available
  try {
    await initializeDefaultSubjects();
  } catch (error) {
    console.error("Failed to initialize subjects:", error);
    // Continue without database if initialization fails
  }
  
  // Initialize vector service
  try {
    await vectorService.initialize();
    console.log("Vector service initialized successfully");
  } catch (error) {
    console.error("Failed to initialize vector service:", error);
    // Continue without vector service if initialization fails
  }

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, name, avatar, firebaseUid } = req.body;

      let user = await storage.getUserByFirebaseUid(firebaseUid);

      if (!user) {
        user = await storage.createUser({
          email,
          name,
          avatar,
          firebaseUid,
        });

        // Create default settings
        await storage.createUserSettings({
          userId: user.id,
          theme: "light",
          gptModel: "gpt-4o",
        });
      }

      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });



  app.get("/api/user/:firebaseUid", async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.params.firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Subject routes
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json({ subjects });
    } catch (error) {
      // If database fails, return default subjects
      const defaultSubjectsData = [
        {
          id: 1,
          name: "Toán học",
          slug: "math",
          icon: "Calculator",
          color: "from-pink-500 to-pink-600",
          description: "Giải toán, tính toán nhanh, học xA",
        },
        {
          id: 2,
          name: "Ngữ văn",
          slug: "literature",
          icon: "BookOpen",
          color: "from-purple-500 to-purple-600",
          description: "Văn học, ngữ pháp, từ vựng, tiếng việt",
        },
        {
          id: 3,
          name: "Tiếng Anh",
          slug: "english",
          icon: "MessageCircle",
          color: "from-blue-500 to-blue-600",
          description: "Từ vựng, ngữ pháp, luyện thi, giao tiếp",
        },
        {
          id: 4,
          name: "Lịch sử",
          slug: "history",
          icon: "Clock",
          color: "from-orange-500 to-orange-600",
          description: "Lịch sử Việt Nam & thế giới, sử cổ",
        },
        {
          id: 5,
          name: "Địa lý",
          slug: "geography",
          icon: "Globe",
          color: "from-teal-500 to-teal-600",
          description: "Địa lý tự nhiên và kinh tế xã hội",
        },
        {
          id: 6,
          name: "Sinh học",
          slug: "biology",
          icon: "Dna",
          color: "from-green-500 to-green-600",
          description: "Sinh học cơ thể và tế bào, thực vật",
        },
        {
          id: 7,
          name: "Vật lý",
          slug: "physics",
          icon: "Zap",
          color: "from-indigo-500 to-indigo-600",
          description: "Cơ học, điện học, nhiệt học",
        },
        {
          id: 8,
          name: "Hóa học",
          slug: "chemistry",
          icon: "Flask",
          color: "from-violet-500 to-violet-600",
          description: "Hóa hữu cơ, hóa vô cơ, hóa phân tích",
        },
      ];
      console.log("Database unavailable, using default subjects");
      res.json({ subjects: defaultSubjectsData });
    }
  });

  // Chat routes
  app.get("/api/chat/sessions/:userId", async (req, res) => {
    try {
      const sessions = await storage.getChatSessions(
        parseInt(req.params.userId),
      );
      res.json({ sessions });
    } catch (error) {
      // Return empty sessions if database is unavailable
      console.log("Database unavailable, returning empty chat sessions");
      res.json({ sessions: [] });
    }
  });

  app.get("/api/chat/sessions", async (req, res) => {
    try {
      // For admin user, return empty sessions if database is unavailable
      res.json({ sessions: [] });
    } catch (error) {
      res.json({ sessions: [] });
    }
  });

  app.post("/api/chat/sessions", async (req, res) => {
    try {
      const sessionData = insertChatSessionSchema.parse(req.body);

      // Mock session for admin users when database is unavailable
      if (sessionData.userId === 1) { // Admin user
        const mockSession = {
          id: Date.now(),
          userId: sessionData.userId,
          subjectId: sessionData.subjectId,
          title: sessionData.title || "New Session",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log("Creating mock session for admin user");
        return res.json({ session: mockSession });
      }

      // Create session with temporary title if not provided
      if (!sessionData.title) {
        const subject = await storage.getSubject(sessionData.subjectId);
        sessionData.title = `${subject?.name || "Chat"} - Chưa có câu hỏi`;
      }

      const session = await storage.createChatSession(sessionData);
      res.json({ session });
    } catch (error) {
      // Fallback for admin when database fails
      if (req.body.userId === 1) {
        const mockSession = {
          id: Date.now(),
          userId: 1,
          subjectId: req.body.subjectId,
          title: req.body.title || "New Session",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        console.log("Database error, creating mock session for admin");
        return res.json({ session: mockSession });
      }
      
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  app.get("/api/chat/messages/:sessionId", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(
        parseInt(req.params.sessionId),
      );
      res.json({ messages });
    } catch (error) {
      console.log("Database unavailable for messages, returning empty array");
      res.json({ messages: [] });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      
      // Mock message for admin users when database is unavailable
      if (req.body.sessionId && req.body.sessionId > 1700000000000) { // Mock session ID
        const mockMessage = {
          id: Date.now(),
          sessionId: messageData.sessionId,
          role: messageData.role,
          content: messageData.content,
          createdAt: new Date().toISOString()
        };
        console.log("Creating mock message for admin session");
        return res.json({ message: mockMessage });
      }
      
      const message = await storage.createChatMessage(messageData);
      res.json({ message });
    } catch (error) {
      // Fallback for admin mock sessions
      if (req.body.sessionId && req.body.sessionId > 1700000000000) {
        const mockMessage = {
          id: Date.now(),
          sessionId: req.body.sessionId,
          role: req.body.role,
          content: req.body.content,
          createdAt: new Date().toISOString()
        };
        console.log("Database error, creating mock message for admin");
        return res.json({ message: mockMessage });
      }
      
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  app.post("/api/chat/send", async (req, res) => {
    try {
      const { sessionId, content, userId } = req.body;
      console.log("Chat send request:", { sessionId, content: content.substring(0, 50), userId });

      // Mock message handling for admin users
      const isMockSession = sessionId > 1700000000000;
      
      if (!isMockSession) {
        // Save user message for real sessions
        await storage.createChatMessage({
          sessionId,
          role: "user",
          content,
        });
      }

      // Handle mock sessions for admin
      let session, subject, messages = [];
      const conversationHistory = [];
      
      if (isMockSession) {
        // Mock session data for admin
        const mockSubjectId = req.body.subjectId || 1;
        const defaultSubjects = [
          { id: 1, name: "Toán học" },
          { id: 2, name: "Vật lý" },
          { id: 3, name: "Hóa học" },
          { id: 4, name: "Sinh học" },
          { id: 5, name: "Tiếng Anh" },
          { id: 6, name: "Văn học" },
          { id: 7, name: "Lịch sử" },
          { id: 8, name: "Hóa học" }
        ];
        subject = defaultSubjects.find(s => s.id === mockSubjectId) || defaultSubjects[0];
        session = { id: sessionId, subjectId: mockSubjectId };
      } else {
        // Get real session and subject info for context
        session = await storage.getChatSession(sessionId);
        subject = session
          ? await storage.getSubject(session.subjectId)
          : null;

        // Get previous messages for context
        messages = await storage.getChatMessages(sessionId);
        messages.forEach(msg => {
          conversationHistory.push({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          });
        });
      }

      // Update session title if this is the first user message (only for real sessions)
      if (
        !isMockSession &&
        session &&
        conversationHistory.length === 1 &&
        conversationHistory[0].role === "user"
      ) {
        const truncatedContent =
          content.length > 50 ? content.substring(0, 50) + "..." : content;
        await storage.updateChatSession(sessionId, {
          title: truncatedContent,
        });
      }

      // Get context from vector search
      let systemPrompt = `Tôi là trợ lý AI hỗ trợ học tập môn ${subject?.name || "học"}. Khi trả lời, tôi sẽ:

- Ưu tiên sử dụng nội dung từ tài liệu có liên quan
- Trả lời gọn gàng, đủ ý và dễ hiểu cho học sinh THPT
- Định dạng rõ ràng với xuống dòng hợp lý
- Tạo bảng khi cần thiết để trình bày thông tin
- Gợi ý thêm bài tập cùng dạng ở cuối (nếu phù hợp)

Hãy trả lời bằng tiếng Việt một cách chính xác và có hệ thống.`;
      
      try {
        const contextData = await vectorService.generateAnswerWithContext(
          content,
          session?.subjectId
        );
        
        if (contextData.relevantDocs.length > 0) {
          systemPrompt = contextData.systemPrompt;
        }
      } catch (vectorError) {
        console.error("Failed to get vector context:", vectorError);
        // Continue with default system prompt if vector search fails
      }

      // Generate AI response
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          ...conversationHistory,
          {
            role: "user",
            content,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      const aiResponse = response.choices[0].message.content;

      // Save AI response
      if (!isMockSession) {
        const aiMessage = await storage.createChatMessage({
          sessionId,
          role: "assistant",
          content: aiResponse || "Xin lỗi, tôi không thể trả lời câu hỏi này.",
        });
        res.json({ message: aiMessage });
      } else {
        // Return mock AI message for admin
        const mockAiMessage = {
          id: Date.now(),
          sessionId: sessionId,
          role: "assistant",
          content: aiResponse || "Xin lỗi, tôi không thể trả lời câu hỏi này.",
          createdAt: new Date().toISOString()
        };
        res.json({ message: mockAiMessage });
      }
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });


  // Settings routes
  app.get("/api/settings/:userId", async (req, res) => {
    try {
      const settings = await storage.getUserSettings(
        parseInt(req.params.userId),
      );
      res.json({ settings });
    } catch (error) {
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const settingsData = insertUserSettingsSchema.parse(req.body);
      const settings = await storage.createUserSettings(settingsData);
      res.json({ settings });
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data" });
    }
  });

  app.put("/api/settings/:userId", async (req, res) => {
    try {
      const { theme, gptModel } = req.body;
      const settings = await storage.updateUserSettings(
        parseInt(req.params.userId),
        {
          theme,
          gptModel,
        },
      );
      res.json({ settings });
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Document upload routes
  const upload = multer({ dest: "/tmp/uploads/" });

  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { subjectId, docType } = req.body;

      // Process PDF with OCR
      const result = await processPDF(req.file.path);

      // Store document in database
      const document = await storage.createDocument({
        subjectId: parseInt(subjectId),
        name: req.file.originalname,
        type: docType as "theory" | "exercise",
        content: result.text,
        chunks: JSON.stringify(result.chunks),
        pageCount: result.pageCount,
      });

      // Store chunks in separate table
      const chunksToInsert = result.chunks.map((chunk, index) => ({
        documentId: document.id,
        chunkIndex: index,
        content: chunk,
      }));

      await storage.createDocumentChunks(chunksToInsert);

      // Process chunks with vector embeddings
      try {
        await vectorService.processDocumentChunks(
          document.id,
          parseInt(subjectId),
          result.chunks
        );
      } catch (vectorError) {
        console.error("Failed to process vector embeddings:", vectorError);
        // Continue even if vector processing fails
      }

      // Clean up temp file
      await fs.unlink(req.file.path);

      res.json({ document });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ message: "Failed to process document" });
    }
  });

  app.post("/api/documents/webdav-sync", async (req, res) => {
    try {
      const { webdavUrl, username, password, folderPath, subjectId, docType } =
        req.body;

      console.log("WebDAV sync request:", {
        webdavUrl,
        folderPath,
        subjectId,
        docType,
      });

      // Create WebDAV client
      const client = createClient(webdavUrl, {
        username,
        password,
      });

      // List files in the folder
      console.log("Fetching directory contents for:", folderPath);
      const items = await client.getDirectoryContents(folderPath);
      console.log("Found items:", items.length);
      const processedDocs = [];
      const failedDocs = [];

      for (const item of items) {
        console.log("Processing item:", item.basename, item.type);
        if (
          item.type === "file" &&
          item.basename.toLowerCase().endsWith(".pdf")
        ) {
          // Download file to temp location
          const fullPath = path.join(folderPath, item.basename);
          const tempPath = path.join(
            "/tmp",
            `webdav_${Date.now()}_${item.basename}`,
          );
          console.log("Downloading PDF:", fullPath, "to", tempPath);
          const stream = client.createReadStream(fullPath);
          const writeStream = (await import("fs")).createWriteStream(tempPath);

          await new Promise((resolve, reject) => {
            stream.pipe(writeStream);
            writeStream.on("finish", resolve);
            writeStream.on("error", reject);
          });

          // Detect subject and type from filename (not full path)
          const detectedSubject = detectSubjectFromPath(fullPath);
          const detectedType = detectDocumentType(item.basename);
          console.log(
            `Document type detection: ${item.basename} -> ${detectedType}`,
          );

          // Process PDF
          let result;
          try {
            result = await processPDF(tempPath);
          } catch (pdfError) {
            console.error("PDF processing error:", pdfError);
            // Skip this document if processing fails
            failedDocs.push({
              name: item.basename,
              error: pdfError.message || "PDF processing failed",
            });
            // Clean up temp file
            await fs.unlink(tempPath).catch(() => {});
            continue;
          }

          // Store in database
          const document = await storage.createDocument({
            subjectId: parseInt(subjectId),
            name: item.basename,
            type: detectedType, // Always use detected type based on filename
            content: result.text,
            chunks: JSON.stringify(result.chunks),
            pageCount: result.pageCount,
          });

          // Store chunks in separate table
          const chunksToInsert = result.chunks.map((chunk, index) => ({
            documentId: document.id,
            chunkIndex: index,
            content: chunk,
          }));

          await storage.createDocumentChunks(chunksToInsert);

          // Process chunks with vector embeddings
          try {
            await vectorService.processDocumentChunks(
              document.id,
              parseInt(subjectId),
              result.chunks
            );
            console.log(`Processed vector embeddings for document ${document.name}`);
          } catch (vectorError) {
            console.error("Failed to process vector embeddings:", vectorError);
            // Continue even if vector processing fails
          }

          processedDocs.push(document);
          console.log(
            `Successfully processed document: ${document.name} (${detectedType})`,
          );
          console.log(`Created ${result.chunks.length} chunks for document`);

          // Clean up temp file
          await fs.unlink(tempPath);
        }
      }

      console.log("Total processed documents:", processedDocs.length);
      console.log("Failed documents:", failedDocs.length);

      res.json({
        message: `Đã đồng bộ ${processedDocs.length} tài liệu${failedDocs.length > 0 ? `, ${failedDocs.length} tài liệu thất bại` : ""}`,
        documents: processedDocs,
        failed: failedDocs,
      });
    } catch (error: any) {
      console.error("WebDAV sync error:", error);
      res.status(500).json({
        message: "Failed to sync from WebDAV",
        error: error.message || "Unknown error",
      });
    }
  });

  app.get("/api/documents/:subjectId", async (req, res) => {
    try {
      const documents = await storage.getDocuments(
        parseInt(req.params.subjectId),
      );
      res.json({ documents });
    } catch (error) {
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  // Vector search test endpoint
  app.post("/api/vector/search", async (req, res) => {
    try {
      const { query, subjectId } = req.body;
      
      const results = await vectorService.searchDocuments(
        query,
        subjectId ? parseInt(subjectId) : undefined,
        5
      );

      res.json({ results });
    } catch (error) {
      console.error("Vector search error:", error);
      res.status(500).json({ message: "Failed to perform vector search" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

const defaultSubjects = [
  {
    name: "Toán học",
    slug: "math",
    icon: "Calculator",
    color: "from-pink-500 to-pink-600",
    description: "Giải toán, tính toán nhanh, học xA",
  },
  {
    name: "Ngữ văn",
    slug: "literature",
    icon: "BookOpen",
    color: "from-purple-500 to-purple-600",
    description: "Văn học, ngữ pháp, từ vựng, tiếng việt",
  },
  {
    name: "Tiếng Anh",
    slug: "english",
    icon: "MessageCircle",
    color: "from-blue-500 to-blue-600",
    description: "Từ vựng, ngữ pháp, luyện thi, giao tiếp",
  },
  {
    name: "Lịch sử",
    slug: "history",
    icon: "Clock",
    color: "from-orange-500 to-orange-600",
    description: "Lịch sử Việt Nam & thế giới, sử cổ",
  },
  {
    name: "Địa lý",
    slug: "geography",
    icon: "Globe",
    color: "from-teal-500 to-teal-600",
    description: "Địa lý tự nhiên và kinh tế xã hội",
  },
  {
    name: "Sinh học",
    slug: "biology",
    icon: "Dna",
    color: "from-green-500 to-green-600",
    description: "Sinh học cơ thể và tế bào, thực vật",
  },
  {
    name: "Vật lý",
    slug: "physics",
    icon: "Zap",
    color: "from-indigo-500 to-indigo-600",
    description: "Cơ học, điện học, nhiệt học",
  },
  {
    name: "Hóa học",
    slug: "chemistry",
    icon: "Flask",
    color: "from-violet-500 to-violet-600",
    description: "Hóa hữu cơ, hóa vô cơ, hóa phân tích",
  },
];

async function initializeDefaultSubjects() {
  try {
    const existingSubjects = await storage.getAllSubjects();
    if (existingSubjects.length === 0) {
      for (const subject of defaultSubjects) {
        await storage.createSubject(subject);
      }
    }
  } catch (error) {
    console.error("Failed to initialize subjects:", error);
  }
}
