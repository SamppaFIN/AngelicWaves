import { 
  users, 
  frequencyReports, 
  type User, 
  type InsertUser, 
  type FrequencyReport, 
  type InsertFrequencyReport,
  type DetectedFrequency
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveFrequencyReport(report: InsertFrequencyReport): Promise<FrequencyReport>;
  getFrequencyReports(): Promise<FrequencyReport[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private frequencyReports: Map<number, FrequencyReport>;
  private userCurrentId: number;
  private reportCurrentId: number;

  constructor() {
    this.users = new Map();
    this.frequencyReports = new Map();
    this.userCurrentId = 1;
    this.reportCurrentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveFrequencyReport(report: InsertFrequencyReport): Promise<FrequencyReport> {
    const id = this.reportCurrentId++;
    const now = new Date();
    
    // Ensure detectedFrequencies is properly typed as an array
    const detectedFrequencies = Array.isArray(report.detectedFrequencies) 
      ? report.detectedFrequencies as DetectedFrequency[]
      : [];
    
    // Create properly typed frequency report
    const frequencyReport: FrequencyReport = { 
      id,
      detectedFrequencies,
      analysis: report.analysis || "",
      userNotes: report.userNotes || null,
      createdAt: now 
    };
    
    this.frequencyReports.set(id, frequencyReport);
    return frequencyReport;
  }

  async getFrequencyReports(): Promise<FrequencyReport[]> {
    return Array.from(this.frequencyReports.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
}

export const storage = new MemStorage();
