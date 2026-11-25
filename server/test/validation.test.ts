import assert from 'node:assert/strict';
import test from 'node:test';
import {
  stripControlCharacters,
  validateStoryInput,
  validateTtsInput,
} from '../src/validation.js';

test('stripControlCharacters removes C0/DEL controls', () => {
  assert.equal(stripControlCharacters('hi\u0000\u001Fthere\u007F'), 'hithere');
  assert.equal(stripControlCharacters('a\nb\tc'), 'a b c');
  assert.equal(stripControlCharacters('a\nb\tc', true), 'a\nbc');
});

test('validateStoryInput sanitizes and accepts valid input', () => {
  const result = validateStoryInput({
    age: 6,
    characters: ['  Tara the turtle  ', 'a brave\nmouse'],
    moral: '  Sharing\u0000 matters  ',
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    age: 6,
    characters: ['Tara the turtle', 'a brave mouse'],
    moral: 'Sharing matters',
  });
});

test('validateStoryInput rejects bad ages', () => {
  for (const age of [1, 11, 6.5, '6', undefined]) {
    const result = validateStoryInput({ age, characters: ['Tara'], moral: 'Kindness' });
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /Age must be a whole number between 2 and 10/);
  }
});

test('validateStoryInput enforces character count and length', () => {
  const tooFew = validateStoryInput({ age: 5, characters: [], moral: 'Kindness' });
  assert.equal(tooFew.ok, false);

  const tooMany = validateStoryInput({
    age: 5,
    characters: ['a', 'b', 'c', 'd', 'e'],
    moral: 'Kindness',
  });
  assert.equal(tooMany.ok, false);

  const tooLong = validateStoryInput({
    age: 5,
    characters: ['x'.repeat(41)],
    moral: 'Kindness',
  });
  assert.equal(tooLong.ok, false);
  if (!tooLong.ok) assert.match(tooLong.error, /40 characters or fewer/);
});

test('validateStoryInput enforces moral length', () => {
  const result = validateStoryInput({ age: 5, characters: ['Tara'], moral: 'x'.repeat(81) });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /80 characters or fewer/);
});

test('validateTtsInput keeps paragraphs but strips other controls', () => {
  const result = validateTtsInput({ text: '  Hello\u0000 there.\n\n\u0001Sleep well.  ' });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.text, 'Hello there.\n\nSleep well.');
});
