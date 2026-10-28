import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
export const cases = sqliteTable("cases", {id:text("id").primaryKey(),data:text("data").notNull(),createdAt:text("created_at").notNull()});
export const runs = sqliteTable("runs", {id:text("id").primaryKey(),name:text("name").notNull(),mode:text("mode").notNull(),status:text("status").notNull(),config:text("config").notNull(),datasetHash:text("dataset_hash").notNull(),createdAt:text("created_at").notNull(),updatedAt:text("updated_at").notNull()});
export const results = sqliteTable("results", {
  id:text("id").primaryKey(),runId:text("run_id").notNull().references(()=>runs.id),caseId:text("case_id").notNull(),provider:text("provider").notNull(),status:text("status").notNull(),snapshot:text("snapshot").notNull(),data:text("data"),error:text("error"),attempts:integer("attempts").notNull().default(0),lease:text("lease"),leaseUntil:integer("lease_until"),createdAt:text("created_at").notNull(),updatedAt:text("updated_at").notNull(),
},t=>[index("results_run_idx").on(t.runId),uniqueIndex("results_case_provider").on(t.runId,t.caseId,t.provider)]);
export const reviews = sqliteTable("reviews", {
  id:text("id").primaryKey(),runId:text("run_id").notNull().references(()=>runs.id),reviewer:text("reviewer").notNull(),caseId:text("case_id").notNull(),leftId:text("left_id").notNull(),rightId:text("right_id").notNull(),pairKey:text("pair_key").notNull(),vote:text("vote"),ratings:text("ratings"),comment:text("comment"),createdAt:text("created_at").notNull(),submittedAt:text("submitted_at"),
},t=>[uniqueIndex("reviewer_pair_unique").on(t.runId,t.reviewer,t.pairKey)]);
export const settings = sqliteTable("settings", {id:text("id").primaryKey(),data:text("data").notNull()});
