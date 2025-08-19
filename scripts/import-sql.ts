/*
 Import des users, annonces, profils et images depuis un dump SQL MySQL
 Usage:
   npx ts-node --transpile-only scripts/import-sql.ts --file dalon974_2025-08-18_213842.sql --apply
 Par défaut, dry-run (ne modifie pas la base) si --apply n'est pas fourni.
*/
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SQLTuple = (string | number | null | boolean | Date)[];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: { file: string; apply: boolean } = { file: 'dalon974_2025-08-18_213842.sql', apply: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--apply') opts.apply = true;
    else if (a === '--file') {
      const v = args[i + 1];
      if (!v) throw new Error('--file nécessite un chemin');
      opts.file = v; i++;
    }
  }
  return opts;
}

// Convertit '2025-08-16 13:03:36.239000' en Date UTC
function toDate(val: string | null): Date | null {
  if (!val) return null;
  const iso = val.replace(' ', 'T') + 'Z';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function unescapeMySqlString(s: string): string {
  // retire quotes externes déjà enlevées; ici, on remplace les séquences d’échappement usuelles
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\0/g, '\0')
    .replace(/\\b/g, '\b')
    .replace(/\\Z/g, '\x1a')
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"');
}

function parseValue(token: string): string | number | null | boolean {
  const trimmed = token.trim();
  if (trimmed.toLowerCase() === 'null') return null;
  // quoted string
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    const inner = trimmed.slice(1, -1);
    return unescapeMySqlString(inner);
  }
  // boolean-like tinyint
  if (trimmed === '0') return 0;
  if (trimmed === '1') return 1;
  // number
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed; // fallback
}

function splitTopLevelTuples(valuesBlob: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < valuesBlob.length; i++) {
    const ch = valuesBlob[i];
    if (ch === '(') {
      if (depth === 0) current = '';
      depth++;
      if (depth > 1) current += ch;
    } else if (ch === ')') {
      if (depth > 1) current += ch;
      depth--;
      if (depth === 0) tuples.push(current);
    } else {
      if (depth >= 1) current += ch;
    }
  }
  return tuples;
}

function splitTopLevelComma(s: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let inString = false;
  let prev = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "'" && prev !== '\\') {
      inString = !inString;
      cur += ch;
    } else if (ch === ',' && !inString) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
    prev = ch;
  }
  if (cur) parts.push(cur);
  return parts;
}

type DumpSections = {
  user: SQLTuple[];
  annonce: SQLTuple[];
  colocprofile: SQLTuple[];
  colocimage: SQLTuple[];
  annonceimage: SQLTuple[];
};

function extractInsertTuples(sql: string, table: keyof DumpSections): SQLTuple[] {
  // Match: INSERT INTO `table` VALUES (...),(...),(...);
  const pattern = 'INSERT\\s+INTO\\s+`' + table + '`\\s+VALUES\\s*\\((([\\s\\S]*?))\\);';
  const regex = new RegExp(pattern, 'i');
  const m = sql.match(regex);
  if (!m) return [];
  const valuesBlob = '(' + m[1] + ')';
  const tuplesStr = splitTopLevelTuples(valuesBlob);
  const tuples: SQLTuple[] = tuplesStr.map((tuple) => {
    const vals = splitTopLevelComma(tuple).map(parseValue);
    return vals as SQLTuple;
  });
  return tuples;
}

async function main() {
  const { file, apply } = parseArgs();
  const filePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) throw new Error(`Fichier introuvable: ${filePath}`);
  const sql = fs.readFileSync(filePath, 'utf8');

  const sections: DumpSections = {
    user: extractInsertTuples(sql, 'user'),
    annonce: extractInsertTuples(sql, 'annonce'),
    colocprofile: extractInsertTuples(sql, 'colocprofile'),
    colocimage: extractInsertTuples(sql, 'colocimage'),
    annonceimage: extractInsertTuples(sql, 'annonceimage'),
  };

  const counters = { users: 0, annonces: 0, profils: 0, colocImages: 0, annonceImages: 0 };

  // Import Users: (id, email, password, name, role, createdAt, updatedAt, providerId, displayName)
  for (const t of sections.user) {
    const [id, email, password, name, role, createdAt, updatedAt, providerId, displayName] = t as [string, string, string | null, string | null, string | null, string | null, string | null, string | null, string | null];
    const data = {
      id,
      email,
      password: password ?? null,
      name: name ?? null,
      role: role ?? null,
      providerId: providerId ?? null,
      displayName: displayName ?? null,
      createdAt: toDate(createdAt) ?? undefined,
      updatedAt: toDate(updatedAt) ?? undefined,
    } as const;
    if (apply) {
      await prisma.user.upsert({
        where: { id },
        update: {},
        create: data,
        select: { id: true },
      });
    }
    counters.users++;
  }

  // Import Annonces: (id, userId, title, description, imageUrl, photos, createdAt, updatedAt, mainPhotoIdx)
  for (const t of sections.annonce) {
    const [id, userId, title, description, imageUrl, photosStr, createdAt, updatedAt, mainPhotoIdx] = t as [string, string | null, string | null, string | null, string | null, string | null, string | null, string | null, number | null];
    let photos: any = null;
    if (typeof photosStr === 'string') {
      try {
        const unescaped = unescapeMySqlString(photosStr);
        photos = JSON.parse(unescaped);
      } catch {
        photos = null;
      }
    }
    const data = {
      id,
      userId: userId ?? null,
      title: title ?? null,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      photos,
      mainPhotoIdx: mainPhotoIdx ?? null,
      createdAt: toDate(createdAt) ?? undefined,
      updatedAt: toDate(updatedAt) ?? undefined,
    } as const;
    if (apply) {
      await prisma.annonce.upsert({ where: { id }, update: {}, create: data, select: { id: true } });
    }
    counters.annonces++;
  }

  // Import ColocProfile: (id, userId, title, description, imageUrl, photos, mainPhotoIdx, createdAt, updatedAt)
  for (const t of sections.colocprofile) {
    const [id, userId, title, description, imageUrl, photosStr, mainPhotoIdx, createdAt, updatedAt] = t as [string, string | null, string | null, string | null, string | null, string | null, number | null, string | null, string | null];
    let photos: any = null;
    if (typeof photosStr === 'string') {
      try {
        const unescaped = unescapeMySqlString(photosStr);
        photos = JSON.parse(unescaped);
      } catch {
        photos = null;
      }
    }
    const data = {
      id,
      userId: userId ?? null,
      title: title ?? null,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      photos,
      mainPhotoIdx: mainPhotoIdx ?? null,
      createdAt: toDate(createdAt) ?? undefined,
      updatedAt: toDate(updatedAt) ?? undefined,
    } as const;
    if (apply) {
      await prisma.colocProfile.upsert({ where: { id }, update: {}, create: data, select: { id: true } });
    }
    counters.profils++;
  }

  // Import ColocImage: (id, url, filename, createdAt, uploadedBy, isMain, size, type, storagePath, colocProfileId)
  for (const t of sections.colocimage) {
    const [id, url, filename, createdAt, uploadedBy, isMain, size, type, storagePath, colocProfileId] = t as [number, string, string | null, string | null, string | null, number | null, number | null, string | null, string | null, string];
    const data = {
      // Prisma permet d'insérer un id autoincrémenté si fourni côté MySQL
      id: Number(id),
      url,
      filename: filename ?? null,
      createdAt: toDate(createdAt) ?? undefined,
      uploadedBy: uploadedBy ?? null,
      isMain: Boolean(isMain ?? 0),
      size: size ?? null,
      type: type ?? null,
      storagePath: storagePath ?? null,
      colocProfileId,
    } as const;
    if (apply) {
      // upsert by id (unique PK)
      await prisma.colocImage.upsert({ where: { id: Number(id) }, update: {}, create: data, select: { id: true } });
    }
    counters.colocImages++;
  }

  // Import AnnonceImage (if any): (id, url, filename, createdAt, uploadedBy, isMain, size, type, storagePath, annonceId)
  for (const t of sections.annonceimage) {
    const [id, url, filename, createdAt, uploadedBy, isMain, size, type, storagePath, annonceId] = t as [number, string, string | null, string | null, string | null, number | null, number | null, string | null, string | null, string];
    const data = {
      id: Number(id),
      url,
      filename: filename ?? null,
      createdAt: toDate(createdAt) ?? undefined,
      uploadedBy: uploadedBy ?? null,
      isMain: Boolean(isMain ?? 0),
      size: size ?? null,
      type: type ?? null,
      storagePath: storagePath ?? null,
      annonceId,
    } as const;
    if (apply) {
      await prisma.annonceImage.upsert({ where: { id: Number(id) }, update: {}, create: data, select: { id: true } });
    }
    counters.annonceImages++;
  }

  console.log(`[import-sql] Résumé (apply=${apply}):`, counters);
}

main()
  .catch((e) => {
    console.error('[import-sql] Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
