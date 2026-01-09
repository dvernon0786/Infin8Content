#!/usr/bin/env tsx
/**
 * Generate TypeScript types from Supabase database schema
 * Uses DATABASE_URL to connect and query PostgreSQL information_schema
 */

import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

interface ColumnInfo {
  table_schema: string
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  udt_name: string
}

interface TableInfo {
  table_schema: string
  table_name: string
}

function pgTypeToTsType(udtName: string, isNullable: boolean): string {
  const typeMap: Record<string, string> = {
    uuid: 'string',
    text: 'string',
    varchar: 'string',
    char: 'string',
    jsonb: 'Json',
    json: 'Json',
    timestamp: 'string',
    timestamptz: 'string',
    date: 'string',
    time: 'string',
    boolean: 'boolean',
    bool: 'boolean',
    integer: 'number',
    int: 'number',
    int4: 'number',
    int8: 'number',
    bigint: 'number',
    smallint: 'number',
    real: 'number',
    double_precision: 'number',
    float4: 'number',
    float8: 'number',
    numeric: 'number',
    decimal: 'number',
  }

  const tsType = typeMap[udtName.toLowerCase()] || 'unknown'
  return isNullable ? `${tsType} | null` : tsType
}

async function generateTypes() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables')
    console.error('   Please set DATABASE_URL in .env.local')
    process.exit(1)
  }

  const client = new Client({ connectionString: databaseUrl })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Get all tables in public schema
    const tablesQuery = `
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    const tablesResult = await client.query<TableInfo>(tablesQuery)
    const tables = tablesResult.rows

    console.log(`📋 Found ${tables.length} tables`)

    // Get column information for all tables
    const columnsQuery = `
      SELECT 
        table_schema,
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default,
        udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `
    const columnsResult = await client.query<ColumnInfo>(columnsQuery)
    const columns = columnsResult.rows

    // Build type definitions
    const typeDefinitions: Record<string, Record<string, string>> = {}

    for (const column of columns) {
      if (!typeDefinitions[column.table_name]) {
        typeDefinitions[column.table_name] = {}
      }

      const isNullable = column.is_nullable === 'YES'
      const tsType = pgTypeToTsType(column.udt_name, isNullable)

      typeDefinitions[column.table_name][column.column_name] = tsType
    }

    // Generate TypeScript file
    let output = `export type Json =\n  | string\n  | number\n  | boolean\n  | null\n  | { [key: string]: Json | undefined }\n  | Json[]\n\n`

    output += `export type Database = {\n  public: {\n    Tables: {\n`

    for (const table of tables) {
      const tableName = table.table_name
      const rowType = typeDefinitions[tableName] || {}

      output += `      ${tableName}: {\n`
      output += `        Row: {\n`
      for (const [columnName, columnType] of Object.entries(rowType)) {
        output += `          ${columnName}: ${columnType}\n`
      }
      output += `        }\n`
      output += `        Insert: {\n`
      for (const [columnName, columnType] of Object.entries(rowType)) {
        // For inserts, make nullable fields optional and remove defaults
        const insertType = columnType.includes('| null') 
          ? columnType.replace(' | null', '') + ' | null'
          : columnType
        output += `          ${columnName}?: ${insertType}\n`
      }
      output += `        }\n`
      output += `        Update: {\n`
      for (const [columnName, columnType] of Object.entries(rowType)) {
        // For updates, all fields are optional
        output += `          ${columnName}?: ${columnType}\n`
      }
      output += `        }\n`
      output += `        Relationships: []\n`
      output += `      }\n`
    }

    // Get functions
    const functionsQuery = `
      SELECT 
        routine_name,
        routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `
    const functionsResult = await client.query<{ routine_name: string; routine_type: string }>(functionsQuery)
    const functions = functionsResult.rows

    output += `    }\n`
    output += `    Views: {\n      [_ in never]: never\n    }\n`
    output += `    Functions: {\n`
    
    for (const func of functions) {
      const funcName = func.routine_name
      // Get function parameters
      const paramsQuery = `
        SELECT 
          parameter_name,
          data_type,
          parameter_mode
        FROM information_schema.parameters
        WHERE specific_schema = 'public'
          AND specific_name = (
            SELECT specific_name 
            FROM information_schema.routines 
            WHERE routine_name = $1 
              AND routine_schema = 'public'
            LIMIT 1
          )
          AND parameter_mode = 'IN'
        ORDER BY ordinal_position
      `
      const paramsResult = await client.query<{
        parameter_name: string
        data_type: string
        parameter_mode: string
      }>(paramsQuery, [funcName])
      const params = paramsResult.rows

      // Get function return type
      const returnTypeQuery = `
        SELECT pg_get_function_result(p.oid) as return_type
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = $1
        LIMIT 1
      `
      const returnTypeResult = await client.query<{ return_type: string }>(returnTypeQuery, [funcName])
      const returnType = returnTypeResult.rows[0]?.return_type || 'unknown'

      // Parse return type - handle SETOF (array) and table types
      let returnsType = 'unknown'
      if (returnType.startsWith('SETOF ')) {
        const tableName = returnType.replace('SETOF ', '').trim()
        // Check if it's a table we know about
        if (tables.some(t => t.table_name === tableName)) {
          returnsType = `Database['public']['Tables']['${tableName}']['Row'][]`
        } else {
          returnsType = 'unknown[]'
        }
      } else if (returnType.includes('uuid')) {
        returnsType = 'string'
      } else if (returnType.includes('boolean')) {
        returnsType = 'boolean'
      } else if (returnType.includes('integer') || returnType.includes('bigint')) {
        returnsType = 'number'
      } else if (returnType.includes('text') || returnType.includes('varchar')) {
        returnsType = 'string'
      }

      output += `      ${funcName}: {\n`
      output += `        Args: {\n`
      if (params.length > 0) {
        for (const param of params) {
          const paramType = pgTypeToTsType(param.data_type, false)
          output += `          ${param.parameter_name}?: ${paramType}\n`
        }
      } else {
        // No parameters - use empty object
        output += `          [key: string]: never\n`
      }
      output += `        }\n`
      output += `        Returns: ${returnsType}\n`
      output += `      }\n`
    }
    
    output += `    }\n`
    output += `    Enums: {\n      [_ in never]: never\n    }\n`
    output += `    CompositeTypes: {\n      [_ in never]: never\n    }\n`
    output += `  }\n`
    output += `}\n`

    // Write to file
    const outputPath = path.join(__dirname, '../lib/supabase/database.types.ts')
    fs.writeFileSync(outputPath, output, 'utf-8')

    console.log(`✅ Types generated successfully: ${outputPath}`)
    console.log(`   Tables: ${tables.length}`)
    console.log(`   Total columns: ${columns.length}`)
  } catch (error) {
    console.error('❌ Error generating types:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

generateTypes()

