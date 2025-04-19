import { describe, test, expect } from 'bun:test';
import { parseCommaSeparatedPossiblyQuotedString } from './custom-placeholders-helper';

describe('parseCommaSeparatedPossiblyQuotedString', () => {
  test('should return empty array for undefined input', () => {
    expect(parseCommaSeparatedPossiblyQuotedString(undefined)).toEqual([]);
  });

  test('should return empty array for empty string input', () => {
    expect(parseCommaSeparatedPossiblyQuotedString('')).toEqual([]);
  });

  test('should parse simple comma-separated values', () => {
    expect(parseCommaSeparatedPossiblyQuotedString('val1,val2,val3')).toEqual([
      'val1',
      'val2',
      'val3',
    ]);
  });

  test('should parse double-quoted values', () => {
    expect(parseCommaSeparatedPossiblyQuotedString('"val1","val2"')).toEqual([
      'val1',
      'val2',
    ]);
  });

  test('should parse single-quoted values', () => {
    expect(parseCommaSeparatedPossiblyQuotedString("'val1','val2'")).toEqual([
      'val1',
      'val2',
    ]);
  });

  test('should parse mixed quoted and unquoted values', () => {
    expect(
      parseCommaSeparatedPossiblyQuotedString('"val1",\'val2\',val3,"val4"')
    ).toEqual(['val1', 'val2', 'val3', 'val4']);
  });

  test('should handle spaces within quoted values', () => {
    expect(
      parseCommaSeparatedPossiblyQuotedString('"value one", \'value two\'')
    ).toEqual(['value one', 'value two']);
  });

  test('should handle commas within quoted values', () => {
    expect(
      parseCommaSeparatedPossiblyQuotedString('"value, one", \'value, two\'')
    ).toEqual(['value, one', 'value, two']);
  });

  test('should trim leading/trailing spaces from results', () => {
    expect(
      parseCommaSeparatedPossiblyQuotedString(
        ' " value one " , \' value two \' , value3  '
      )
    ).toEqual([' value one ', ' value two ', 'value3']);
  });

  test('should handle complex mix', () => {
    expect(
      parseCommaSeparatedPossiblyQuotedString(
        'first,"second, has comma",\'third has space\',fourth," ", \'\''
      )
    ).toEqual(['first', 'second, has comma', 'third has space', 'fourth', ' ', '']);
  });
}); 