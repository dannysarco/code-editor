import { describe, expect, it } from 'vitest';
import { Cell } from '@my-scrapbook/types';
import { cellsToMarkdown, markdownToCells, parseNotebook } from './markdown';

const cell = (type: Cell['type'], content: string, id = 'x'): Cell => ({
  id,
  type,
  content,
});

describe('parseNotebook', () => {
  it('parses a valid notebook file', () => {
    const raw = JSON.stringify([
      cell('text', '# Hello'),
      cell('code', 'show(1);'),
    ]);
    expect(parseNotebook(raw)).toHaveLength(2);
  });

  it('ignores extra fields on cells', () => {
    const raw = JSON.stringify([
      { id: 'a', type: 'code', content: 'show(1);', futureField: true },
    ]);
    expect(parseNotebook(raw)).toHaveLength(1);
  });

  it('rejects invalid JSON', () => {
    expect(() => parseNotebook('const x = 1;')).toThrow('not valid JSON');
  });

  it('rejects JSON that is not an array', () => {
    expect(() => parseNotebook('{"cells": []}')).toThrow('array of cells');
  });

  it('rejects entries that are not cells', () => {
    expect(() => parseNotebook('[{"type": "wat", "content": ""}]')).toThrow(
      'cell 1 is not a code or text cell'
    );
    expect(() => parseNotebook('[{"type": "code", "content": 42}]')).toThrow(
      'cell 1 is not a code or text cell'
    );
    expect(() => parseNotebook('["nope"]')).toThrow(
      'cell 1 is not a code or text cell'
    );
  });
});

describe('cellsToMarkdown', () => {
  it('emits text cells verbatim and code cells fenced', () => {
    const md = cellsToMarkdown([
      cell('text', '# Notes'),
      cell('code', "show('hi');"),
    ]);
    expect(md).toBe("# Notes\n\n```jsx\nshow('hi');\n```\n");
  });

  it('trims trailing whitespace so cells are separated by one blank line', () => {
    const md = cellsToMarkdown([
      cell('text', '# Notes\n\n\n'),
      cell('text', 'Body'),
    ]);
    expect(md).toBe('# Notes\n\nBody\n');
  });

  it('lengthens the fence when code contains backtick runs', () => {
    const md = cellsToMarkdown([cell('code', 'const md = `\n```js\n`;')]);
    expect(md.startsWith('````jsx\n')).toBe(true);
    expect(md.endsWith('\n````\n')).toBe(true);
  });

  it('handles an empty notebook', () => {
    expect(cellsToMarkdown([])).toBe('\n');
  });
});

describe('markdownToCells', () => {
  const shapes = (cells: Cell[]) =>
    cells.map(({ type, content }) => ({ type, content }));

  it('turns JS/TS fences into code cells and the rest into text cells', () => {
    const cells = markdownToCells(
      '# Notes\n\nSome prose.\n\n```jsx\nshow(1);\n```\n\nMore prose.\n'
    );
    expect(shapes(cells)).toEqual([
      { type: 'text', content: '# Notes\n\nSome prose.' },
      { type: 'code', content: 'show(1);' },
      { type: 'text', content: 'More prose.' },
    ]);
  });

  it('accepts every JS/TS language tag, case-insensitively', () => {
    for (const lang of ['js', 'jsx', 'ts', 'tsx', 'JavaScript', 'TypeScript']) {
      const cells = markdownToCells(`\`\`\`${lang}\nshow(1);\n\`\`\`\n`);
      expect(cells).toHaveLength(1);
      expect(cells[0].type).toBe('code');
    }
  });

  it('keeps other-language fences inside text cells, fences included', () => {
    const cells = markdownToCells(
      'Prose\n\n```python\nprint(1)\n```\n\nAfter\n'
    );
    expect(shapes(cells)).toEqual([
      {
        type: 'text',
        content: 'Prose\n\n```python\nprint(1)\n```\n\nAfter',
      },
    ]);
  });

  it('does not mistake a jsx opener inside a longer non-code fence for a cell', () => {
    const md = '````\n```jsx\nnot a cell\n```\n````\n';
    const cells = markdownToCells(md);
    expect(shapes(cells)).toEqual([
      { type: 'text', content: '````\n```jsx\nnot a cell\n```\n````' },
    ]);
  });

  it('handles lengthened fences around code containing backtick runs', () => {
    const cells = markdownToCells('````jsx\nconst md = `\n```js\n`;\n````\n');
    expect(shapes(cells)).toEqual([
      { type: 'code', content: 'const md = `\n```js\n`;' },
    ]);
  });

  it('treats an unclosed fence as running to the end of the file', () => {
    const cells = markdownToCells('```js\nshow(1);\nshow(2);\n');
    expect(shapes(cells)).toEqual([
      { type: 'code', content: 'show(1);\nshow(2);' },
    ]);
  });

  it('normalizes CRLF line endings', () => {
    const cells = markdownToCells('# Hi\r\n\r\n```js\r\nshow(1);\r\n```\r\n');
    expect(shapes(cells)).toEqual([
      { type: 'text', content: '# Hi' },
      { type: 'code', content: 'show(1);' },
    ]);
  });

  it('produces no cells for empty or blank markdown', () => {
    expect(markdownToCells('')).toEqual([]);
    expect(markdownToCells('\n\n  \n')).toEqual([]);
  });

  it('assigns each cell a unique non-empty id', () => {
    const cells = markdownToCells('a\n\n```js\n1\n```\n\nb\n');
    const ids = cells.map((c) => c.id);
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('round-trips a notebook through export and back', () => {
    const original: Cell[] = [
      cell('text', '# Title\n\nProse with `inline code`.'),
      cell('code', "import axios from 'axios';\nshow(axios);"),
      cell('code', 'const md = `\n```js\n`;'),
      cell('text', 'The end.'),
    ];
    const back = markdownToCells(cellsToMarkdown(original));
    expect(shapes(back)).toEqual(
      original.map(({ type, content }) => ({ type, content }))
    );
  });
});
