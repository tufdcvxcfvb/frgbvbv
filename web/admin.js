import { auth, db } from '../src/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';

// State Management
let currentAdmin = null;
let currentTab = 'dashboard';
let usersList = [];
let coursesList = [];
let subjectsList = [];
let lecturesList = [];
let logsList = [];
let blockedList = [];

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginMessage = document.getElementById('loginMessage');
const loginBtn = document.getElementById('loginBtn');

const adminName = document.getElementById('adminName');
const adminAvatar = document.getElementById('adminAvatar');
const themeToggle = document.getElementById('themeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const pageTitle = document.getElementById('pageTitle');

// ================= THEME MANAGEMENT =================
const savedTheme = localStorage.getItem('aura_admin_theme') || 'dark';
document.documentElement.className = savedTheme;

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.className = newTheme;
  localStorage.setItem('aura_admin_theme', newTheme);
});

// ================= AUTHENTICATION CHECK =================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Check if user has administrative role
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role === 'admin') {
          // Success: Authorize admin access
          currentAdmin = userData;
          loginScreen.classList.add('hidden');
          adminDashboard.classList.remove('hidden');
          
          adminName.textContent = userData.name || 'Admin User';
          if (userData.photoURL) {
            adminAvatar.src = userData.photoURL;
          }
          
          showNotification('Authorized', 'Welcome to Secure Admin Console.', 'success');
          
          // Initialize App Listeners
          initRealtimeListeners();
        } else {
          // Failure: Logged in but not an admin
          await signOut(auth);
          showLoginError('Access Denied. Administrator account required.');
        }
      } else {
        // Doc doesn't exist
        await signOut(auth);
        showLoginError('Access Denied. Profile record not found.');
      }
    } catch (err) {
      console.error('Error verifying admin credentials:', err);
      await signOut(auth);
      showLoginError('System Authentication Error. Try again.');
    }
  } else {
    // Show Login
    loginScreen.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
  }
});

// ================= LOGIN SUBMISSION =================
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  loginBtn.disabled = true;
  loginBtn.textContent = 'Verifying security signature...';
  hideLoginError();

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error('Login error:', err);
    let errorMsg = 'Invalid username or passphrase.';
    if (err.code === 'auth/user-not-found') {
      errorMsg = 'Credential records do not exist.';
    } else if (err.code === 'auth/wrong-password') {
      errorMsg = 'Incorrect passphrase signature.';
    }
    showLoginError(errorMsg);
    loginBtn.disabled = false;
    loginBtn.textContent = 'Verify Credentials →';
  }
});

// ================= LOGOUT =================
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
    currentAdmin = null;
    showNotification('Logged Out', 'Session terminated successfully.', 'info');
  } catch (err) {
    console.error('Logout error:', err);
  }
});

function showLoginError(msg) {
  loginMessage.textContent = msg;
  loginMessage.className = 'text-xs font-bold text-center p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 block';
}

function hideLoginError() {
  loginMessage.classList.add('hidden');
}

// ================= TAB SWITCHING =================
const navItems = document.querySelectorAll('.sidebar-item');
const viewSections = document.querySelectorAll('.view-section');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const tabName = item.getAttribute('data-tab');
    if (!tabName) return;

    // Remove active state
    navItems.forEach(nav => nav.classList.remove('active'));
    viewSections.forEach(sec => sec.classList.add('hidden'));

    // Set active state
    item.classList.add('active');
    const targetSection = document.getElementById(`view-${tabName}`);
    if (targetSection) targetSection.classList.remove('hidden');

    currentTab = tabName;
    pageTitle.textContent = getPageTitle(tabName);
  });
});

function getPageTitle(tab) {
  switch (tab) {
    case 'dashboard': return 'System Overview';
    case 'users': return 'User Database Directory';
    case 'courses': return 'Curriculum Catalog Management';
    case 'subjects': return 'Subject Syllabus Units';
    case 'lectures': return 'Video Lecture Directories';
    case 'logs': return 'Security Access Telemetry';
    case 'devtools': return 'Console Inspection Monitor';
    case 'blocked': return 'Device Blocklist Manager';
    case 'analytics': return 'Telemetry Charts & Demographics';
    case 'settings': return 'Platform Security Controls';
    default: return 'System Admin';
  }
}

// ================= REAL-TIME FIRESTORE LISTENERS =================
let unsubscribeList = [];

function initRealtimeListeners() {
  // Clear any existing subscriptions
  unsubscribeList.forEach(unsub => unsub());
  unsubscribeList = [];

  // 1. Users collection listener
  const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
    usersList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    updateDashboardStats();
    renderUsers();
    renderDevToolsMonitor();
    renderAnalytics();
  }, err => console.error('Users listener error:', err));
  unsubscribeList.push(usersUnsub);

  // 2. Courses listener
  const coursesUnsub = onSnapshot(collection(db, 'courses'), (snapshot) => {
    coursesList = snapshot.docs.map(doc => ({ courseId: doc.id, ...doc.data() }));
    updateDashboardStats();
    renderCourses();
    updateCourseDropdowns();
  }, err => console.error('Courses listener error:', err));
  unsubscribeList.push(coursesUnsub);

  // 3. Subjects listener
  const subjectsUnsub = onSnapshot(collection(db, 'subjects'), (snapshot) => {
    subjectsList = snapshot.docs.map(doc => ({ subjectId: doc.id, ...doc.data() }));
    updateDashboardStats();
    renderSubjects();
    updateSubjectDropdowns();
  }, err => console.error('Subjects listener error:', err));
  unsubscribeList.push(subjectsUnsub);

  // 4. Lectures listener
  const lecturesUnsub = onSnapshot(collection(db, 'lectures'), (snapshot) => {
    lecturesList = snapshot.docs.map(doc => ({ lectureId: doc.id, ...doc.data() }));
    updateDashboardStats();
    renderLectures();
  }, err => console.error('Lectures listener error:', err));
  unsubscribeList.push(lecturesUnsub);

  // 5. Device Logs listener
  const logsUnsub = onSnapshot(query(collection(db, 'deviceLogs'), orderBy('timestamp', 'desc')), (snapshot) => {
    logsList = snapshot.docs.map(doc => ({ logId: doc.id, ...doc.data() }));
    updateDashboardStats();
    renderDeviceLogs();
    renderRecentIncidents();
  }, err => console.error('Logs listener error:', err));
  unsubscribeList.push(logsUnsub);

  // 6. Blocked Devices listener
  const blockedUnsub = onSnapshot(collection(db, 'blockedDevices'), (snapshot) => {
    blockedList = snapshot.docs.map(doc => ({ blockedId: doc.id, ...doc.data() }));
    updateDashboardStats();
    renderBlockedDevices();
  }, err => console.error('Blocked devices listener error:', err));
  unsubscribeList.push(blockedUnsub);
}

// ================= STATS UPDATE =================
function updateDashboardStats() {
  document.getElementById('stat-total-users').textContent = usersList.length;
  
  const activeCount = usersList.filter(u => u.status === 'active' && !u.blocked).length;
  document.getElementById('stat-active-users').textContent = activeCount;
  
  document.getElementById('stat-total-courses').textContent = coursesList.length;
  document.getElementById('stat-total-subjects').textContent = subjectsList.length;
  document.getElementById('stat-total-lectures').textContent = lecturesList.length;
  
  // Calculate online (seen in last 3 minutes / 180s)
  const now = Date.now();
  const onlineCount = usersList.filter(u => {
    if (!u.lastSeen) return false;
    const diff = (now - new Date(u.lastSeen).getTime()) / 1000;
    return diff < 180;
  }).length;
  document.getElementById('stat-online-users').textContent = onlineCount;

  // Total devtools opens count
  const devtoolsTotal = usersList.reduce((sum, u) => sum + (u.devToolOpenCount || 0), 0);
  document.getElementById('stat-devtools-count').textContent = devtoolsTotal;

  const blockedCount = usersList.filter(u => u.blocked).length + blockedList.length;
  document.getElementById('stat-blocked-count').textContent = blockedCount;
}

// ================= LOG INCIDENTS (DASHBOARD) =================
function renderRecentIncidents() {
  const container = document.getElementById('dashboard-incidents-list');
  container.innerHTML = '';

  const recents = logsList.slice(0, 5);
  if (recents.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-white/30 text-xs">No recent device incidents reported.</td></tr>`;
    return;
  }

  recents.forEach(log => {
    const user = usersList.find(u => u.uid === log.uid) || { name: 'Unknown User', email: '' };
    const durationText = log.duration ? `${log.duration}s` : 'Active';
    const row = document.createElement('tr');
    row.className = 'border-b border-white/5 hover:bg-white/2 text-white/80';
    row.innerHTML = `
      <td class="py-3">
        <p class="font-bold text-white">${escapeHTML(user.name)}</p>
        <span class="text-[9px] text-white/40 block font-mono">${escapeHTML(user.email)}</span>
      </td>
      <td class="py-3 font-mono text-[10px] text-indigo-400">${escapeHTML(log.deviceId || 'Unknown')}</td>
      <td class="py-3 text-[10px]">${escapeHTML(log.os)} / ${escapeHTML(log.browser)}</td>
      <td class="py-3 font-mono text-[10px] text-white/40">${formatTime(log.openedAt)}</td>
      <td class="py-3"><span class="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/10 rounded font-mono text-[9px]">${durationText}</span></td>
    `;
    container.appendChild(row);
  });
}

// ================= VIEW: USERS MANAGEMENT =================
const userSearchInput = document.getElementById('userSearch');
userSearchInput.addEventListener('input', renderUsers);

function renderUsers() {
  const container = document.getElementById('users-table-body');
  container.innerHTML = '';

  const queryStr = userSearchInput.value.toLowerCase().trim();
  const filtered = usersList.filter(u => 
    u.name?.toLowerCase().includes(queryStr) || 
    u.email?.toLowerCase().includes(queryStr) ||
    u.uid?.toLowerCase().includes(queryStr)
  );

  if (filtered.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-white/30">No users match your criteria.</td></tr>`;
    return;
  }

  filtered.forEach(u => {
    const row = document.createElement('tr');
    row.className = 'border-b border-white/5 hover:bg-white/2 text-slate-300';
    
    const roleBadge = u.role === 'admin' 
      ? '<span class="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-[9px] font-bold">ADMIN</span>' 
      : '<span class="px-2 py-0.5 bg-white/5 text-slate-400 border border-white/10 rounded-lg text-[9px] font-medium">STUDENT</span>';
    
    const statusText = u.blocked 
      ? '<span class="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[9px] font-bold">BANNED</span>' 
      : u.status === 'suspended' 
        ? '<span class="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[9px] font-bold">SUSPENDED</span>'
        : '<span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[9px] font-bold">ACTIVE</span>';

    row.innerHTML = `
      <td class="p-4 flex items-center gap-3">
        <img src="${u.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.uid}`}" class="w-9 h-9 rounded-full bg-slate-950 border border-white/10" />
        <div>
          <p class="font-bold text-white text-xs">${escapeHTML(u.name || 'Aura Student')}</p>
          <span class="text-[10px] text-white/40 font-mono block">${escapeHTML(u.email)}</span>
        </div>
      </td>
      <td class="p-4">${roleBadge}</td>
      <td class="p-4">${statusText}</td>
      <td class="p-4">
        <div class="flex flex-col gap-0.5 text-[10px] font-mono text-white/50">
          <span>Alerts: <span class="text-amber-400 font-bold">${u.devToolOpenCount || 0}</span></span>
          <span>Time: <span class="text-amber-400 font-bold">${u.devToolTotalTime || 0}s</span></span>
        </div>
      </td>
      <td class="p-4 font-mono text-[10px] text-white/40">${formatTime(u.lastSeen || u.createdAt)}</td>
      <td class="p-4 text-right">
        <div class="flex justify-end gap-1.5">
          <button onclick="toggleUserRole('${u.uid}', '${u.role}')" class="px-2 py-1 bg-white/5 hover:bg-indigo-600 border border-white/10 text-white/70 hover:text-white rounded-lg text-[10px] font-bold transition">
            Role
          </button>
          <button onclick="toggleUserStatus('${u.uid}', '${u.status}')" class="px-2 py-1 bg-white/5 hover:bg-amber-600 border border-white/10 text-white/70 hover:text-white rounded-lg text-[10px] font-bold transition">
            Status
          </button>
          <button onclick="toggleUserBlock('${u.uid}', ${u.blocked || false})" class="px-2 py-1 bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white rounded-lg text-[10px] font-bold transition">
            ${u.blocked ? 'Unban' : 'Ban'}
          </button>
        </div>
      </td>
    `;
    container.appendChild(row);
  });
}

window.toggleUserRole = async (uid, currentRole) => {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  try {
    await updateDoc(doc(db, 'users', uid), { role: newRole });
    showNotification('Role updated', `User designated as ${newRole.toUpperCase()}.`, 'success');
  } catch (err) {
    console.error(err);
  }
};

window.toggleUserStatus = async (uid, currentStatus) => {
  const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
  try {
    await updateDoc(doc(db, 'users', uid), { status: newStatus });
    showNotification('Status Updated', `Enrollment designated as ${newStatus.toUpperCase()}.`, 'success');
  } catch (err) {
    console.error(err);
  }
};

window.toggleUserBlock = async (uid, isBlocked) => {
  try {
    await updateDoc(doc(db, 'users', uid), { blocked: !isBlocked });
    showNotification(isBlocked ? 'User Unbanned' : 'User Banned', isBlocked ? 'User reinstated.' : 'User license revoked.', 'info');
  } catch (err) {
    console.error(err);
  }
};

// ================= VIEW: COURSES CRUD =================
const addCourseBtn = document.getElementById('addCourseBtn');
const cancelCourseBtn = document.getElementById('cancelCourseBtn');
const courseFormContainer = document.getElementById('courseFormContainer');
const courseForm = document.getElementById('courseForm');
const courseFormTitle = document.getElementById('courseFormTitle');
const courseIdField = document.getElementById('courseIdField');
const courseTitleField = document.getElementById('courseTitleField');
const courseIdKeyField = document.getElementById('courseIdKeyField');
const courseThumbnailField = document.getElementById('courseThumbnailField');
const courseDescField = document.getElementById('courseDescField');

addCourseBtn.addEventListener('click', () => {
  courseFormTitle.textContent = 'Create Course';
  courseIdField.value = '';
  courseForm.reset();
  courseIdKeyField.disabled = false;
  courseFormContainer.classList.remove('hidden');
});

cancelCourseBtn.addEventListener('click', () => {
  courseFormContainer.classList.add('hidden');
});

courseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = courseTitleField.value.trim();
  const idKey = courseIdKeyField.value.trim().toLowerCase().replace(/\s+/g, '-');
  const thumbnail = courseThumbnailField.value.trim();
  const description = courseDescField.value.trim();
  const existingId = courseIdField.value;

  try {
    if (existingId) {
      // Edit mode
      await updateDoc(doc(db, 'courses', existingId), {
        title,
        thumbnail,
        description
      });
      showNotification('Success', 'Course details updated successfully.', 'success');
    } else {
      // Create mode
      await setDoc(doc(db, 'courses', idKey), {
        courseId: idKey,
        title,
        thumbnail,
        description,
        createdAt: new Date().toISOString()
      });
      showNotification('Success', 'Course syllabus initialized.', 'success');
    }
    courseFormContainer.classList.add('hidden');
  } catch (err) {
    console.error(err);
    showNotification('Error', 'Failed to save course block.', 'error');
  }
});

function renderCourses() {
  const grid = document.getElementById('admin-courses-grid');
  grid.innerHTML = '';

  if (coursesList.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-white/30 text-xs">No courses configured. Use "Add Course" above.</div>`;
    return;
  }

  coursesList.forEach(c => {
    const card = document.createElement('div');
    card.className = 'bg-white/5 border border-white/10 p-5 rounded-[24px] backdrop-blur-xl flex flex-col justify-between h-full';
    card.innerHTML = `
      <div>
        <div class="aspect-video relative overflow-hidden rounded-xl mb-3">
          <img src="${c.thumbnail}" class="w-full h-full object-cover" />
        </div>
        <span class="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-widest">${escapeHTML(c.courseId)}</span>
        <h4 class="text-xs font-bold text-white mt-1 mb-2">${escapeHTML(c.title)}</h4>
        <p class="text-[11px] text-white/50 leading-relaxed line-clamp-3">${escapeHTML(c.description)}</p>
      </div>
      <div class="flex gap-2 justify-end border-t border-white/5 pt-3 mt-4">
        <button onclick="editCourse('${c.courseId}')" class="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold transition">Edit</button>
        <button onclick="deleteCourse('${c.courseId}')" class="px-2.5 py-1 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-[10px] font-bold transition border border-red-500/10 hover:border-red-500">Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

window.editCourse = (id) => {
  const c = coursesList.find(item => item.courseId === id);
  if (!c) return;

  courseFormTitle.textContent = 'Edit Course';
  courseIdField.value = c.courseId;
  courseTitleField.value = c.title;
  courseIdKeyField.value = c.courseId;
  courseIdKeyField.disabled = true;
  courseThumbnailField.value = c.thumbnail;
  courseDescField.value = c.description;

  courseFormContainer.classList.remove('hidden');
};

window.deleteCourse = async (id) => {
  if (!confirm('Are you absolutely sure you want to delete this course syllabus? All child subjects and lectures will lose nesting references.')) return;
  try {
    await deleteDoc(doc(db, 'courses', id));
    showNotification('Syllabus Deleted', 'The requested course index has been erased.', 'info');
  } catch (err) {
    console.error(err);
  }
};

// ================= VIEW: SUBJECTS CRUD =================
const addSubjectBtn = document.getElementById('addSubjectBtn');
const cancelSubjectBtn = document.getElementById('cancelSubjectBtn');
const subjectFormContainer = document.getElementById('subjectFormContainer');
const subjectForm = document.getElementById('subjectForm');
const subjectFormTitle = document.getElementById('subjectFormTitle');
const subjectIdField = document.getElementById('subjectIdField');
const subjectTitleField = document.getElementById('subjectTitleField');
const subjectIdKeyField = document.getElementById('subjectIdKeyField');
const subjectCourseSelect = document.getElementById('subjectCourseSelect');
const subjectThumbnailField = document.getElementById('subjectThumbnailField');

addSubjectBtn.addEventListener('click', () => {
  subjectFormTitle.textContent = 'Create Subject Block';
  subjectIdField.value = '';
  subjectForm.reset();
  subjectIdKeyField.disabled = false;
  subjectFormContainer.classList.remove('hidden');
});

cancelSubjectBtn.addEventListener('click', () => {
  subjectFormContainer.classList.add('hidden');
});

subjectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = subjectTitleField.value.trim();
  const idKey = subjectIdKeyField.value.trim().toLowerCase().replace(/\s+/g, '-');
  const courseId = subjectCourseSelect.value;
  const thumbnail = subjectThumbnailField.value.trim();
  const existingId = subjectIdField.value;

  try {
    if (existingId) {
      // Edit
      await updateDoc(doc(db, 'subjects', existingId), {
        title,
        courseId,
        thumbnail
      });
      showNotification('Success', 'Subject block updated.', 'success');
    } else {
      // Create
      await setDoc(doc(db, 'subjects', idKey), {
        subjectId: idKey,
        courseId,
        title,
        thumbnail,
        createdAt: new Date().toISOString()
      });
      showNotification('Success', 'Subject syllabus block initialized.', 'success');
    }
    subjectFormContainer.classList.add('hidden');
  } catch (err) {
    console.error(err);
    showNotification('Error', 'Failed to save subject.', 'error');
  }
});

function updateCourseDropdowns() {
  subjectCourseSelect.innerHTML = '';
  coursesList.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.courseId;
    opt.textContent = `${c.title} (${c.courseId})`;
    subjectCourseSelect.appendChild(opt);
  });
}

function renderSubjects() {
  const container = document.getElementById('subjects-table-body');
  container.innerHTML = '';

  if (subjectsList.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-white/30">No subjects configured. Use "Add Subject Block" above.</td></tr>`;
    return;
  }

  subjectsList.forEach(s => {
    const row = document.createElement('tr');
    row.className = 'border-b border-white/5 hover:bg-white/2 text-slate-300';
    row.innerHTML = `
      <td class="p-4">
        <img src="${s.thumbnail}" class="w-12 h-8 rounded-lg object-cover border border-white/10" />
      </td>
      <td class="p-4">
        <p class="font-bold text-white text-xs">${escapeHTML(s.title)}</p>
        <span class="text-[9px] text-white/40 font-mono block">${escapeHTML(s.subjectId)}</span>
      </td>
      <td class="p-4 font-mono text-[10px] text-indigo-400">${escapeHTML(s.courseId)}</td>
      <td class="p-4 font-mono text-[10px] text-white/40">${formatTime(s.createdAt)}</td>
      <td class="p-4 text-right">
        <div class="flex justify-end gap-1.5">
          <button onclick="editSubject('${s.subjectId}')" class="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold transition">Edit</button>
          <button onclick="deleteSubject('${s.subjectId}')" class="px-2 py-1 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-[10px] font-bold transition border border-red-500/10 hover:border-red-500">Delete</button>
        </div>
      </td>
    `;
    container.appendChild(row);
  });
}

window.editSubject = (id) => {
  const s = subjectsList.find(item => item.subjectId === id);
  if (!s) return;

  subjectFormTitle.textContent = 'Edit Subject Block';
  subjectIdField.value = s.subjectId;
  subjectTitleField.value = s.title;
  subjectIdKeyField.value = s.subjectId;
  subjectIdKeyField.disabled = true;
  subjectCourseSelect.value = s.courseId;
  subjectThumbnailField.value = s.thumbnail;

  subjectFormContainer.classList.remove('hidden');
};

window.deleteSubject = async (id) => {
  if (!confirm('Are you absolutely sure you want to delete this syllabus subject?')) return;
  try {
    await deleteDoc(doc(db, 'subjects', id));
    showNotification('Deleted', 'Syllabus subject block removed.', 'info');
  } catch (err) {
    console.error(err);
  }
};

// ================= VIEW: LECTURES CRUD =================
const addLectureBtn = document.getElementById('addLectureBtn');
const cancelLectureBtn = document.getElementById('cancelLectureBtn');
const lectureFormContainer = document.getElementById('lectureFormContainer');
const lectureForm = document.getElementById('lectureForm');
const lectureFormTitle = document.getElementById('lectureFormTitle');
const lectureIdField = document.getElementById('lectureIdField');
const lectureTitleField = document.getElementById('lectureTitleField');
const lectureIdKeyField = document.getElementById('lectureIdKeyField');
const lectureSubjectSelect = document.getElementById('lectureSubjectSelect');
const lectureDurationField = document.getElementById('lectureDurationField');
const lectureThumbnailField = document.getElementById('lectureThumbnailField');
const lectureVideoUrlField = document.getElementById('lectureVideoUrlField');
const lecturePdfUrlField = document.getElementById('lecturePdfUrlField');

addLectureBtn.addEventListener('click', () => {
  lectureFormTitle.textContent = 'Create Lecture Block';
  lectureIdField.value = '';
  lectureForm.reset();
  lectureIdKeyField.disabled = false;
  lectureFormContainer.classList.remove('hidden');
});

cancelLectureBtn.addEventListener('click', () => {
  lectureFormContainer.classList.add('hidden');
});

lectureForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = lectureTitleField.value.trim();
  const idKey = lectureIdKeyField.value.trim().toLowerCase().replace(/\s+/g, '-');
  const subjectId = lectureSubjectSelect.value;
  const duration = lectureDurationField.value.trim();
  const thumbnail = lectureThumbnailField.value.trim();
  const videoUrl = lectureVideoUrlField.value.trim();
  const pdfUrl = lecturePdfUrlField.value.trim();
  const existingId = lectureIdField.value;

  try {
    if (existingId) {
      await updateDoc(doc(db, 'lectures', existingId), {
        title,
        subjectId,
        duration,
        thumbnail,
        videoUrl,
        pdfUrl
      });
      showNotification('Success', 'Lecture track details modified.', 'success');
    } else {
      await setDoc(doc(db, 'lectures', idKey), {
        lectureId: idKey,
        subjectId,
        title,
        duration,
        thumbnail,
        videoUrl,
        pdfUrl,
        createdAt: new Date().toISOString()
      });
      showNotification('Success', 'Lecture media node initialized.', 'success');
    }
    lectureFormContainer.classList.add('hidden');
  } catch (err) {
    console.error(err);
    showNotification('Error', 'Failed to save lecture object.', 'error');
  }
});

function updateSubjectDropdowns() {
  lectureSubjectSelect.innerHTML = '';
  subjectsList.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.subjectId;
    opt.textContent = `${s.title} (${s.subjectId})`;
    lectureSubjectSelect.appendChild(opt);
  });
}

function renderLectures() {
  const container = document.getElementById('lectures-table-body');
  container.innerHTML = '';

  if (lecturesList.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-white/30">No lectures configured. Use "Add Lecture" above.</td></tr>`;
    return;
  }

  lecturesList.forEach(l => {
    const row = document.createElement('tr');
    row.className = 'border-b border-white/5 hover:bg-white/2 text-slate-300';
    const hasPdfBadge = l.pdfUrl 
      ? '<span class="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-bold">PDF YES</span>' 
      : '<span class="px-1.5 py-0.5 bg-white/5 text-white/30 rounded text-[9px]">NONE</span>';
    row.innerHTML = `
      <td class="p-4">
        <img src="${l.thumbnail}" class="w-12 h-8 rounded-lg object-cover border border-white/10" />
      </td>
      <td class="p-4">
        <p class="font-bold text-white text-xs">${escapeHTML(l.title)}</p>
        <span class="text-[9px] text-white/40 font-mono block">${escapeHTML(l.lectureId)}</span>
      </td>
      <td class="p-4 font-mono text-[10px] text-purple-400">${escapeHTML(l.subjectId)}</td>
      <td class="p-4 font-mono text-[10px]">${escapeHTML(l.duration)}</td>
      <td class="p-4">${hasPdfBadge}</td>
      <td class="p-4 text-right">
        <div class="flex justify-end gap-1.5">
          <button onclick="editLecture('${l.lectureId}')" class="px-2 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[10px] font-bold transition">Edit</button>
          <button onclick="deleteLecture('${l.lectureId}')" class="px-2 py-1 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-[10px] font-bold transition border border-red-500/10 hover:border-red-500">Delete</button>
        </div>
      </td>
    `;
    container.appendChild(row);
  });
}

window.editLecture = (id) => {
  const l = lecturesList.find(item => item.lectureId === id);
  if (!l) return;

  lectureFormTitle.textContent = 'Edit Lecture Block';
  lectureIdField.value = l.lectureId;
  lectureTitleField.value = l.title;
  lectureIdKeyField.value = l.lectureId;
  lectureIdKeyField.disabled = true;
  lectureSubjectSelect.value = l.subjectId;
  lectureDurationField.value = l.duration;
  lectureThumbnailField.value = l.thumbnail;
  lectureVideoUrlField.value = l.videoUrl;
  lecturePdfUrlField.value = l.pdfUrl || '';

  lectureFormContainer.classList.remove('hidden');
};

window.deleteLecture = async (id) => {
  if (!confirm('Are you absolutely sure you want to delete this secure video lecture track?')) return;
  try {
    await deleteDoc(doc(db, 'lectures', id));
    showNotification('Deleted', 'Syllabus video lecture removed.', 'info');
  } catch (err) {
    console.error(err);
  }
};

// ================= VIEW: DEVICE ACCESS LOGS =================
const clearLogsBtn = document.getElementById('clearLogsBtn');
clearLogsBtn.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to purge all device telemetry logs from Firestore database?')) return;
  try {
    for (const log of logsList) {
      await deleteDoc(doc(db, 'deviceLogs', log.logId));
    }
    showNotification('Purged', 'All device telemetry log incidents deleted.', 'info');
  } catch (err) {
    console.error(err);
  }
});

function renderDeviceLogs() {
  const container = document.getElementById('logs-table-body');
  container.innerHTML = '';

  if (logsList.length === 0) {
    container.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-white/30">No device access log incidents reported yet.</td></tr>`;
    return;
  }

  logsList.forEach(log => {
    const row = document.createElement('tr');
    row.className = 'border-b border-white/5 hover:bg-white/2 text-slate-300 font-mono text-[10px]';
    row.innerHTML = `
      <td class="p-4 text-white/40">${escapeHTML(log.logId.substring(0, 8))}...</td>
      <td class="p-4 text-indigo-400 font-bold">${escapeHTML(log.uid.substring(0, 8))}...</td>
      <td class="p-4 text-purple-400 font-bold">${escapeHTML(log.deviceId || 'Unknown')}</td>
      <td class="p-4 text-slate-200">${escapeHTML(log.os)} / ${escapeHTML(log.browser)}</td>
      <td class="p-4 text-white/50">${formatTime(log.openedAt)}</td>
      <td class="p-4 text-white/50">${log.closedAt ? formatTime(log.closedAt) : '<span class="text-emerald-400 animate-pulse font-bold">Connected</span>'}</td>
      <td class="p-4"><span class="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/15">${log.duration ? `${log.duration}s` : 'Active'}</span></td>
    `;
    container.appendChild(row);
  });
}

// ================= VIEW: DEVTOOLS MONITOR =================
function renderDevToolsMonitor() {
  const container = document.getElementById('devtools-table-body');
  container.innerHTML = '';

  const flaggedUsers = usersList.filter(u => (u.devToolOpenCount || 0) > 0);
  if (flaggedUsers.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-white/30">No active DevTools console triggers observed.</td></tr>`;
    return;
  }

  flaggedUsers.forEach(u => {
    const row = document.createElement('tr');
    row.className = 'border-b border-white/5 hover:bg-white/2 text-slate-300';
    row.innerHTML = `
      <td class="p-4">
        <p class="font-bold text-white text-xs">${escapeHTML(u.name || 'Aura Student')}</p>
        <span class="text-[9px] text-white/40 font-mono block">${escapeHTML(u.email)}</span>
      </td>
      <td class="p-4 text-xs">${escapeHTML(u.os || 'Unknown OS')} / ${escapeHTML(u.browser || 'Unknown')}</td>
      <td class="p-4"><span class="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-indigo-300">${escapeHTML(u.platform || 'Desktop')}</span></td>
      <td class="p-4 font-mono text-[10px] text-white/50">${escapeHTML(u.screenSize || 'N/A')}</td>
      <td class="p-4 font-mono text-xs font-extrabold text-amber-400">${u.devToolOpenCount || 0} times</td>
      <td class="p-4 font-mono text-xs font-extrabold text-red-400">${u.devToolTotalTime || 0} seconds</td>
    `;
    container.appendChild(row);
  });
}

// ================= VIEW: BLOCKED DEVICES =================
const blockNewDeviceBtn = document.getElementById('blockNewDeviceBtn');
const cancelBlockedBtn = document.getElementById('cancelBlockedBtn');
const blockedDeviceFormContainer = document.getElementById('blockedDeviceFormContainer');
const blockedDeviceForm = document.getElementById('blockedDeviceForm');
const blockedKeyField = document.getElementById('blockedKeyField');
const blockedReasonField = document.getElementById('blockedReasonField');

blockNewDeviceBtn.addEventListener('click', () => {
  blockedDeviceForm.reset();
  blockedDeviceFormContainer.classList.remove('hidden');
});

cancelBlockedBtn.addEventListener('click', () => {
  blockedDeviceFormContainer.classList.add('hidden');
});

blockedDeviceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const targetKey = blockedKeyField.value.trim();
  const reason = blockedReasonField.value.trim();

  try {
    await setDoc(doc(db, 'blockedDevices', targetKey), {
      deviceId: targetKey,
      reason,
      blockedAt: new Date().toISOString()
    });
    showNotification('Blocked', 'Device signature added to blacklist.', 'info');
    blockedDeviceFormContainer.classList.add('hidden');
  } catch (err) {
    console.error(err);
    showNotification('Error', 'Failed to blacklist target.', 'error');
  }
});

function renderBlockedDevices() {
  const container = document.getElementById('blocked-table-body');
  container.innerHTML = '';

  if (blockedList.length === 0) {
    container.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-white/30">No explicit device ID blocks configured.</td></tr>`;
    return;
  }

  blockedList.forEach(b => {
    const row = document.createElement('tr');
    row.className = 'border-b border-white/5 hover:bg-white/2 text-slate-300';
    row.innerHTML = `
      <td class="p-4 font-mono text-[10px] text-red-400 font-bold">${escapeHTML(b.deviceId)}</td>
      <td class="p-4 font-mono text-[10px] text-white/40">${formatTime(b.blockedAt)}</td>
      <td class="p-4 text-xs text-white/70">${escapeHTML(b.reason)}</td>
      <td class="p-4 text-right">
        <button onclick="unblockDevice('${b.blockedId}')" class="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-[10px] font-bold border border-emerald-500/15 transition">
          Authorize Access
        </button>
      </td>
    `;
    container.appendChild(row);
  });
}

window.unblockDevice = async (id) => {
  try {
    await deleteDoc(doc(db, 'blockedDevices', id));
    showNotification('Authorized', 'Device signature reinstated.', 'success');
  } catch (err) {
    console.error(err);
  }
};

// ================= VIEW: ANALYTICS =================
function renderAnalytics() {
  const browserChart = document.getElementById('analytics-browser-chart');
  const osChart = document.getElementById('analytics-os-chart');

  // Count browser distribution
  const browsers = {};
  const oses = {};

  usersList.forEach(u => {
    const b = u.browser || 'Unknown Browser';
    const o = u.os || 'Unknown OS';
    browsers[b] = (browsers[b] || 0) + 1;
    oses[o] = (oses[o] || 0) + 1;
  });

  // Render lists with responsive visual bar
  browserChart.innerHTML = '';
  Object.entries(browsers).forEach(([name, count]) => {
    const pct = Math.round((count / usersList.length) * 100);
    const row = document.createElement('div');
    row.className = 'flex flex-col gap-1 text-xs';
    row.innerHTML = `
      <div class="flex justify-between font-medium">
        <span>${escapeHTML(name)}</span>
        <span>${count} (${pct}%)</span>
      </div>
      <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" style="width: ${pct}%"></div>
      </div>
    `;
    browserChart.appendChild(row);
  });

  osChart.innerHTML = '';
  Object.entries(oses).forEach(([name, count]) => {
    const pct = Math.round((count / usersList.length) * 100);
    const row = document.createElement('div');
    row.className = 'flex flex-col gap-1 text-xs';
    row.innerHTML = `
      <div class="flex justify-between font-medium">
        <span>${escapeHTML(name)}</span>
        <span>${count} (${pct}%)</span>
      </div>
      <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style="width: ${pct}%"></div>
      </div>
    `;
    osChart.appendChild(row);
  });
}

// ================= SEED DEMO DATA HELPER =================
const seedDemoDataBtn = document.getElementById('seedDemoDataBtn');
seedDemoDataBtn.addEventListener('click', async () => {
  if (coursesList.length > 0) {
    if (!confirm('The system already contains courses. Seeding additional demo curriculums might duplicate item entries. Continue?')) return;
  }

  seedDemoDataBtn.disabled = true;
  seedDemoDataBtn.textContent = 'Writing telemetry schemas...';

  try {
    // 1. Seed Courses
    const sampleCourses = [
      {
        courseId: 'ts-architecture',
        title: 'Advanced TypeScript Systems',
        thumbnail: 'https://images.unsplash.com/photo-1516116211223-5c359a36298a?q=80&w=1200&auto=format&fit=crop',
        description: 'Explore industrial grade architectural design patterns, type stripping mechanics, compiler configuration matrices, and safe runtime type assertions.'
      },
      {
        courseId: 'container-virtualization',
        title: 'Industrial Container Virtualization',
        thumbnail: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=1200&auto=format&fit=crop',
        description: 'Nail advanced Linux namespace operations, secure sandboxed virtual machines, multi-stage pipeline containers, and reverse proxy deployments.'
      }
    ];

    for (const c of sampleCourses) {
      await setDoc(doc(db, 'courses', c.courseId), {
        ...c,
        createdAt: new Date().toISOString()
      });
    }

    // 2. Seed Subjects
    const sampleSubjects = [
      {
        subjectId: 'ts-decorators-meta',
        courseId: 'ts-architecture',
        title: 'Metadata Reflection & Decorators',
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop'
      },
      {
        subjectId: 'docker-networking',
        courseId: 'container-virtualization',
        title: 'Docker Subnetting & Bridge Networks',
        thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1200&auto=format&fit=crop'
      }
    ];

    for (const s of sampleSubjects) {
      await setDoc(doc(db, 'subjects', s.subjectId), {
        ...s,
        createdAt: new Date().toISOString()
      });
    }

    // 3. Seed Lectures
    const sampleLectures = [
      {
        lectureId: 'lecture-meta-reflection',
        subjectId: 'ts-decorators-meta',
        title: 'Implementing Safe Metadata Decorators at Class boundaries',
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
        videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration: '12:45'
      },
      {
        lectureId: 'lecture-docker-subnets',
        subjectId: 'docker-networking',
        title: 'Bridge Networks and Multi-Container DNS resolution',
        thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=1200&auto=format&fit=crop',
        videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        duration: '18:12'
      }
    ];

    for (const l of sampleLectures) {
      await setDoc(doc(db, 'lectures', l.lectureId), {
        ...l,
        createdAt: new Date().toISOString()
      });
    }

    showNotification('Database Seeded', 'Demo catalog schema populating finished successfully.', 'success');
  } catch (err) {
    console.error(err);
    showNotification('Seed Failed', 'Failed to seed demo metadata.', 'error');
  } finally {
    seedDemoDataBtn.disabled = false;
    seedDemoDataBtn.textContent = '⚡ Seed Database Catalog';
  }
});

// ================= UTILITIES & NOTIFICATIONS =================
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function formatTime(isoStr) {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return isoStr;
  }
}

function showNotification(title, message, type = 'success') {
  // Simple beautiful floating dynamic HTML toast
  const toast = document.createElement('div');
  toast.className = `fixed bottom-5 right-5 z-50 p-4 rounded-2xl shadow-xl backdrop-blur-xl border flex flex-col gap-1 transition-all duration-300 translate-y-10 opacity-0 max-w-sm
    ${type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : ''}
    ${type === 'info' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : ''}
    ${type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : ''}`;
  
  toast.innerHTML = `
    <h5 class="text-xs font-bold uppercase tracking-wider">${escapeHTML(title)}</h5>
    <p class="text-[11px] opacity-80 leading-relaxed">${escapeHTML(message)}</p>
  `;

  document.body.appendChild(toast);
  
  // Animate Entrance
  setTimeout(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
  }, 10);

  // Exit & Remove
  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
