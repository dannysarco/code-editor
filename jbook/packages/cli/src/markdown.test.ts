import { describe, expect, it } from 'vitest';
import { Cell } from '@my-scrapbook/types';
import { cellsToMarkdown, parseNotebook } from './markdown';

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
