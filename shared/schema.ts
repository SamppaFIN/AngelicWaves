import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const frequencyReports = pgTable("frequency_reports", {
  id: serial("id").primaryKey(),
  detectedFrequencies: json("detected_frequencies").$type<DetectedFrequency[]>().notNull(),
  analysis: text("analysis").notNull(),
  userNotes: text("user_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFrequencyReportSchema = createInsertSchema(frequencyReports).pick({
  detectedFrequencies: true,
  analysis: true,
  userNotes: true,
});

export interface DetectedFrequency {
  frequency: number;
  duration: number;
  timestamp: number;
}

export interface FrequencyAnalysis {
  detectedFrequencies: DetectedFrequency[];
  analysis: string;
  userNotes?: string;
}

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FrequencyReport = typeof frequencyReports.$inferSelect;
export type InsertFrequencyReport = z.infer<typeof insertFrequencyReportSchema>;
