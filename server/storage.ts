import { 
  users, 
  subjects, 
  chatSessions, 
  chatMessages, 
  documents, 
  videos, 
  userSettings,
  documentChunks,
  type User, 
  type InsertUser,
  type Subject,
  type InsertSubject,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type Document,
  type InsertDocument,
  type Video,
  type InsertVideo,
  type UserSettings,
  type InsertUserSettings,
  type DocumentChunk,
  type InsertDocumentChunk
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  // Subject operations
  getAllSubjects(): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;

  // Chat operations
  getChatSessions(userId: number): Promise<ChatSession[]>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: number, session: Partial<InsertChatSession>): Promise<ChatSession>;
  
  getChatMessages(sessionId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Document operations
  getDocuments(subjectId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // Document chunk operations
  createDocumentChunks(chunks: InsertDocumentChunk[]): Promise<DocumentChunk[]>;
  getDocumentChunks(documentId: number): Promise<DocumentChunk[]>;
  getDocumentChunkByIndex(documentId: number, chunkIndex: number): Promise<DocumentChunk | undefined>;
  updateDocumentChunk(id: number, chunk: Partial<InsertDocumentChunk>): Promise<DocumentChunk>;
  getDocument(id: number): Promise<Document | undefined>;

  // Video operations
  getVideos(subjectId: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;

  // Settings operations
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  createUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: number, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, insertUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(insertUser).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject || undefined;
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const [subject] = await db.insert(subjects).values(insertSubject).returning();
    return subject;
  }

  async getChatSessions(userId: number): Promise<ChatSession[]> {
    return await db.select().from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session || undefined;
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db.insert(chatSessions).values(insertSession).returning();
    return session;
  }

  async updateChatSession(id: number, insertSession: Partial<InsertChatSession>): Promise<ChatSession> {
    const [session] = await db.update(chatSessions).set({
      ...insertSession,
      updatedAt: new Date()
    }).where(eq(chatSessions.id, id)).returning();
    return session;
  }

  async getChatMessages(sessionId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }

  async getDocuments(subjectId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.subjectId, subjectId));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  async getVideos(subjectId: number): Promise<Video[]> {
    return await db.select().from(videos).where(eq(videos.subjectId, subjectId));
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db.insert(videos).values(insertVideo).returning();
    return video;
  }

  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async createUserSettings(insertSettings: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db.insert(userSettings).values(insertSettings).returning();
    return settings;
  }

  async updateUserSettings(userId: number, insertSettings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const [settings] = await db.update(userSettings).set({
      ...insertSettings,
      updatedAt: new Date()
    }).where(eq(userSettings.userId, userId)).returning();
    return settings;
  }
  
  async createDocumentChunks(chunks: InsertDocumentChunk[]): Promise<DocumentChunk[]> {
    return await db.insert(documentChunks).values(chunks).returning();
  }
  
  async getDocumentChunks(documentId: number): Promise<DocumentChunk[]> {
    return await db.select().from(documentChunks).where(eq(documentChunks.documentId, documentId)).orderBy(documentChunks.chunkIndex);
  }
  
  async getDocumentChunkByIndex(documentId: number, chunkIndex: number): Promise<DocumentChunk | undefined> {
    const [chunk] = await db.select().from(documentChunks)
      .where(and(
        eq(documentChunks.documentId, documentId),
        eq(documentChunks.chunkIndex, chunkIndex)
      ));
    return chunk || undefined;
  }
  
  async updateDocumentChunk(id: number, chunk: Partial<InsertDocumentChunk>): Promise<DocumentChunk> {
    const [updatedChunk] = await db.update(documentChunks)
      .set(chunk)
      .where(eq(documentChunks.id, id))
      .returning();
    return updatedChunk;
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }
}

export const storage = new DatabaseStorage();
