/**
 * Pet Calendar CRM - Google Apps Script Backend
 * 
 * 設置指示:
 * 1. 在 Google Drive 創建一個新的 Google Sheet
 * 2. Tools > Script Editor
 * 3. 粘貼此代碼
 * 4. 部署 > New deployment > Web App
 * 5. 設置 "Anyone with Google account" 訪問權限
 * 6. 複製 Web App URL 到前端 config.js
 */

// ============== CONFIG ==============
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // 替換為你的 Google Sheet ID
const ADMIN_EMAIL = 'alan.yoshiki@gmail.com'; // Admin email

// ============== HELPERS ==============
function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function generateId() {
  return Utilities.getUuid();
}

function hashPassword(password) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password)
    .map(b => ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2))
    .join('');
}

function getTimestamp() {
  return new Date().toISOString();
}

function parseJSON(body) {
  try {
    return JSON.parse(body);
  } catch (e) {
    return null;
  }
}

function requireAuth(headers) {
  const token = headers['Authorization'];
  if (!token || !token.startsWith('Bearer ')) {
    return null;
  }
  return token.replace('Bearer ', '');
}

function validateUser(token) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => row[h] = data[i][idx]);
    if (row.token === token) {
      return row;
    }
  }
  return null;
}

function isAdmin(email) {
  return email === ADMIN_EMAIL;
}

function returnJSON(response, status, data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .addHeader('Access-Control-Allow-Origin', '*');
}

// ============== DOGET ==============
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Pet Calendar')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============== API ROUTES ==============
function doPost(e) {
  const headers = e.parameter;
  const body = parseJSON(e.postData.contents);
  
  if (!body || !body.action) {
    return returnJSON(null, 400, { error: 'Missing action' });
  }
  
  const action = body.action;
  
  try {
    switch (action) {
      case 'register':
        return handleRegister(body);
      case 'login':
        return handleLogin(body);
      case 'logout':
        return handleLogout(body);
      
      // Pets
      case 'getPets':
        return handleGetPets(body, headers);
      case 'createPet':
        return handleCreatePet(body, headers);
      case 'updatePet':
        return handleUpdatePet(body, headers);
      case 'deletePet':
        return handleDeletePet(body, headers);
      
      // Events
      case 'getEvents':
        return handleGetEvents(body, headers);
      case 'createEvent':
        return handleCreateEvent(body, headers);
      case 'updateEvent':
        return handleUpdateEvent(body, headers);
      case 'deleteEvent':
        return handleDeleteEvent(body, headers);
      
      // Food Logs
      case 'getFoodLogs':
        return handleGetFoodLogs(body, headers);
      case 'createFoodLog':
        return handleCreateFoodLog(body, headers);
      
      // Poop Logs
      case 'getPoopLogs':
        return handleGetPoopLogs(body, headers);
      case 'createPoopLog':
        return handleCreatePoopLog(body, headers);
      
      // Health Logs
      case 'getHealthLogs':
        return handleGetHealthLogs(body, headers);
      case 'createHealthLog':
        return handleCreateHealthLog(body, headers);
      
      // Admin
      case 'adminGetUsers':
        return handleAdminGetUsers(body, headers);
      case 'adminGetAllData':
        return handleAdminGetAllData(body, headers);
      
      default:
        return returnJSON(null, 400, { error: 'Unknown action: ' + action });
    }
  } catch (error) {
    return returnJSON(null, 500, { error: error.toString() });
  }
}

// ============== AUTH HANDLERS ==============
function handleRegister(body) {
  const { email, password, name } = body;
  
  if (!email || !password || !name) {
    return returnJSON(null, 400, { error: 'Missing required fields' });
  }
  
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Check if email exists
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => row[h] = data[i][idx]);
    if (row.email === email) {
      return returnJSON(null, 400, { error: 'Email already registered' });
    }
  }
  
  const userId = generateId();
  const passwordHash = hashPassword(password);
  const token = generateId();
  const role = email === ADMIN_EMAIL ? 'admin' : 'user';
  
  sheet.appendRow([userId, email, passwordHash, name, role, token, getTimestamp()]);
  
  return returnJSON(null, 200, { 
    success: true, 
    user: { userId, email, name, role },
    token 
  });
}

function handleLogin(body) {
  const { email, password } = body;
  
  if (!email || !password) {
    return returnJSON(null, 400, { error: 'Missing required fields' });
  }
  
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => row[h] = data[i][idx]);
    if (row.email === email) {
      const passwordHash = hashPassword(password);
      if (row.passwordHash === passwordHash) {
        const token = generateId();
        // Update token
        const sheetRow = i + 1;
        sheet.getRange(sheetRow, headers.indexOf('token') + 1).setValue(token);
        
        return returnJSON(null, 200, { 
          success: true, 
          user: { userId: row.userId, email: row.email, name: row.name, role: row.role },
          token 
        });
      }
    }
  }
  
  return returnJSON(null, 401, { error: 'Invalid credentials' });
}

function handleLogout(body) {
  return returnJSON(null, 200, { success: true });
}

// ============== PET HANDLERS ==============
function handleGetPets(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const sheet = getSheet('Pets');
  const data = sheet.getDataRange().getValues();
  const headers_arr = data[0];
  const pets = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
    if (user.role === 'admin' || row.userId === user.userId) {
      pets.push(row);
    }
  }
  
  return returnJSON(null, 200, { pets });
}

function handleCreatePet(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { name, type, breed, birthDate, photoUrl } = body;
  if (!name) return returnJSON(null, 400, { error: 'Missing required fields' });
  
  const sheet = getSheet('Pets');
  const petId = generateId();
  
  sheet.appendRow([petId, user.userId, name, type || '', breed || '', birthDate || '', photoUrl || '', getTimestamp()]);
  
  return returnJSON(null, 200, { success: true, pet: { petId, userId: user.userId, name, type, breed, birthDate, photoUrl } });
}

function handleUpdatePet(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { petId, name, type, breed, birthDate, photoUrl } = body;
  
  const sheet = getSheet('Pets');
  const data = sheet.getDataRange().getValues();
  const headers_arr = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
    if (row.petId === petId) {
      if (user.role !== 'admin' && row.userId !== user.userId) {
        return returnJSON(null, 403, { error: 'Forbidden' });
      }
      
      const sheetRow = i + 1;
      if (name !== undefined) sheet.getRange(sheetRow, headers_arr.indexOf('name') + 1).setValue(name);
      if (type !== undefined) sheet.getRange(sheetRow, headers_arr.indexOf('type') + 1).setValue(type);
      if (breed !== undefined) sheet.getRange(sheetRow, headers_arr.indexOf('breed') + 1).setValue(breed);
      if (birthDate !== undefined) sheet.getRange(sheetRow, headers_arr.indexOf('birthDate') + 1).setValue(birthDate);
      if (photoUrl !== undefined) sheet.getRange(sheetRow, headers_arr.indexOf('photoUrl') + 1).setValue(photoUrl);
      
      return returnJSON(null, 200, { success: true });
    }
  }
  
  return returnJSON(null, 404, { error: 'Pet not found' });
}

function handleDeletePet(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { petId } = body;
  
  const sheet = getSheet('Pets');
  const data = sheet.getDataRange().getValues();
  const headers_arr = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
    if (row.petId === petId) {
      if (user.role !== 'admin' && row.userId !== user.userId) {
        return returnJSON(null, 403, { error: 'Forbidden' });
      }
      sheet.deleteRow(i + 1);
      return returnJSON(null, 200, { success: true });
    }
  }
  
  return returnJSON(null, 404, { error: 'Pet not found' });
}

// ============== EVENT HANDLERS ==============
function handleGetEvents(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { petId, month, year } = body;
  
  const sheet = getSheet('Events');
  const data = sheet.getDataRange().getValues();
  const headers_arr = data[0];
  const events = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
    
    // Check pet access
    const petSheet = getSheet('Pets');
    const petData = petSheet.getDataRange().getValues();
    const petHeaders = petData[0];
    let petUserId = null;
    for (let j = 1; j < petData.length; j++) {
      const pr = {};
      petHeaders.forEach((h, idx) => pr[h] = petData[j][idx]);
      if (pr.petId === row.petId) {
        petUserId = pr.userId;
        break;
      }
    }
    
    if (petUserId && (user.role === 'admin' || petUserId === user.userId)) {
      if (petId && row.petId !== petId) continue;
      if (month && year) {
        const eventDate = new Date(row.datetime);
        if (eventDate.getMonth() + 1 !== month || eventDate.getFullYear() !== year) continue;
      }
      events.push(row);
    }
  }
  
  return returnJSON(null, 200, { events });
}

function handleCreateEvent(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { petId, title, type, datetime, notes } = body;
  if (!petId || !title || !datetime) {
    return returnJSON(null, 400, { error: 'Missing required fields' });
  }
  
  const sheet = getSheet('Events');
  const eventId = generateId();
  
  sheet.appendRow([eventId, petId, title, type || 'other', datetime, notes || '', getTimestamp()]);
  
  return returnJSON(null, 200, { success: true, event: { eventId, petId, title, type, datetime, notes } });
}

function handleUpdateEvent(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { eventId, title, type, datetime, notes } = body;
  
  const sheet = getSheet('Events');
  const data = sheet.getDataRange().getValues();
  const headers_arr = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
    if (row.eventId === eventId) {
      const sheetRow = i + 1;
      if (title !== undefined) sheet.getRange(sheetRow, headers_arr.indexOf('title') + 1).setValue(title);
      if (type !== undefined) sheet.getRange(sheetRow, headers_arr.indexOf('type') + 1).setValue(type);
      if (datetime !== undefined) sheet.getRange(sheetRow, headers_arr.indexOf('datetime') + 1).setValue(datetime);
      if (notes !== undefined) sheet.getRange(sheetRow, headers_arr.indexOf('notes') + 1).setValue(notes);
      return returnJSON(null, 200, { success: true });
    }
  }
  
  return returnJSON(null, 404, { error: 'Event not found' });
}

function handleDeleteEvent(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { eventId } = body;
  
  const sheet = getSheet('Events');
  const data = sheet.getDataRange().getValues();
  const headers_arr = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
    if (row.eventId === eventId) {
      sheet.deleteRow(i + 1);
      return returnJSON(null, 200, { success: true });
    }
  }
  
  return returnJSON(null, 404, { error: 'Event not found' });
}

// ============== FOOD LOG HANDLERS ==============
function handleGetFoodLogs(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { petId } = body;
  
  const sheet = getSheet('FoodLogs');
  const data = sheet.getDataRange().getValues();
  const headers_arr = data[0];
  const logs = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
    
    if (petId && row.petId !== petId) continue;
    logs.push(row);
  }
  
  return returnJSON(null, 200, { logs });
}

function handleCreateFoodLog(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { petId, datetime, foodName, calories, portion, notes } = body;
  if (!petId || !datetime || !foodName) {
    return returnJSON(null, 400, { error: 'Missing required fields' });
  }
  
  const sheet = getSheet('FoodLogs');
  const logId = generateId();
  
  sheet.appendRow([logId, petId, datetime, foodName, calories || 0, portion || 0, notes || '', getTimestamp()]);
  
  return returnJSON(null, 200, { success: true, log: { logId, petId, datetime, foodName, calories, portion, notes } });
}

// ============== POOP LOG HANDLERS ==============
function handleGetPoopLogs(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { petId } = body;
  
  const sheet = getSheet('PoopLogs');
  const data = sheet.getDataRange().getValues();
  const headers_arr = data[0];
  const logs = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
    
    if (petId && row.petId !== petId) continue;
    logs.push(row);
  }
  
  return returnJSON(null, 200, { logs });
}

function handleCreatePoopLog(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { petId, datetime, texture, score, notes } = body;
  if (!petId || !datetime || !texture) {
    return returnJSON(null, 400, { error: 'Missing required fields' });
  }
  
  const sheet = getSheet('PoopLogs');
  const logId = generateId();
  
  sheet.appendRow([logId, petId, datetime, texture, score || 0, notes || '', getTimestamp()]);
  
  return returnJSON(null, 200, { success: true, log: { logId, petId, datetime, texture, score, notes } });
}

// ============== HEALTH LOG HANDLERS ==============
function handleGetHealthLogs(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { petId } = body;
  
  const sheet = getSheet('HealthLogs');
  const data = sheet.getDataRange().getValues();
  const headers_arr = data[0];
  const logs = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
    
    if (petId && row.petId !== petId) continue;
    logs.push(row);
  }
  
  return returnJSON(null, 200, { logs });
}

function handleCreateHealthLog(body, headers) {
  const user = validateUserAuth(headers);
  if (!user) return returnJSON(null, 401, { error: 'Unauthorized' });
  
  const { petId, datetime, weight, symptoms, notes } = body;
  if (!petId || !datetime) {
    return returnJSON(null, 400, { error: 'Missing required fields' });
  }
  
  const sheet = getSheet('HealthLogs');
  const logId = generateId();
  
  sheet.appendRow([logId, petId, datetime, weight || 0, symptoms || '', notes || '', getTimestamp()]);
  
  return returnJSON(null, 200, { success: true, log: { logId, petId, datetime, weight, symptoms, notes } });
}

// ============== ADMIN HANDLERS ==============
function handleAdminGetUsers(body, headers) {
  const user = validateUserAuth(headers);
  if (!user || user.role !== 'admin') {
    return returnJSON(null, 403, { error: 'Admin only' });
  }
  
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const headers_arr = data[0];
  const users = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
    users.push(row);
  }
  
  return returnJSON(null, 200, { users });
}

function handleAdminGetAllData(body, headers) {
  const user = validateUserAuth(headers);
  if (!user || user.role !== 'admin') {
    return returnJSON(null, 403, { error: 'Admin only' });
  }
  
  const sheetNames = ['Users', 'Pets', 'Events', 'FoodLogs', 'PoopLogs', 'HealthLogs'];
  const allData = {};
  
  sheetNames.forEach(name => {
    const sheet = getSheet(name);
    const data = sheet.getDataRange().getValues();
    const headers_arr = data[0];
    const rows = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = {};
      headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
      rows.push(row);
    }
    
    allData[name] = rows;
  });
  
  return returnJSON(null, 200, allData);
}

// Helper function to validate user from headers
function validateUserAuth(headers) {
  const authHeader = headers['Authorization'] || headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  return validateUser(token);
}

// ============== SETUP FUNCTION ==============
function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // Create sheets if they don't exist
  const sheetNames = ['Users', 'Pets', 'Events', 'FoodLogs', 'PoopLogs', 'HealthLogs'];
  
  sheetNames.forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
  });
  
  // Setup Users sheet
  let usersSheet = ss.getSheetByName('Users');
  if (usersSheet.getLastRow() === 0) {
    usersSheet.getRange(1, 1, 1, 7).setValues([['userId', 'email', 'passwordHash', 'name', 'role', 'token', 'createdAt']]);
  }
  
  // Setup Pets sheet
  let petsSheet = ss.getSheetByName('Pets');
  if (petsSheet.getLastRow() === 0) {
    petsSheet.getRange(1, 1, 1, 8).setValues([['petId', 'userId', 'name', 'type', 'breed', 'birthDate', 'photoUrl', 'createdAt']]);
  }
  
  // Setup Events sheet
  let eventsSheet = ss.getSheetByName('Events');
  if (eventsSheet.getLastRow() === 0) {
    eventsSheet.getRange(1, 1, 1, 7).setValues([['eventId', 'petId', 'title', 'type', 'datetime', 'notes', 'createdAt']]);
  }
  
  // Setup FoodLogs sheet
  let foodSheet = ss.getSheetByName('FoodLogs');
  if (foodSheet.getLastRow() === 0) {
    foodSheet.getRange(1, 1, 1, 8).setValues([['logId', 'petId', 'datetime', 'foodName', 'calories', 'portion', 'notes', 'createdAt']]);
  }
  
  // Setup PoopLogs sheet
  let poopSheet = ss.getSheetByName('PoopLogs');
  if (poopSheet.getLastRow() === 0) {
    poopSheet.getRange(1, 1, 1, 7).setValues([['logId', 'petId', 'datetime', 'texture', 'score', 'notes', 'createdAt']]);
  }
  
  // Setup HealthLogs sheet
  let healthSheet = ss.getSheetByName('HealthLogs');
  if (healthSheet.getLastRow() === 0) {
    healthSheet.getRange(1, 1, 1, 7).setValues([['logId', 'petId', 'datetime', 'weight', 'symptoms', 'notes', 'createdAt']]);
  }
  
  // Create admin user
  const adminEmail = ADMIN_EMAIL;
  const adminPassword = 'admin123'; // 臨時密碼，稍後讓 admin 更改
  
  const usersData = usersSheet.getDataRange().getValues();
  let adminExists = false;
  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][1] === adminEmail) {
      adminExists = true;
      break;
    }
  }
  
  if (!adminExists) {
    const userId = generateId();
    const passwordHash = hashPassword(adminPassword);
    usersSheet.appendRow([userId, adminEmail, passwordHash, 'Admin', 'admin', '', getTimestamp()]);
  }
}
