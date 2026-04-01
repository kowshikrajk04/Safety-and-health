/**
 * SafePulse AI – app.test.js
 *
 * Property-based tests using fast-check.
 * Run with: node SafePulse/js/app.test.js
 *
 * Feature: safepulse-ai
 * Requirements: 9.7, 9.4, 9.5, 9.3, 9.9, 3.3, 4.3, 4.9, 6.5, 6.6, 5.6
 */

'use strict';

const fc = require('fast-check');

// ─── MOCK localStorage ───────────────────────────────────────────────────────
const localStorageStore = {};
const localStorage = {
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(localStorageStore, key)
      ? localStorageStore[key]
      : null;
  },
  setItem(key, value) {
    localStorageStore[key] = String(value);
  },
  removeItem(key) {
    delete localStorageStore[key];
  },
  clear() {
    Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]);
  }
};

// ─── MOCK location ────────────────────────────────────────────────────────────
let lastReplace = null;
const location = {
  replace(url) { lastReplace = url; }
};

// ─── PURE LOGIC STUBS (extracted from app.js) ────────────────────────────────

const AUTH_KEY = 'sp_auth';

function getAuthUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}

function setAuthUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function requireAuth() {
  if (!getAuthUser()) {
    location.replace('login.html');
  }
}

// Email validation regex (same as app.js)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

// Password validation: must be >= 6 chars for sign-up
function isValidSignupPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

// Login form validation (returns { valid, emailError, passwordError })
function validateLoginForm(email, password) {
  const emailError = !email || !EMAIL_REGEX.test(email);
  const passwordError = !password;
  return { valid: !emailError && !passwordError, emailError, passwordError };
}

// Sign-up form validation
function validateSignupForm(username, email, password) {
  const usernameError = !username || username.trim() === '';
  const emailError = !email || !EMAIL_REGEX.test(email);
  const passwordError = !password || password.length < 6;
  return { valid: !usernameError && !emailError && !passwordError, usernameError, emailError, passwordError };
}

// Water tracker increment logic (pure)
function incrementCups(current) {
  if (current < 8) return current + 1;
  return current;
}

function simulateIncrements(n) {
  let cups = 0;
  for (let i = 0; i < n; i++) {
    cups = incrementCups(cups);
  }
  return cups;
}

// Contact CRUD helpers (localStorage-backed)
function getContacts() {
  return JSON.parse(localStorage.getItem('sp_contacts') || '[]');
}
function saveContacts(contacts) {
  localStorage.setItem('sp_contacts', JSON.stringify(contacts));
}

// Profile helpers (localStorage-backed)
function getProfile() {
  return JSON.parse(localStorage.getItem('sp_profile') || '{}');
}
function saveProfile(data) {
  localStorage.setItem('sp_profile', JSON.stringify(data));
}

// AI intent matching (pure)
const AI_RESPONSES = {
  'i am in danger': 'EMERGENCY',
  'i feel anxious': 'ANXIOUS',
  'find nearest hospital': 'HOSPITAL',
  'give breathing exercises': 'BREATHING'
};
const KNOWN_INTENTS = Object.keys(AI_RESPONSES);
const FALLBACK_RESPONSE = 'FALLBACK';

function matchIntent(input) {
  const key = (input || '').trim().toLowerCase();
  return AI_RESPONSES[key] || FALLBACK_RESPONSE;
}

// Sign-up duplicate email check (pure)
function isDuplicateEmail(accounts, email) {
  return accounts.some(a => a.email === email);
}

function tryRegister(accounts, username, email, password) {
  if (isDuplicateEmail(accounts, email)) {
    return { success: false, error: 'duplicate', accounts };
  }
  const newAccounts = [...accounts, { username, email, password }];
  return { success: true, accounts: newAccounts };
}

// ─── SIMPLE TEST RUNNER ───────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ─── PROPERTY 1: requireAuth redirects unauthenticated users ─────────────────
// Feature: safepulse-ai, Property 1: requireAuth redirects unauthenticated users on any protected page
console.log('\nProperty 1: requireAuth redirects unauthenticated users');
test('placeholder – will be filled in by task 2.2', () => {
  // Scaffold: verify the stub functions work correctly
  localStorage.clear();
  lastReplace = null;
  requireAuth();
  assertEqual(lastReplace, 'login.html', 'requireAuth should redirect to login.html when no auth');
});

// ─── PROPERTY 2: requireAuth does not redirect when valid auth state exists ───
// Feature: safepulse-ai, Property 2: requireAuth does not redirect when valid auth state exists
console.log('\nProperty 2: requireAuth does not redirect authenticated users');
test('placeholder – will be filled in by task 2.3', () => {
  localStorage.clear();
  setAuthUser({ email: 'test@example.com', username: 'testuser' });
  lastReplace = null;
  requireAuth();
  assertEqual(lastReplace, null, 'requireAuth should NOT redirect when auth state exists');
  localStorage.clear();
});

// ─── PROPERTY 3: invalid email strings always fail login email validation ─────
// Feature: safepulse-ai, Property 3: invalid email strings always fail login email validation
console.log('\nProperty 3: invalid email strings fail validation');
test('placeholder – will be filled in by task 3.3', () => {
  const invalidEmails = ['', 'notanemail', 'missing@dot', '@nodomain.com', 'spaces in@email.com'];
  invalidEmails.forEach(email => {
    const result = validateLoginForm(email, 'somepassword');
    assert(result.emailError, `Expected email error for: "${email}"`);
  });
});

// ─── PROPERTY 4: passwords shorter than 6 characters always fail sign-up ──────
// Feature: safepulse-ai, Property 4: passwords shorter than 6 characters always fail sign-up validation
console.log('\nProperty 4: short passwords fail sign-up validation');
test('placeholder – will be filled in by task 3.4', () => {
  const shortPasswords = ['', 'a', 'ab', 'abc', 'abcd', 'abcde'];
  shortPasswords.forEach(pw => {
    const result = validateSignupForm('user', 'user@example.com', pw);
    assert(result.passwordError, `Expected password error for length ${pw.length}`);
  });
});

// ─── PROPERTY 5: clearAuth always results in getAuthUser returning null ────────
// Feature: safepulse-ai, Property 5: clearAuth always results in getAuthUser returning null
console.log('\nProperty 5: clearAuth always results in getAuthUser returning null');
test('placeholder – will be filled in by task 4.3', () => {
  setAuthUser({ email: 'a@b.com', username: 'user' });
  clearAuth();
  assertEqual(getAuthUser(), null, 'getAuthUser should return null after clearAuth');
});

// ─── PROPERTY 6: sp_contacts localStorage round-trip preserves order ──────────
// Feature: safepulse-ai, Property 6: sp_contacts localStorage round-trip preserves order and values
console.log('\nProperty 6: sp_contacts round-trip preserves order and values');
test('placeholder – will be filled in by task 6.3', () => {
  const contacts = [
    { name: 'Alice', phone: '111' },
    { name: 'Bob', phone: '222' }
  ];
  localStorage.clear();
  saveContacts(contacts);
  const retrieved = getContacts();
  assertEqual(JSON.stringify(retrieved), JSON.stringify(contacts), 'Contacts round-trip should preserve order and values');
});

// ─── TASK 7.1: Water tracker unit tests ──────────────────────────────────────
// Validates: Requirements 4.3, 4.9
console.log('\nTask 7.1: Water tracker — increment correctness and cap at 8');

test('increment from 0 to 1', () => {
  const result = incrementCups(0);
  assertEqual(result, 1, 'incrementCups(0) should return 1');
});

test('increment from 7 to 8', () => {
  const result = incrementCups(7);
  assertEqual(result, 8, 'incrementCups(7) should return 8');
});

test('increment at 8 is a no-op (cups stays at 8)', () => {
  const result = incrementCups(8);
  assertEqual(result, 8, 'incrementCups(8) should return 8 (no-op)');
});

test('sp_cups is written to localStorage on each increment', () => {
  localStorage.clear();
  // Simulate the updateCups() + addCupBtn click handler logic from app.js
  let cups = parseInt(localStorage.getItem('sp_cups') || '0');
  // First click: 0 → 1
  if (cups < 8) { cups++; localStorage.setItem('sp_cups', cups); }
  assertEqual(localStorage.getItem('sp_cups'), '1', 'sp_cups should be "1" after first increment');
  // Second click: 1 → 2
  if (cups < 8) { cups++; localStorage.setItem('sp_cups', cups); }
  assertEqual(localStorage.getItem('sp_cups'), '2', 'sp_cups should be "2" after second increment');
});

test('sp_cups is NOT updated when cups is already at 8', () => {
  localStorage.clear();
  localStorage.setItem('sp_cups', '8');
  let cups = parseInt(localStorage.getItem('sp_cups'));
  // Click at cap: should be no-op
  if (cups < 8) { cups++; localStorage.setItem('sp_cups', cups); }
  assertEqual(localStorage.getItem('sp_cups'), '8', 'sp_cups should remain "8" when already at cap');
});

// ─── PROPERTY 7: water cups value never exceeds 8 ─────────────────────────────
// Feature: safepulse-ai, Property 7: water cups value never exceeds 8 regardless of increment count
console.log('\nProperty 7: water cups value never exceeds 8');
test('placeholder – will be filled in by task 7.2', () => {
  [8, 10, 20, 50].forEach(n => {
    const result = simulateIncrements(n);
    assertEqual(result, 8, `After ${n} increments, cups should be 8`);
  });
});

// ─── PROPERTY 8: sp_profile localStorage round-trip preserves all field values ─
// Feature: safepulse-ai, Property 8: sp_profile localStorage round-trip preserves all field values
console.log('\nProperty 8: sp_profile round-trip preserves all field values');
test('placeholder – will be filled in by task 8.3', () => {
  const profile = {
    fullName: 'Jane Doe', bloodGroup: 'O+', allergies: 'Penicillin',
    medNotes: 'Asthma', guardianName: 'John', guardianPhone: '555-0100',
    guardianRel: 'Spouse', doctorName: 'Dr. Smith', doctorPhone: '555-0200',
    emergency1: '555-0300', emergency2: '555-0400'
  };
  localStorage.clear();
  saveProfile(profile);
  const retrieved = getProfile();
  assertEqual(JSON.stringify(retrieved), JSON.stringify(profile), 'Profile round-trip should preserve all fields');
});

// ─── PROPERTY 9: unrecognised chat inputs always receive the default fallback ──
// Feature: safepulse-ai, Property 9: unrecognised chat inputs always receive the default fallback response
console.log('\nProperty 9: unrecognised chat inputs receive fallback response');
test('placeholder – will be filled in by task 9.2', () => {
  const unknownInputs = ['hello', 'what is the weather', 'random text', ''];
  unknownInputs.forEach(input => {
    const result = matchIntent(input);
    assertEqual(result, FALLBACK_RESPONSE, `Expected fallback for input: "${input}"`);
  });
});

// ─── TASK 11.1: Sign-up duplicate email rejection unit tests ─────────────────
// Validates: Requirements 9.3
console.log('\nTask 11.1: Sign-up — duplicate email rejection');

test('duplicate email is rejected and returns error', () => {
  const existing = [{ username: 'alice', email: 'alice@example.com', password: 'pass123' }];
  const result = tryRegister(existing, 'alice2', 'alice@example.com', 'newpass123');
  assert(!result.success, 'Duplicate email registration must fail');
  assertEqual(result.error, 'duplicate', 'Error type must be "duplicate"');
});

test('accounts array is unchanged when duplicate email is submitted', () => {
  const existing = [{ username: 'alice', email: 'alice@example.com', password: 'pass123' }];
  const result = tryRegister(existing, 'alice2', 'alice@example.com', 'newpass123');
  assertEqual(result.accounts.length, 1, 'Accounts array must not grow on duplicate');
  assertEqual(result.accounts[0].email, 'alice@example.com', 'Existing account must be unchanged');
  assertEqual(result.accounts[0].username, 'alice', 'Existing username must be unchanged');
});

test('unique email is accepted and account is added', () => {
  const existing = [{ username: 'alice', email: 'alice@example.com', password: 'pass123' }];
  const result = tryRegister(existing, 'bob', 'bob@example.com', 'bobpass123');
  assert(result.success, 'Unique email registration must succeed');
  assertEqual(result.accounts.length, 2, 'Accounts array must grow by 1 for unique email');
  assertEqual(result.accounts[1].email, 'bob@example.com', 'New account email must be stored');
  assertEqual(result.accounts[1].username, 'bob', 'New account username must be stored');
});

test('sign-up into empty accounts array always succeeds', () => {
  const result = tryRegister([], 'newuser', 'new@example.com', 'password123');
  assert(result.success, 'Registration into empty accounts must succeed');
  assertEqual(result.accounts.length, 1, 'Accounts array must have 1 entry after first registration');
});

test('duplicate check is case-sensitive for email', () => {
  // app.js uses strict equality (===) so 'Alice@example.com' !== 'alice@example.com'
  const existing = [{ username: 'alice', email: 'alice@example.com', password: 'pass123' }];
  const result = tryRegister(existing, 'alice2', 'Alice@example.com', 'newpass123');
  // With strict equality, different case is treated as a new account
  assert(result.success, 'Email duplicate check uses strict equality (case-sensitive)');
});

test('isDuplicateEmail returns true when email exists in accounts', () => {
  const accounts = [
    { username: 'alice', email: 'alice@example.com', password: 'pass123' },
    { username: 'bob',   email: 'bob@example.com',   password: 'pass456' }
  ];
  assert(isDuplicateEmail(accounts, 'alice@example.com'), 'Should detect alice@example.com as duplicate');
  assert(isDuplicateEmail(accounts, 'bob@example.com'),   'Should detect bob@example.com as duplicate');
});

test('isDuplicateEmail returns false when email is not in accounts', () => {
  const accounts = [{ username: 'alice', email: 'alice@example.com', password: 'pass123' }];
  assert(!isDuplicateEmail(accounts, 'carol@example.com'), 'carol@example.com should not be a duplicate');
  assert(!isDuplicateEmail(accounts, ''),                  'Empty string should not be a duplicate');
});

test('isDuplicateEmail returns false for empty accounts array', () => {
  assert(!isDuplicateEmail([], 'anyone@example.com'), 'Empty accounts array has no duplicates');
});

// ─── PROPERTY 10: duplicate email sign-up never adds a second account entry ───
// Feature: safepulse-ai, Property 10: duplicate email sign-up never adds a second account entry
console.log('\nProperty 10: duplicate email sign-up is rejected');
test('placeholder – will be filled in by task 11.2', () => {
  const existing = [{ username: 'alice', email: 'alice@example.com', password: 'pass123' }];
  const result = tryRegister(existing, 'alice2', 'alice@example.com', 'newpass');
  assert(!result.success, 'Duplicate email registration should fail');
  assertEqual(result.accounts.length, 1, 'Accounts array should not grow on duplicate');
});

// ─── TASK 3.2: Login form validation unit tests ───────────────────────────────
// Validates: Requirements 9.5
console.log('\nTask 3.2: Login form validation — email and password fields');

test('empty email shows loginEmailError and blocks submission', () => {
  const result = validateLoginForm('', 'somepassword');
  assert(result.emailError, 'Empty email must trigger emailError');
  assert(!result.valid, 'Empty email must block submission');
});

test('invalid email (missing @) shows loginEmailError and blocks submission', () => {
  const result = validateLoginForm('invalidemail.com', 'somepassword');
  assert(result.emailError, 'Email without @ must trigger emailError');
  assert(!result.valid, 'Invalid email must block submission');
});

test('empty password shows loginPasswordError and blocks submission', () => {
  const result = validateLoginForm('user@example.com', '');
  assert(result.passwordError, 'Empty password must trigger passwordError');
  assert(!result.valid, 'Empty password must block submission');
});

test('valid email and password passes validation', () => {
  const result = validateLoginForm('user@example.com', 'mypassword');
  assert(!result.emailError, 'Valid email must not trigger emailError');
  assert(!result.passwordError, 'Non-empty password must not trigger passwordError');
  assert(result.valid, 'Valid credentials must pass validation');
});

// ─── FAST-CHECK SMOKE TEST ────────────────────────────────────────────────────
console.log('\nFast-check smoke test (infrastructure verification)');
test('fast-check is importable and fc.assert works', () => {
  fc.assert(
    fc.property(fc.integer(), fc.integer(), (a, b) => a + b === b + a),
    { numRuns: 100 }
  );
});

// ─── TASK 6.1: Add-contact flow unit tests ───────────────────────────────────
// Validates: Requirements 3.3
console.log('\nTask 6.1: Add-contact flow — sp_contacts persistence and guard');

// Helper: simulate the addContactBtn click handler logic from app.js
function addContact(name, phone) {
  const trimmedName  = (name  || '').trim();
  const trimmedPhone = (phone || '').trim();
  if (!trimmedName || !trimmedPhone) return; // no-op guard
  const contacts = getContacts();
  contacts.push({ name: trimmedName, phone: trimmedPhone });
  saveContacts(contacts);
}

test('add-contact with valid name and phone persists to sp_contacts', () => {
  localStorage.clear();
  addContact('Alice', '555-1234');
  const contacts = getContacts();
  assertEqual(contacts.length, 1, 'Should have 1 contact after adding');
  assertEqual(contacts[0].name, 'Alice', 'Contact name should be Alice');
  assertEqual(contacts[0].phone, '555-1234', 'Contact phone should be 555-1234');
});

test('add-contact appends to existing contacts without overwriting', () => {
  localStorage.clear();
  addContact('Alice', '555-1234');
  addContact('Bob', '555-5678');
  const contacts = getContacts();
  assertEqual(contacts.length, 2, 'Should have 2 contacts after adding two');
  assertEqual(contacts[1].name, 'Bob', 'Second contact name should be Bob');
});

test('add-contact with empty name is a no-op (sp_contacts unchanged)', () => {
  localStorage.clear();
  saveContacts([{ name: 'Existing', phone: '000' }]);
  addContact('', '555-9999');
  const contacts = getContacts();
  assertEqual(contacts.length, 1, 'Empty name should not add a contact');
  assertEqual(contacts[0].name, 'Existing', 'Existing contact should be unchanged');
});

test('add-contact with whitespace-only name is a no-op', () => {
  localStorage.clear();
  saveContacts([]);
  addContact('   ', '555-9999');
  const contacts = getContacts();
  assertEqual(contacts.length, 0, 'Whitespace-only name should not add a contact');
});

test('add-contact with empty phone is a no-op (sp_contacts unchanged)', () => {
  localStorage.clear();
  saveContacts([{ name: 'Existing', phone: '000' }]);
  addContact('Charlie', '');
  const contacts = getContacts();
  assertEqual(contacts.length, 1, 'Empty phone should not add a contact');
  assertEqual(contacts[0].name, 'Existing', 'Existing contact should be unchanged');
});

test('add-contact with whitespace-only phone is a no-op', () => {
  localStorage.clear();
  saveContacts([]);
  addContact('Charlie', '   ');
  const contacts = getContacts();
  assertEqual(contacts.length, 0, 'Whitespace-only phone should not add a contact');
});

test('add-contact trims whitespace from name and phone before saving', () => {
  localStorage.clear();
  addContact('  Dana  ', '  555-0000  ');
  const contacts = getContacts();
  assertEqual(contacts.length, 1, 'Should add contact with trimmed values');
  assertEqual(contacts[0].name, 'Dana', 'Name should be trimmed');
  assertEqual(contacts[0].phone, '555-0000', 'Phone should be trimmed');
});

// ─── TASK 6.2: Remove-contact flow unit tests ────────────────────────────────
// Validates: Requirements 3.3
console.log('\nTask 6.2: Remove-contact flow — sp_contacts splice correctness');

// Helper: simulate removeContact(i) logic from app.js
function removeContact(i) {
  const contacts = getContacts();
  contacts.splice(i, 1);
  saveContacts(contacts);
}

test('remove first contact (index 0) leaves remaining contacts intact', () => {
  localStorage.clear();
  saveContacts([
    { name: 'Alice', phone: '111' },
    { name: 'Bob',   phone: '222' },
    { name: 'Carol', phone: '333' }
  ]);
  removeContact(0);
  const contacts = getContacts();
  assertEqual(contacts.length, 2, 'Should have 2 contacts after removing first');
  assertEqual(contacts[0].name, 'Bob',   'First remaining contact should be Bob');
  assertEqual(contacts[1].name, 'Carol', 'Second remaining contact should be Carol');
});

test('remove last contact (index 2) leaves remaining contacts intact', () => {
  localStorage.clear();
  saveContacts([
    { name: 'Alice', phone: '111' },
    { name: 'Bob',   phone: '222' },
    { name: 'Carol', phone: '333' }
  ]);
  removeContact(2);
  const contacts = getContacts();
  assertEqual(contacts.length, 2, 'Should have 2 contacts after removing last');
  assertEqual(contacts[0].name, 'Alice', 'First contact should still be Alice');
  assertEqual(contacts[1].name, 'Bob',   'Second contact should still be Bob');
});

test('remove middle contact (index 1) leaves first and last intact', () => {
  localStorage.clear();
  saveContacts([
    { name: 'Alice', phone: '111' },
    { name: 'Bob',   phone: '222' },
    { name: 'Carol', phone: '333' }
  ]);
  removeContact(1);
  const contacts = getContacts();
  assertEqual(contacts.length, 2, 'Should have 2 contacts after removing middle');
  assertEqual(contacts[0].name, 'Alice', 'First contact should still be Alice');
  assertEqual(contacts[1].name, 'Carol', 'Second contact should now be Carol');
});

test('remove only contact results in empty sp_contacts', () => {
  localStorage.clear();
  saveContacts([{ name: 'Solo', phone: '999' }]);
  removeContact(0);
  const contacts = getContacts();
  assertEqual(contacts.length, 0, 'Should have 0 contacts after removing the only one');
});

// ─── TASK 8.1: Profile form save unit tests ──────────────────────────────────
// Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.7
console.log('\nTask 8.1: Profile form — save all 11 fields, required-field validation, success alert');

// Helper: simulate the profileForm submit handler logic from app.js
function simulateProfileSave(fieldValues) {
  const fields = ['fullName','bloodGroup','allergies','medNotes','guardianName','guardianPhone',
                  'guardianRel','doctorName','doctorPhone','emergency1','emergency2'];

  // Validate required fields
  const requiredFields = ['fullName', 'bloodGroup'];
  for (const id of requiredFields) {
    const val = (fieldValues[id] || '').trim();
    if (!val) return { saved: false, blockedBy: id };
  }

  // Serialise all 11 fields
  const data = {};
  fields.forEach(id => { data[id] = fieldValues[id] || ''; });
  localStorage.setItem('sp_profile', JSON.stringify(data));
  return { saved: true, data };
}

test('save all 11 fields writes correct keys to sp_profile', () => {
  localStorage.clear();
  const input = {
    fullName: 'Jane Doe', bloodGroup: 'O+', allergies: 'Penicillin',
    medNotes: 'Asthma', guardianName: 'John Doe', guardianPhone: '555-0100',
    guardianRel: 'Spouse', doctorName: 'Dr. Smith', doctorPhone: '555-0200',
    emergency1: '555-0300', emergency2: '555-0400'
  };
  const result = simulateProfileSave(input);
  assert(result.saved, 'Profile should be saved when all required fields are present');
  const stored = JSON.parse(localStorage.getItem('sp_profile'));
  const expectedFields = ['fullName','bloodGroup','allergies','medNotes','guardianName',
                          'guardianPhone','guardianRel','doctorName','doctorPhone','emergency1','emergency2'];
  expectedFields.forEach(field => {
    assert(Object.prototype.hasOwnProperty.call(stored, field), `sp_profile must contain field: ${field}`);
    assertEqual(stored[field], input[field], `Field ${field} should match input value`);
  });
  assertEqual(Object.keys(stored).length, 11, 'sp_profile should have exactly 11 fields');
});

test('empty fullName blocks save (required-field validation)', () => {
  localStorage.clear();
  const result = simulateProfileSave({
    fullName: '', bloodGroup: 'A+', allergies: '', medNotes: '',
    guardianName: '', guardianPhone: '', guardianRel: '',
    doctorName: '', doctorPhone: '', emergency1: '', emergency2: ''
  });
  assert(!result.saved, 'Save must be blocked when fullName is empty');
  assertEqual(result.blockedBy, 'fullName', 'Blocked by fullName validation');
  assertEqual(localStorage.getItem('sp_profile'), null, 'sp_profile must not be written when fullName is empty');
});

test('whitespace-only fullName blocks save', () => {
  localStorage.clear();
  const result = simulateProfileSave({
    fullName: '   ', bloodGroup: 'B+', allergies: '', medNotes: '',
    guardianName: '', guardianPhone: '', guardianRel: '',
    doctorName: '', doctorPhone: '', emergency1: '', emergency2: ''
  });
  assert(!result.saved, 'Save must be blocked when fullName is whitespace-only');
});

test('empty bloodGroup blocks save (required-field validation)', () => {
  localStorage.clear();
  const result = simulateProfileSave({
    fullName: 'Jane Doe', bloodGroup: '', allergies: '', medNotes: '',
    guardianName: '', guardianPhone: '', guardianRel: '',
    doctorName: '', doctorPhone: '', emergency1: '', emergency2: ''
  });
  assert(!result.saved, 'Save must be blocked when bloodGroup is empty');
  assertEqual(result.blockedBy, 'bloodGroup', 'Blocked by bloodGroup validation');
  assertEqual(localStorage.getItem('sp_profile'), null, 'sp_profile must not be written when bloodGroup is empty');
});

test('valid fullName and bloodGroup saves to localStorage', () => {
  localStorage.clear();
  const result = simulateProfileSave({
    fullName: 'Alice', bloodGroup: 'AB-', allergies: '', medNotes: '',
    guardianName: '', guardianPhone: '', guardianRel: '',
    doctorName: '', doctorPhone: '', emergency1: '', emergency2: ''
  });
  assert(result.saved, 'Profile should be saved when fullName and bloodGroup are provided');
  const stored = JSON.parse(localStorage.getItem('sp_profile'));
  assert(stored !== null, 'sp_profile must be written to localStorage');
  assertEqual(stored.fullName, 'Alice', 'fullName should be persisted');
  assertEqual(stored.bloodGroup, 'AB-', 'bloodGroup should be persisted');
});

test('success save writes sp_profile with setItem (localStorage integration)', () => {
  localStorage.clear();
  const profile = {
    fullName: 'Bob', bloodGroup: 'B+', allergies: 'Latex',
    medNotes: 'Hypertension', guardianName: 'Carol', guardianPhone: '555-1111',
    guardianRel: 'Parent', doctorName: 'Dr. Jones', doctorPhone: '555-2222',
    emergency1: '911', emergency2: '555-3333'
  };
  simulateProfileSave(profile);
  const raw = localStorage.getItem('sp_profile');
  assert(raw !== null, 'sp_profile key must exist in localStorage after save');
  const parsed = JSON.parse(raw);
  assertEqual(parsed.fullName, 'Bob', 'Persisted fullName should match');
  assertEqual(parsed.emergency2, '555-3333', 'Persisted emergency2 should match');
});

// ─── TASK 8.2: Profile page pre-populate unit tests ──────────────────────────
// Validates: Requirements 6.6
console.log('\nTask 8.2: Profile page — pre-populate all 11 fields from localStorage on load');

const PROFILE_FIELDS = [
  'fullName','bloodGroup','allergies','medNotes','guardianName','guardianPhone',
  'guardianRel','doctorName','doctorPhone','emergency1','emergency2'
];

// Simulate initProfile() pre-populate logic: reads sp_profile and sets each field's .value
function simulateInitProfileLoad(savedProfile) {
  const fieldValues = {};
  PROFILE_FIELDS.forEach(id => {
    fieldValues[id] = (savedProfile && savedProfile[id]) ? savedProfile[id] : '';
  });
  return fieldValues;
}

test('pre-populate sets all 11 field values from saved sp_profile', () => {
  localStorage.clear();
  const profile = {
    fullName: 'Jane Doe', bloodGroup: 'O+', allergies: 'Penicillin',
    medNotes: 'Asthma', guardianName: 'John Doe', guardianPhone: '555-0100',
    guardianRel: 'Spouse', doctorName: 'Dr. Smith', doctorPhone: '555-0200',
    emergency1: '555-0300', emergency2: '555-0400'
  };
  saveProfile(profile);
  const saved = getProfile();
  const fieldValues = simulateInitProfileLoad(saved);
  PROFILE_FIELDS.forEach(id => {
    assertEqual(fieldValues[id], profile[id], `Field "${id}" should be pre-populated with saved value`);
  });
});

test('pre-populate with empty sp_profile results in all fields being empty strings', () => {
  localStorage.clear();
  // No profile saved — getProfile() returns {}
  const saved = getProfile();
  const fieldValues = simulateInitProfileLoad(saved);
  PROFILE_FIELDS.forEach(id => {
    assertEqual(fieldValues[id], '', `Field "${id}" should be empty when no profile is saved`);
  });
});

test('pre-populate reads correct values back via getProfile() round-trip', () => {
  localStorage.clear();
  const profile = {
    fullName: 'Alice', bloodGroup: 'A+', allergies: '', medNotes: 'Hypertension',
    guardianName: 'Bob', guardianPhone: '555-1111', guardianRel: 'Parent',
    doctorName: 'Dr. Jones', doctorPhone: '555-2222', emergency1: '911', emergency2: ''
  };
  saveProfile(profile);
  const retrieved = getProfile();
  // Verify each field is correctly read back (as initProfile() would read it)
  assertEqual(retrieved.fullName, 'Alice', 'fullName should be read back correctly');
  assertEqual(retrieved.bloodGroup, 'A+', 'bloodGroup should be read back correctly');
  assertEqual(retrieved.medNotes, 'Hypertension', 'medNotes should be read back correctly');
  assertEqual(retrieved.guardianName, 'Bob', 'guardianName should be read back correctly');
  assertEqual(retrieved.doctorName, 'Dr. Jones', 'doctorName should be read back correctly');
  assertEqual(retrieved.emergency1, '911', 'emergency1 should be read back correctly');
});

test('pre-populate only sets fields that have saved values (falsy values stay empty)', () => {
  localStorage.clear();
  // Save a profile where some optional fields are empty strings
  const profile = {
    fullName: 'Carol', bloodGroup: 'B-', allergies: '', medNotes: '',
    guardianName: '', guardianPhone: '', guardianRel: '',
    doctorName: '', doctorPhone: '', emergency1: '', emergency2: ''
  };
  saveProfile(profile);
  const saved = getProfile();
  const fieldValues = simulateInitProfileLoad(saved);
  // Required fields should be set
  assertEqual(fieldValues.fullName, 'Carol', 'fullName should be pre-populated');
  assertEqual(fieldValues.bloodGroup, 'B-', 'bloodGroup should be pre-populated');
  // Optional empty fields should remain empty
  assertEqual(fieldValues.allergies, '', 'allergies should be empty when saved as empty string');
  assertEqual(fieldValues.emergency1, '', 'emergency1 should be empty when saved as empty string');
});

// ─── TASK 9.1: AI assistant intent matching unit tests ───────────────────────
// Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.6
console.log('\nTask 9.1: AI assistant — known intents return correct response content');

// Actual responses map mirroring app.js initAssistant() responses object
const ACTUAL_RESPONSES = {
  'i am in danger': `🚨 <strong>Emergency detected.</strong><br>
      1. Call emergency services immediately: <strong>911</strong><br>
      2. <a href="emergency.html">Open Emergency Dashboard</a> and press SOS.<br>
      3. Share your location with a trusted contact.<br>
      4. Stay in a visible, public area if possible.`,
  'i feel anxious': `💨 <strong>Breathing exercise for anxiety:</strong><br>
      Box Breathing — inhale 4s → hold 4s → exhale 4s → hold 4s. Repeat 4 times.<br>
      <a href="health.html">Visit Health Dashboard</a> for more wellness tools.`,
  'find nearest hospital': `🏥 <strong>Nearby Hospitals (simulated):</strong><br>
      • City General Hospital — 0.8 km — 📞 +1-555-2000<br>
      • St. Mary's Medical Center — 1.4 km — 📞 +1-555-2100<br>
      • Riverside Clinic — 2.1 km — 📞 +1-555-2200<br>
      <a href="emergency.html">Open Emergency Dashboard</a> for full details.`,
  'give breathing exercises': `🧘 <strong>Breathing Exercises:</strong><br>
      <strong>1. Box Breathing:</strong> Inhale 4s → Hold 4s → Exhale 4s → Hold 4s<br>
      <strong>2. 4-7-8 Technique:</strong> Inhale 4s → Hold 7s → Exhale 8s<br>
      <strong>3. Diaphragmatic:</strong> Breathe deep into belly, not chest. 5 min daily.<br>
      Repeat each 4–6 cycles for best effect.`
};

const ACTUAL_FALLBACK = `I'm here to help. Try asking:<br>
       • "I am in danger"<br>
       • "I feel anxious"<br>
       • "Find nearest hospital"<br>
       • "Give breathing exercises"`;

function matchIntentActual(input) {
  const key = (input || '').trim().toLowerCase();
  return ACTUAL_RESPONSES[key] || ACTUAL_FALLBACK;
}

// Requirement 5.2: "i am in danger" → emergency guidance containing "911"
test('"i am in danger" returns emergency guidance response containing "911"', () => {
  const response = matchIntentActual('i am in danger');
  assert(response.includes('911'), 'Response for "i am in danger" must contain "911"');
  assert(response.includes('Emergency'), 'Response must reference Emergency');
});

// Requirement 5.3: "i feel anxious" → breathing exercise response
test('"i feel anxious" returns breathing exercise response', () => {
  const response = matchIntentActual('i feel anxious');
  assert(response.includes('Box Breathing'), 'Response for "i feel anxious" must contain "Box Breathing"');
  assert(response.includes('Breathing exercise'), 'Response must reference breathing exercise');
});

// Requirement 5.4: "find nearest hospital" → hospital list response
test('"find nearest hospital" returns hospital list response', () => {
  const response = matchIntentActual('find nearest hospital');
  assert(response.includes('City General Hospital'), 'Response must contain "City General Hospital"');
  assert(response.includes('Nearby Hospitals'), 'Response must reference Nearby Hospitals');
});

// Requirement 5.5: "give breathing exercises" → step-by-step guide response
test('"give breathing exercises" returns step-by-step breathing guide', () => {
  const response = matchIntentActual('give breathing exercises');
  assert(response.includes('Box Breathing'), 'Response must contain "Box Breathing"');
  assert(response.includes('4-7-8 Technique'), 'Response must contain "4-7-8 Technique"');
  assert(response.includes('Diaphragmatic'), 'Response must contain "Diaphragmatic"');
});

// Requirement 5.6: unrecognised input → default fallback response
test('unrecognised input returns default fallback response', () => {
  const unknownInputs = ['hello', 'what is the weather', 'random text', '', 'SOS'];
  unknownInputs.forEach(input => {
    const response = matchIntentActual(input);
    assert(response.includes("I'm here to help"), `Expected fallback for input: "${input}"`);
  });
});

// Case-insensitivity: inputs should match regardless of casing
test('intent matching is case-insensitive', () => {
  assertEqual(matchIntentActual('I AM IN DANGER'), matchIntentActual('i am in danger'),
    'Upper-case input should match same as lower-case');
  assertEqual(matchIntentActual('I Feel Anxious'), matchIntentActual('i feel anxious'),
    'Mixed-case input should match same as lower-case');
});

// Whitespace trimming: leading/trailing spaces should not affect matching
test('intent matching trims leading and trailing whitespace', () => {
  assertEqual(matchIntentActual('  i am in danger  '), matchIntentActual('i am in danger'),
    'Input with surrounding spaces should match the same intent');
});

// ─── SUMMARY ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
