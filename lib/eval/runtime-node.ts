import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

// Node deployment uses a persistent SQLite file with the same D1-shaped operations.
const state=globalThis as typeof globalThis & {__lessonbenchDB?:NodeDatabase};
class NodeStatement {
 constructor(private database:DatabaseSync,private sql:string,private values:any[]=[]){ }
 bind(...values:any[]){return new NodeStatement(this.database,this.sql,values);}
 runSync(){const out=this.database.prepare(this.sql).run(...this.values);return {success:true,meta:{changes:Number(out.changes)}};}
 async run(){return this.runSync();}
 async first(){return this.database.prepare(this.sql).get(...this.values)??null;}
 async all(){return {results:this.database.prepare(this.sql).all(...this.values)};}
}
class NodeDatabase {
 private database:DatabaseSync;
 constructor(){
  const path=resolve(process.env.LESSONBENCH_DB_FILE||'data/lessonbench.sqlite');mkdirSync(dirname(path),{recursive:true});this.database=new DatabaseSync(path);
  this.database.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
  const version=this.database.prepare('PRAGMA user_version').get() as {user_version:number};
  if(version.user_version===0){const schema=readFileSync(resolve(process.cwd(),'drizzle/0000_clumsy_agent_brand.sql'),'utf8');this.database.exec('BEGIN');try{this.database.exec(schema.replaceAll('--> statement-breakpoint',''));this.database.exec('PRAGMA user_version=1; COMMIT');}catch(e){this.database.exec('ROLLBACK');throw e;}}
 }
 prepare(sql:string){return new NodeStatement(this.database,sql);}
 async batch(statements:NodeStatement[]){this.database.exec('BEGIN');try{const out=statements.map(s=>s.runSync());this.database.exec('COMMIT');return out;}catch(e){this.database.exec('ROLLBACK');throw e;}}
}
function db(){return state.__lessonbenchDB??=(new NodeDatabase());}
export const env=new Proxy({} as Record<string,unknown>,{get(_target,key){return key==='DB'?db():typeof key==='string'?process.env[key]:undefined;}});
