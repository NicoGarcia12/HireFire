import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { parseLinkedInZip } from '../src/utils/linkedin-profile-parser.js';

function zipOf(files: Record<string, string>): Buffer {
  const zip = new AdmZip();
  for (const [path, content] of Object.entries(files)) {
    zip.addFile(path, Buffer.from(content, 'utf-8'));
  }
  return zip.toBuffer();
}

describe('parseLinkedInZip() — profile', () => {
  it('extracts headline and summary from Profile.csv', () => {
    const buffer = zipOf({
      'Profile.csv': 'Headline,Summary\n"Backend Developer","Builds APIs"\n',
    });

    const result = parseLinkedInZip(buffer);

    assert.equal(result.headline, 'Backend Developer');
    assert.equal(result.summary, 'Builds APIs');
  });

  it('finds Profile.csv even nested in a subfolder, case-insensitively', () => {
    const buffer = zipOf({
      'export/PROFILE.csv': 'Headline,Summary\n"QA Engineer","Tests things"\n',
    });

    const result = parseLinkedInZip(buffer);

    assert.equal(result.headline, 'QA Engineer');
  });
});

describe('parseLinkedInZip() — skills', () => {
  it('extracts a flat list of skill names from Skills.csv', () => {
    const buffer = zipOf({ 'Skills.csv': 'Name\nNode.js\nTypeScript\n' });

    const result = parseLinkedInZip(buffer);

    assert.deepEqual(result.skills, ['Node.js', 'TypeScript']);
  });
});

describe('parseLinkedInZip() — positions', () => {
  it('extracts experience entries with title, company and description', () => {
    const buffer = zipOf({
      'Positions.csv': 'Title,Company Name,Description\nDev,Acme,Built things\n',
    });

    const result = parseLinkedInZip(buffer);

    assert.deepEqual(result.experience, [
      { title: 'Dev', company: 'Acme', description: 'Built things' },
    ]);
  });

  it('drops rows with neither a title nor a company', () => {
    const buffer = zipOf({
      'Positions.csv': 'Title,Company Name,Description\n,,Just a description\n',
    });

    const result = parseLinkedInZip(buffer);

    assert.deepEqual(result.experience, []);
  });
});

describe('parseLinkedInZip() — resilience', () => {
  it('returns empty defaults when the zip has none of the expected files', () => {
    const buffer = zipOf({ 'readme.txt': 'not a linkedin export' });

    const result = parseLinkedInZip(buffer);

    assert.deepEqual(result, {
      headline: '',
      summary: '',
      skills: [],
      experience: [],
      filesFound: ['readme.txt'],
    });
  });

  it('returns empty skills instead of throwing when the CSV is malformed', () => {
    const buffer = zipOf({ 'Skills.csv': 'Name\n"unterminated quote\nrow2\n' });

    const result = parseLinkedInZip(buffer);

    assert.deepEqual(result.skills, []);
  });
});
