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
const SPREADSHEET_ID = '1YZtyCxhjJeNteKBGGjwDd9xO4PryVvbLYHE3yN3U1CU';
const ADMIN_EMAIL = 'alan.yoshiki@gmail.com';

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

function returnJSON(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function validateUser(token) {
  if (!token) return null;
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

// ============== API ROUTES ==============
function doPost(e) {
  const body = parseJSON(e.postData.contents);
  
  if (!body || !body.action) {
    return returnJSON({ error: 'Missing action' });
  }
  
  const action = body.action;
  const token = body.token || null;
  
  try {
    switch (action) {
      case 'register':
        return handleRegister(body);
      case 'login':
        return handleLogin(body);
      case 'logout':
        return returnJSON({ success: true });
      
      // Pets
      case 'getPets':
        return handleGetPets(body, token);
      case 'createPet':
        return handleCreatePet(body, token);
      case 'deletePet':
        return handleDeletePet(body, token);
      
      // Events
      case 'getEvents':
        return handleGetEvents(body, token);
      case 'createEvent':
        return handleCreateEvent(body, token);
      case 'deleteEvent':
        return handleDeleteEvent(body, token);
      
      // Food Logs
      case 'getFoodLogs':
        return handleGetFoodLogs(body, token);
      case 'createFoodLog':
        return handleCreateFoodLog(body, token);
      
      // Poop Logs
      case 'getPoopLogs':
        return handleGetPoopLogs(body, token);
      case 'createPoopLog':
        return handleCreatePoopLog(body, token);
      
      // Health Logs
      case 'getHealthLogs':
        return handleGetHealthLogs(body, token);
      case 'createHealthLog':
        return handleCreateHealthLog(body, token);
      
      // Admin
      case 'adminGetUsers':
        return handleAdminGetUsers(token);
      case 'adminGetAllData':
        return handleAdminGetAllData(token);
      case 'adminDeleteUser':
        return handleAdminDeleteUser(body, token);
      
      default:
        return returnJSON({ error: 'Unknown action: ' + action });
    }
  } catch (error) {
    return returnJSON({ error: error.toString() });
  }
}

// ============== AUTH HANDLERS ==============
function handleRegister(body) {
  const { email, password, name } = body;
  
  if (!email || !password || !name) {
    return returnJSON({ error: 'Missing required fields' });
  }
  
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Check if email exists
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => row[h] = data[i][idx]);
    if (row.email === email) {
      return returnJSON({ error: 'Email already registered' });
    }
  }
  
  const userId = generateId();
  const passwordHash = hashPassword(password);
  const newToken = generateId();
  const role = email === ADMIN_EMAIL ? 'admin' : 'user';
  
  sheet.appendRow([userId, email, passwordHash, name, role, newToken, getTimestamp()]);
  
  return returnJSON({ 
    success: true, 
    user: { userId, email, name, role },
    token: newToken
  });
}

function handleLogin(body) {
  const { email, password } = body;
  
  if (!email || !password) {
    return returnJSON({ error: 'Missing required fields' });
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
        const newToken = generateId();
        const sheetRow = i + 1;
        sheet.getRange(sheetRow, headers.indexOf('token') + 1).setValue(newToken);
        
        return returnJSON({ 
          success: true, 
          user: { userId: row.userId, email: row.email, name: row.name, role: row.role },
          token: newToken
        });
      }
    }
  }
  
  return returnJSON({ error: 'Invalid credentials' });
}

// ============== PET HANDLERS ==============
function handleGetPets(body, token) {
  const user = validateUser(token);
  if (!user) return returnJSON({ error: 'Unauthorized' });
  
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
  
  return returnJSON({ pets });
}

function handleCreatePet(body, token) {
  const user = validateUser(token);
  if (!user) return returnJSON({ error: 'Unauthorized' });
  
  const { name, type, breed, birthDate, photoUrl } = body;
  if (!name) return returnJSON({ error: 'Missing required fields' });
  
  const sheet = getSheet('Pets');
  const petId = generateId();
  
  sheet.appendRow([petId, user.userId, name, type || '', breed || '', birthDate || '', photoUrl || '', getTimestamp()]);
  
  return returnJSON({ success: true, pet: { petId, userId: user.userId, name, type, breed, birthDate, photoUrl } });
}

function handleDeletePet(body, token) {
  const user = validateUser(token);
  if (!user) return returnJSON({ error: 'Unauthorized' });
  
  const { petId } = body;
  
  const sheet = getSheet('Pets');
  const data = sheet.getDataRange().getValues();
  const headers_arr = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
    if (row.petId === petId) {
      if (user.role !== 'admin' && row.userId !== user.userId) {
        return returnJSON({ error: 'Forbidden' });
      }
      sheet.deleteRow(i + 1);
      return returnJSON({ success: true });
    }
  }
  
  return returnJSON({ error: 'Pet not found' });
}

// ============== EVENT HANDLERS ==============
function handleGetEvents(body, token) {
  const user = validateUser(token);
  if (!user) return returnJSON({ error: 'Unauthorized' });
  
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
  
  return returnJSON({ events });
}

function handleCreateEvent(body, token) {
  const user = validateUser(token);
  if (!user) return returnJSON({ error: 'Unauthorized' });
  
  const { petId, title, type, datetime, notes } = body;
  if (!petId || !title || !datetime) {
    return returnJSON({ error: 'Missing required fields' });
  }
  
  const sheet = getSheet('Events');
  const eventId = generateId();
  
  sheet.appendRow([eventId, petId, title, type || 'other', datetime, notes || '', getTimestamp()]);
  
  return returnJSON({ success: true, event: { eventId, petId, title, type, datetime, notes } });
}

function handleDeleteEvent(body, token) {
  const user = validateUser(token);
  if (!user) return returnJSON({ error: 'Unauthorized' });
  
  const { eventId } = body;
  
  const sheet = getSheet('Events');
  const data = sheet.getDataRange().getValues();
  const headers_arr = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers_arr.forEach((h, idx) => row[h] = data[i][idx]);
    if (row.eventId === eventId) {
      sheet.deleteRow(i + 1);
      return returnJSON({ success: true });
    }
  }
  
  return returnJSON({ error: 'Event not found' });
}

// ============== FOOD LOG HANDLERS ==============
function handleGetFoodLogs(body, token) {
  const user = validateUser(token);
  if (!user) return returnJSON({ error: 'Unauthorized' });
  
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
  
  return returnJSON({ logs });
}

function handleCreateFoodLog(body, token) {
  const user = validateUser(token);
  if (!user) return returnJSON({ error: 'Unauthorized' });
  
  const { petId, datetime, foodName, calories, portion, notes } = body;
  if (!petId || !datetime || !foodName) {
    return returnJSON({ error: 'Missing required fields' });
  }
  
  const sheet = getSheet('FoodLogs');
  const logId = generateId();
  
  sheet.appendRow([logId, petId, datetime, foodName, calories || 0, portion || 0, notes || '', getTimestamp()]);
  
  return returnJSON({ success: true, log: { logId, petId, datetime, foodName, calories, portion, notes } });
}

// ============== POOP LOG HANDLERS ==============
function handleGetPoopLogs(body, token) {
  const user = validateUser(token);
  if (!user) return returnJSON({ error: 'Unauthorized' });
  
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
  
  return returnJSON({ logs });
}

function handleCreatePoopLog(body, token) {
  const user = validateUser(token);
  if (!user) return returnJSON({ error: 'Unauthorized' });
  
  const { petId, datetime, texture, score, notes } = body;
  if (!petId || !datetime || !texture) {
    return returnJSON({ error: 'Missing required fields' });
  }
  
  const sheet = getSheet('PoopLogs');
  const logId = generateId();
  
  sheet.appendRow([logId, petId, datetime, texture, score || 0, notes || '', getTimestamp()]);
  
  return returnJSON({ success: true, log: { logId, petId, datetime, texture, score, notes } });
}

// ============== HEALTH LOG HANDLERS ==============
function handleGetHealthLogs(body, token) {
  const user = validateUser(token);
  if (!user) return returnJSON({ error: 'Unauthorized' });
  
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
  
  return returnJSON({ logs });
}

function handleCreateHealthLog(body, token) {
  const user = validateUser(token);
  if (!user) return returnJSON({ error: 'Unauthorized' });
  
  const { petId, datetime, weight, symptoms, notes } = body;
  if (!petId || !datetime) {
    return returnJSON({ error: 'Missing required fields' });
  }
  
  const sheet = getSheet('HealthLogs');
  const logId = generateId();
  
  sheet.appendRow([logId, petId, datetime, weight || 0, symptoms || '', notes || '', getTimestamp()]);
  
  return returnJSON({ success: true, log: { logId, petId, datetime, weight, symptoms, notes } });
}

// ============== ADMIN HANDLERS ==============
function handleAdminGetUsers(token) {
  const user = validateUser(token);
  if (!user || user.role !== 'admin') {
    return returnJSON({ error: 'Admin only' });
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
  
  return returnJSON({ users });
}

function handleAdminGetAllData(token) {
  const user = validateUser(token);
  if (!user || user.role !== 'admin') {
    return returnJSON({ error: 'Admin only' });
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
  
  return returnJSON(allData);
}

// ============== ADMIN HANDLERS ==============
function handleAdminDeleteUser(body, token) {
  const user = validateUser(token);
  if (!user || user.role !== 'admin') {
    return returnJSON({ error: 'Admin only' });
  }
  
  const { userId } = body;
  if (!userId) {
    return returnJSON({ error: 'Missing userId' });
  }
  
  // Cannot delete yourself
  if (userId === user.userId) {
    return returnJSON({ error: 'Cannot delete yourself' });
  }
  
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => row[h] = data[i][idx]);
    if (row.userId === userId) {
      sheet.deleteRow(i + 1);
      
      // Also delete all pets belonging to this user
      const petsSheet = getSheet('Pets');
      const petsData = petsSheet.getDataRange().getValues();
      const petsHeaders = petsData[0];
      const petsToDelete = [];
      
      for (let j = 1; j < petsData.length; j++) {
        const petRow = {};
        petsHeaders.forEach((h, idx) => petRow[h] = petsData[j][idx]);
        if (petRow.userId === userId) {
          petsToDelete.push(j + 1);
        }
      }
      
      // Delete in reverse order to avoid index shift
      petsToDelete.reverse().forEach(rowNum => {
        petsSheet.deleteRow(rowNum);
      });
      
      return returnJSON({ success: true });
    }
  }
  
  return returnJSON({ error: 'User not found' });
}


function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  const sheetNames = ['Users', 'Pets', 'Events', 'FoodLogs', 'PoopLogs', 'HealthLogs'];
  
  sheetNames.forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
  });
  
  let usersSheet = ss.getSheetByName('Users');
  if (usersSheet.getLastRow() === 0) {
    usersSheet.getRange(1, 1, 1, 7).setValues([['userId', 'email', 'passwordHash', 'name', 'role', 'token', 'createdAt']]);
  }
  
  let petsSheet = ss.getSheetByName('Pets');
  if (petsSheet.getLastRow() === 0) {
    petsSheet.getRange(1, 1, 1, 8).setValues([['petId', 'userId', 'name', 'type', 'breed', 'birthDate', 'photoUrl', 'createdAt']]);
  }
  
  let eventsSheet = ss.getSheetByName('Events');
  if (eventsSheet.getLastRow() === 0) {
    eventsSheet.getRange(1, 1, 1, 7).setValues([['eventId', 'petId', 'title', 'type', 'datetime', 'notes', 'createdAt']]);
  }
  
  let foodSheet = ss.getSheetByName('FoodLogs');
  if (foodSheet.getLastRow() === 0) {
    foodSheet.getRange(1, 1, 1, 8).setValues([['logId', 'petId', 'datetime', 'foodName', 'calories', 'portion', 'notes', 'createdAt']]);
  }
  
  let poopSheet = ss.getSheetByName('PoopLogs');
  if (poopSheet.getLastRow() === 0) {
    poopSheet.getRange(1, 1, 1, 7).setValues([['logId', 'petId', 'datetime', 'texture', 'score', 'notes', 'createdAt']]);
  }
  
  let healthSheet = ss.getSheetByName('HealthLogs');
  if (healthSheet.getLastRow() === 0) {
    healthSheet.getRange(1, 1, 1, 7).setValues([['logId', 'petId', 'datetime', 'weight', 'symptoms', 'notes', 'createdAt']]);
  }
}
