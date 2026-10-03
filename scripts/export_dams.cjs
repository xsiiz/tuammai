const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve('.agents/skills/fetch-dam-water-data/data/dams_latest.json');
const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const tsContent = `import { DamTelemetry } from '../types/dam';

export const DAMS_DATA: DamTelemetry[] = ${JSON.stringify(raw.dams, null, 2)};
`;

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/dams.ts', tsContent, 'utf8');
console.log('Successfully written src/data/dams.ts with', raw.dams.length, 'dams');
