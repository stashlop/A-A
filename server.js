const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const express = require('express');
const session = require('express-session');
const multer = require('multer');
const nunjucks = require('nunjucks');

const app = express();

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 5000);
const INSTANCE_PATH = path.resolve(process.env.INSTANCE_PATH || path.join(ROOT, 'instance'));
const STATIC_DIR = path.join(ROOT, 'A&A', 'static');
const TEMPLATE_DIR = path.join(ROOT, 'A&A', 'templates');
const USD_TO_INR = Number(process.env.USD_TO_INR || 83);

fs.mkdirSync(INSTANCE_PATH, { recursive: true });

const DATA_DIR = path.join(INSTANCE_PATH, 'json_store');
fs.mkdirSync(DATA_DIR, { recursive: true });

const DATA_FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  books: path.join(DATA_DIR, 'books.json'),
  games: path.join(DATA_DIR, 'games.json'),
  purchases: path.join(DATA_DIR, 'purchases.json'),
  cafeBookings: path.join(DATA_DIR, 'cafe_bookings.json'),
  community: path.join(DATA_DIR, 'community.json')
};

const SAMPLE_BOOKS = [
  { id: 1, title: 'One Piece Vol. 1', author: 'Eiichiro Oda', description: 'A legendary pirate adventure begins.', category: 'Manga', genre: 'Adventure,Shounen', buy_price: 9.99, rent_price: 2.99, image: 'images/books/onepiece.jpg', isbn: '978-1421506333', pages: 200, publication_year: 1999 },
  { id: 2, title: 'Attack on Titan Vol. 1', author: 'Hajime Isayama', description: 'Humanity fights for survival against giant titans.', category: 'Manga', genre: 'Action,Drama', buy_price: 10.99, rent_price: 3.49, image: 'images/books/aot1.jpeg', isbn: '978-1612620244', pages: 192, publication_year: 2012 },
  { id: 3, title: 'Demon Slayer Vol. 1', author: 'Koyoharu Gotouge', description: 'A swordsman seeks a cure for his sister.', category: 'Manga', genre: 'Action,Supernatural', buy_price: 9.99, rent_price: 2.99, image: 'images/books/DemonSlayerVol1.jpg', isbn: '978-1974700523', pages: 192, publication_year: 2018 },
  { id: 4, title: 'Sword Art Online Vol. 1', author: 'Reki Kawahara', description: 'Trapped in a virtual MMORPG where death is real.', category: 'Light Novel', genre: 'Sci-Fi,Romance', buy_price: 14.99, rent_price: 4.99, image: 'images/books/sao.jpeg', isbn: '978-0316371247', pages: 240, publication_year: 2014 },
  { id: 5, title: 'Re:Zero Vol. 1', author: 'Tappei Nagatsuki', description: 'A boy discovers he can return from death.', category: 'Light Novel', genre: 'Fantasy,Psychological', buy_price: 14.99, rent_price: 4.99, image: 'images/books/rezero.jpeg', isbn: '978-0316315302', pages: 256, publication_year: 2016 },
  { id: 6, title: 'Overlord Vol. 1', author: 'Kugane Maruyama', description: 'A player remains in a game world as an undead ruler.', category: 'Light Novel', genre: 'Fantasy,Dark', buy_price: 14.99, rent_price: 4.99, image: 'images/books/overlord.jpg', isbn: '978-0316272247', pages: 272, publication_year: 2016 },
  { id: 7, title: 'Dune', author: 'Frank Herbert', description: 'Epic sci-fi saga on the desert planet Arrakis.', category: 'Novel', genre: 'Science Fiction', buy_price: 16.99, rent_price: 5.99, image: 'images/books/Dune.jpeg', isbn: '978-0441172719', pages: 688, publication_year: 1965 },
  { id: 8, title: 'The Hobbit', author: 'J.R.R. Tolkien', description: 'Bilbo Baggins goes on an unexpected journey.', category: 'Novel', genre: 'Fantasy', buy_price: 14.99, rent_price: 4.99, image: 'images/books/hobbit.jpeg', isbn: '978-0547928227', pages: 300, publication_year: 1937 },
  { id: 9, title: '1984', author: 'George Orwell', description: 'A dystopian world of surveillance and control.', category: 'Novel', genre: 'Dystopian,Classic', buy_price: 13.99, rent_price: 4.49, image: 'images/books/1984.jpg', isbn: '978-0452284234', pages: 328, publication_year: 1949 },
  { id: 10, title: 'Clean Code', author: 'Robert C. Martin', description: 'A handbook of agile software craftsmanship.', category: 'Technical', genre: 'Programming', buy_price: 49.99, rent_price: 12.99, image: 'images/books/clean.jpeg', isbn: '978-0132350884', pages: 464, publication_year: 2008 },
  { id: 11, title: 'Design Patterns', author: 'Gang of Four', description: 'Elements of reusable object-oriented software.', category: 'Technical', genre: 'Programming', buy_price: 54.99, rent_price: 14.99, image: 'images/books/designpatterns.jpg', isbn: '978-0201633612', pages: 395, publication_year: 1994 },
  { id: 12, title: 'Sapiens', author: 'Yuval Noah Harari', description: 'A brief history of humankind.', category: 'Non-Fiction', genre: 'History,Science', buy_price: 18.99, rent_price: 6.99, image: 'images/books/sapiens.jpeg', isbn: '978-0062316097', pages: 443, publication_year: 2014 },
  { id: 13, title: 'Atomic Habits', author: 'James Clear', description: 'Tiny changes that create remarkable results.', category: 'Non-Fiction', genre: 'Self-Help', buy_price: 16.99, rent_price: 5.99, image: 'images/books/atomic_habits.jpeg', isbn: '978-0735211292', pages: 320, publication_year: 2018 }
];

const SAMPLE_GAMES = [
  { id: 1, title: "Baldur's Gate 3", description: 'Epic CRPG adventure with deep choices and co-op.', category: 'RPG,Co-op', buy_price: 59.99, rent_price: 9.99, image: 'images/games/Baldurs_Gate_3.jpeg' },
  { id: 2, title: 'Alan Wake 2', description: 'Psychological horror thriller with cinematic storytelling.', category: 'Horror,Narrative', buy_price: 49.99, rent_price: 7.99, image: 'images/games/Alan_Wake_2.jpeg' },
  { id: 3, title: 'Cyberpunk 2077', description: 'Open-world RPG in a neon-soaked metropolis.', category: 'RPG,Open-World', buy_price: 29.99, rent_price: 6.99, image: 'images/games/cyberpunk.jpeg' },
  { id: 4, title: 'Red Dead Redemption 2', description: 'Open-world western with cinematic storytelling.', category: 'Open-World,Action', buy_price: 39.99, rent_price: 8.99, image: 'images/games/red.jpeg' },
  { id: 5, title: 'The Witcher 3', description: 'Open-world RPG full of monsters and choices.', category: 'RPG,Open-World', buy_price: 29.99, rent_price: 6.49, image: 'images/games/witcher.jpeg' },
  { id: 6, title: 'Disco Elysium', description: 'A groundbreaking RPG focused on choice and investigation.', category: 'Indie,RPG', buy_price: 19.99, rent_price: 4.49, image: 'images/games/Disco.jpeg' },
  { id: 7, title: 'Silent Hill 2 (Remake)', description: 'Reimagined survival-horror classic.', category: 'Horror,Survival', buy_price: 39.99, rent_price: 8.49, image: 'images/games/hill.jpeg' },
  { id: 8, title: 'God of War', description: 'A mythic reimagining: father, son, and monsters.', category: 'Action,Adventure', buy_price: 29.99, rent_price: 6.99, image: 'images/games/god.jpeg' }
];

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password || '')).digest('hex');
}

function nextId(rows) {
  return rows.length ? Math.max(...rows.map((r) => Number(r.id || 0))) + 1 : 1;
}

function ensureSeedData() {
  const users = readJson(DATA_FILES.users, []);
  if (!Array.isArray(users) || users.length === 0) {
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const seedUsers = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        password_hash: hashPassword(adminPassword),
        created_at: new Date().toISOString(),
        display_name: '',
        photo_path: ''
      }
    ];
    writeJson(DATA_FILES.users, seedUsers);
  }

  const books = readJson(DATA_FILES.books, []);
  if (!Array.isArray(books) || books.length === 0) {
    writeJson(DATA_FILES.books, SAMPLE_BOOKS);
  }

  const games = readJson(DATA_FILES.games, []);
  if (!Array.isArray(games) || games.length === 0) {
    writeJson(DATA_FILES.games, SAMPLE_GAMES);
  }

  const purchases = readJson(DATA_FILES.purchases, []);
  if (!Array.isArray(purchases)) {
    writeJson(DATA_FILES.purchases, []);
  }

  const cafeBookings = readJson(DATA_FILES.cafeBookings, []);
  if (!Array.isArray(cafeBookings)) {
    writeJson(DATA_FILES.cafeBookings, []);
  }

  const community = readJson(DATA_FILES.community, null);
  if (!community || !Array.isArray(community.subscribers) || !Array.isArray(community.messages)) {
    writeJson(DATA_FILES.community, { subscribers: [], messages: [] });
  }
}

ensureSeedData();

const nunjucksEnv = nunjucks.configure(TEMPLATE_DIR, {
  autoescape: true,
  express: app,
  noCache: true
});

nunjucksEnv.addFilter('inr', (value) => {
  const n = Number(value || 0);
  const converted = Number.isFinite(n) ? n * USD_TO_INR : 0;
  return `₹${converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});

nunjucksEnv.addFilter('format', (fmt, value) => {
  const n = Number(value || 0);
  if (fmt === '%.2f') return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  if (fmt === '%.0f') return Number.isFinite(n) ? Math.round(n).toString() : '0';
  return String(value ?? '');
});

nunjucksEnv.addFilter('float', (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
});

function getUsers() {
  return readJson(DATA_FILES.users, []);
}

function saveUsers(rows) {
  writeJson(DATA_FILES.users, rows);
}

function getBooks() {
  return readJson(DATA_FILES.books, []);
}

function getGames() {
  return readJson(DATA_FILES.games, []);
}

function saveGames(rows) {
  writeJson(DATA_FILES.games, rows);
}

function getPurchases() {
  return readJson(DATA_FILES.purchases, []);
}

function savePurchases(rows) {
  writeJson(DATA_FILES.purchases, rows);
}

function getCafeBookings() {
  return readJson(DATA_FILES.cafeBookings, []);
}

function saveCafeBookings(rows) {
  writeJson(DATA_FILES.cafeBookings, rows);
}

function getCommunity() {
  return readJson(DATA_FILES.community, { subscribers: [], messages: [] });
}

function saveCommunity(data) {
  writeJson(DATA_FILES.community, data);
}

function isLoggedIn(req) {
  return Boolean(req.session.user || req.session.user_id);
}

function getCurrentUser(req) {
  const users = getUsers();
  const uid = Number(req.session.user_id || 0);
  if (!uid) return null;
  return users.find((u) => Number(u.id) === uid) || null;
}

function isAdmin(req) {
  const uname = String(req.session.user || req.session.username || '').toLowerCase();
  if (uname === 'admin') return true;
  if (Number(req.session.user_id || 0) === 1) return true;
  const envUsers = String(process.env.ADMIN_USERS || '');
  if (!envUsers) return false;
  const allowed = new Set(envUsers.split(',').map((u) => u.trim().toLowerCase()).filter(Boolean));
  return allowed.has(uname);
}

function sessionGet(req, key) {
  return req.session[key];
}

function makeSessionView(req) {
  return {
    get: (key) => sessionGet(req, key),
    user: req.session.user,
    user_id: req.session.user_id,
    username: req.session.username,
    community_email: req.session.community_email
  };
}

function requestView(req) {
  return {
    path: req.path,
    args: {
      get: (key, fallback = '') => {
        const value = req.query[key];
        if (value === undefined || value === null || value === '') return fallback;
        return value;
      }
    }
  };
}

function urlFor(name, options = {}) {
  const map = {
    index: '/',
    home: '/home',
    login: '/login',
    signup: '/signup',
    logout: '/logout',
    books: '/books',
    video_games: '/video_games',
    cafe: '/cafe',
    cart: '/cart',
    checkout_page: '/checkout',
    history_page: '/history',
    community_page: '/community',
    admin_dashboard: '/admin',
    admin_revenue_csv: '/admin/revenue.csv'
  };

  if (name === 'static') {
    const filename = options.filename || '';
    return `/static/${filename}`;
  }

  return map[name] || '#';
}

function maskEmail(email) {
  const value = String(email || '');
  if (!value.includes('@')) return value;
  const [left, right] = value.split('@');
  const shown = left.slice(0, 2);
  return `${shown}${'*'.repeat(Math.max(0, left.length - 2))}@${right}`;
}

function ensureCart(req) {
  if (!req.session.cart || !Array.isArray(req.session.cart.items)) {
    req.session.cart = { items: [] };
  }
  return req.session.cart;
}

function totals(items) {
  const subtotal = items.reduce((sum, it) => sum + Number(it.unit_price || 0) * Number(it.quantity || 1), 0);
  const totalQty = items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);
  return { subtotal: Number(subtotal.toFixed(2)), totalQty };
}

function toInr(amount) {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return 0;
  return Number((n * USD_TO_INR).toFixed(2));
}

function parseTimeToMin(tstr) {
  const parts = String(tstr || '00:00').split(':');
  const h = Number(parts[0] || 0);
  const m = Number(parts[1] || 0);
  return h * 60 + m;
}

function minToTime(mins) {
  const m = Number(mins) % (24 * 60);
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${h}:${mm}`;
}

function overlaps(startA, durA, startB, durB) {
  const endA = startA + durA;
  const endB = startB + durB;
  return startA < endB && startB < endA;
}

function isClosed(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return d.getDay() === 0;
}

function isMembersOnly(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return d.getDay() === 6;
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/static', express.static(STATIC_DIR));

app.use(
  session({
    secret: process.env.SECRET_KEY || 'dev-secret-key-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
  })
);

app.use((req, res, next) => {
  req.flash = (category, message) => {
    if (!req.session.flash) req.session.flash = [];
    req.session.flash.push([category || 'info', String(message || '')]);
  };

  const currentUser = getCurrentUser(req);
  const cartItems = ensureCart(req).items;
  const cartCount = cartItems.reduce((sum, it) => sum + Number(it.quantity || 1), 0);

  res.locals.session = makeSessionView(req);
  res.locals.request = requestView(req);
  res.locals.is_admin = isAdmin(req);
  res.locals.user_display_name = currentUser && currentUser.display_name ? currentUser.display_name : null;
  res.locals.cart_count = cartCount;
  res.locals.current_year = new Date().getFullYear();
  res.locals.url_for = urlFor;
  res.locals.get_flashed_messages = (opts = {}) => {
    const arr = req.session.flash || [];
    req.session.flash = [];
    if (opts && opts.with_categories) return arr;
    return arr.map((x) => x[1]);
  };

  next();
});

function requireLogin(req, res, next) {
  if (!isLoggedIn(req)) return res.redirect('/login');
  next();
}

function render(res, tpl, ctx = {}) {
  return res.render(tpl, ctx);
}

const uploadDir = path.join(STATIC_DIR, 'uploads', 'community');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const email = String(req.session.community_email || 'member').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
      cb(null, `${email}_${Date.now()}${ext}`);
    }
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      cb(new Error('Only PNG, JPG, JPEG, WEBP allowed'));
      return;
    }
    cb(null, true);
  }
});

app.get('/', (_req, res) => render(res, 'index.html'));

app.get('/home', (req, res) => {
  if (!isLoggedIn(req)) return res.redirect('/login');
  return res.redirect('/');
});

app.get('/login', (req, res) => {
  if (isLoggedIn(req)) return res.redirect('/home');
  return render(res, 'login.html');
});

app.post('/login', (req, res) => {
  const ident = String(req.body.ident || '').trim();
  const password = String(req.body.password || '');
  const nextUrl = String(req.body.next || req.query.next || '/');

  if (!ident || !password) {
    req.flash('error', 'Please provide username/email and password.');
    return res.redirect('/login');
  }

  const users = getUsers();
  const user = users.find((u) => u.username === ident || String(u.email || '').toLowerCase() === ident.toLowerCase());
  if (!user || user.password_hash !== hashPassword(password)) {
    req.flash('error', 'Invalid credentials.');
    return res.redirect('/login');
  }

  req.session.user = user.username;
  req.session.username = user.username;
  req.session.user_id = user.id;

  const cem = String(req.session.community_email || '').trim().toLowerCase();
  if (cem) {
    const community = getCommunity();
    const sub = community.subscribers.find((s) => s.email === cem);
    if (sub) {
      sub.user_id = user.id;
      saveCommunity(community);
    }
  }

  if (nextUrl.startsWith('/')) return res.redirect(nextUrl);
  return res.redirect('/');
});

app.get('/signup', (_req, res) => render(res, 'signup.html'));

app.post('/signup', (req, res) => {
  const username = String(req.body.username || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!username || !password) {
    req.flash('error', 'Both fields are required');
    return res.redirect('/signup');
  }

  const users = getUsers();
  if (users.some((u) => u.username === username || (email && u.email === email))) {
    req.flash('error', 'Username already exists');
    return res.redirect('/signup');
  }

  const id = nextId(users);
  const newUser = {
    id,
    username,
    email: email || `${username}@example.com`,
    password_hash: hashPassword(password),
    created_at: new Date().toISOString(),
    display_name: '',
    photo_path: ''
  };

  users.push(newUser);
  saveUsers(users);

  req.session.user = username;
  req.session.username = username;
  req.session.user_id = id;

  const cem = String(req.session.community_email || '').trim().toLowerCase();
  if (cem) {
    const community = getCommunity();
    const sub = community.subscribers.find((s) => s.email === cem);
    if (sub) {
      sub.user_id = id;
      saveCommunity(community);
    }
  }

  return res.redirect('/home');
});

app.get('/logout', (req, res) => {
  req.session.user = null;
  req.session.username = null;
  req.session.user_id = null;
  req.session.community_email = null;
  req.session.cart = { items: [] };
  return res.redirect('/');
});

app.get('/books', requireLogin, (req, res) => {
  const category = String(req.query.category || '').trim();
  const search = String(req.query.search || '').trim().toLowerCase();
  let books = getBooks();

  if (category) books = books.filter((b) => String(b.category || '') === category);
  if (search) {
    books = books.filter((b) => {
      return [b.title, b.author, b.description].some((x) => String(x || '').toLowerCase().includes(search));
    });
  }

  const categories = [...new Set(getBooks().map((b) => b.category).filter(Boolean))].sort();

  const mapped = books.map((b) => ({
    ...b,
    image_static: b.image
  }));

  return render(res, 'books.html', {
    books: mapped,
    categories,
    selected_category: category,
    search_term: search
  });
});

app.get('/video_games', requireLogin, (req, res) => {
  const category = String(req.query.category || '').trim();
  const search = String(req.query.search || '').trim().toLowerCase();

  let games = getGames();
  if (category) {
    games = games.filter((g) => String(g.category || '').toLowerCase().includes(category.toLowerCase()));
  }
  if (search) {
    games = games.filter((g) => [g.title, g.description].some((x) => String(x || '').toLowerCase().includes(search)));
  }

  const allCategories = new Set();
  getGames().forEach((g) => {
    String(g.category || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((x) => allCategories.add(x));
  });

  return render(res, 'video_games.html', {
    games: games.map((g) => ({ ...g, image_static: g.image })),
    categories: [...allCategories].sort()
  });
});

app.get('/video-games', (_req, res) => res.redirect('/video_games'));

app.get('/admin/seed/games', requireLogin, (req, res) => {
  if (!isAdmin(req)) return res.status(403).send('Forbidden: Admins only');
  const force = ['1', 'true', 'yes'].includes(String(req.query.force || '').toLowerCase());
  const current = getGames();
  if (!current.length || force) {
    saveGames(SAMPLE_GAMES.map((g, i) => ({ ...g, id: i + 1 })));
    return res.send(`Seeded ${SAMPLE_GAMES.length} games (force=${force}).`);
  }
  return res.send(`Games list already has ${current.length} entries. Use ?force=1 to replace.`);
});

app.get('/cafe', requireLogin, (_req, res) => render(res, 'cafe.html'));

app.get('/api/cafe/availability', requireLogin, (req, res) => {
  const date = String(req.query.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid or missing date (use YYYY-MM-DD)' });
  }

  if (isClosed(date)) {
    return res.json({ date, status: 'sold_out', sold_out_general: true, members_allowed: false, note: 'Fully booked (closed to all reservations)' });
  }
  if (isMembersOnly(date)) {
    return res.json({ date, status: 'members_only', sold_out_general: true, members_allowed: true, note: 'Members-only esports event day' });
  }
  return res.json({ date, status: 'available', sold_out_general: false, members_allowed: true, note: 'Available for bookings' });
});

app.get('/api/cafe/slots', requireLogin, (req, res) => {
  const date = String(req.query.date || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Invalid or missing date' });

  if (isClosed(date)) return res.json({ date, closed: true, members_only: false, slots: [] });
  if (isMembersOnly(date)) return res.json({ date, closed: false, members_only: true, slots: [] });

  const openTime = String(process.env.CAFE_OPEN || '10:00');
  const closeTime = String(process.env.CAFE_CLOSE || '22:00');
  const stepMin = Number(process.env.CAFE_SLOT_STEP_MIN || 60);
  const defaultDur = Number(process.env.CAFE_DEFAULT_DURATION || 60);
  const cap = Math.max(1, Number(process.env.CAFE_SLOT_CAPACITY || 10));

  const rows = getCafeBookings().filter((b) => b.date === date && b.status === 'confirmed');

  const slots = [];
  let m = parseTimeToMin(openTime);
  const end = parseTimeToMin(closeTime);
  while (m + defaultDur <= end) {
    const used = rows.reduce((sum, b) => {
      const bs = parseTimeToMin(b.time);
      const bd = Number(b.duration_minutes || 60);
      return overlaps(m, defaultDur, bs, bd) ? sum + Number(b.party_size || 0) : sum;
    }, 0);
    slots.push({ time: minToTime(m), remaining: Math.max(0, cap - used) });
    m += stepMin;
  }

  return res.json({ date, closed: false, members_only: false, capacity: cap, duration: defaultDur, slots });
});

app.post('/api/cafe/book', requireLogin, (req, res) => {
  const date = String(req.body.date || '').trim();
  const time = String(req.body.time || '').trim();
  const partySize = Number(req.body.partySize || 1);
  const duration = Number(req.body.duration || process.env.CAFE_DEFAULT_DURATION || 60);
  const note = String(req.body.note || '').trim();

  if (!date || !time) return res.status(400).json({ error: 'date and time are required' });
  if (partySize < 1) return res.status(400).json({ error: 'partySize must be >= 1' });
  if (duration < 30 || duration > 240) return res.status(400).json({ error: 'duration must be between 30 and 240 minutes' });
  if (isClosed(date)) return res.status(400).json({ error: 'Selected day is fully booked' });
  if (isMembersOnly(date)) return res.status(403).json({ error: 'Members-only esports event day' });

  const cap = Math.max(1, Number(process.env.CAFE_SLOT_CAPACITY || 10));
  const start = parseTimeToMin(time);
  const rows = getCafeBookings();
  const used = rows
    .filter((b) => b.date === date && b.status === 'confirmed')
    .reduce((sum, b) => {
      const bs = parseTimeToMin(b.time);
      const bd = Number(b.duration_minutes || 60);
      return overlaps(start, duration, bs, bd) ? sum + Number(b.party_size || 0) : sum;
    }, 0);

  if (used + partySize > cap) {
    return res.status(409).json({ error: 'Not enough capacity in this slot', remaining: Math.max(0, cap - used), capacity: cap });
  }

  const booking = {
    id: nextId(rows),
    user_id: Number(req.session.user_id || 0),
    date,
    time,
    party_size: partySize,
    note,
    status: 'confirmed',
    created_at: new Date().toISOString(),
    duration_minutes: duration,
    canceled_at: null
  };
  rows.push(booking);
  saveCafeBookings(rows);
  return res.json({ success: true, booking_id: booking.id, status: 'confirmed' });
});

app.get('/api/cafe/bookings', requireLogin, (req, res) => {
  const uid = Number(req.session.user_id || 0);
  const rows = getCafeBookings()
    .filter((b) => Number(b.user_id) === uid)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  return res.json(rows);
});

app.delete('/api/cafe/bookings/:id', requireLogin, (req, res) => {
  const bid = Number(req.params.id || 0);
  const uid = Number(req.session.user_id || 0);
  const rows = getCafeBookings();
  const booking = rows.find((b) => Number(b.id) === bid);

  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (Number(booking.user_id) !== uid) return res.status(403).json({ error: 'Forbidden' });
  if (booking.status !== 'confirmed') return res.status(400).json({ error: 'Booking is not active' });

  booking.status = 'canceled';
  booking.canceled_at = new Date().toISOString();
  saveCafeBookings(rows);
  return res.json({ success: true });
});

app.get('/cart', requireLogin, (req, res) => {
  const items = ensureCart(req).items;
  const subtotal = totals(items).subtotal;
  return render(res, 'cart.html', { items, subtotal });
});

app.get('/checkout', requireLogin, (req, res) => {
  const items = ensureCart(req).items;
  const subtotal = totals(items).subtotal;
  return render(res, 'checkout.html', { items, subtotal });
});

app.get('/history', requireLogin, (_req, res) => render(res, 'history.html'));

app.get('/api/cart', requireLogin, (req, res) => {
  const cart = ensureCart(req);
  const { subtotal, totalQty } = totals(cart.items);
  return res.json({ items: cart.items, subtotal, total_quantity: totalQty });
});

app.get('/api/cart/count', requireLogin, (req, res) => {
  const cart = ensureCart(req);
  const { totalQty } = totals(cart.items);
  return res.json({ count: totalQty });
});

app.post('/api/cart/add', requireLogin, (req, res) => {
  const itemType = String(req.body.itemType || '');
  const itemId = Number(req.body.itemId || 0);
  const action = String(req.body.action || 'buy');
  const quantity = Math.max(1, Number(req.body.quantity || 1));

  if (!['book', 'game'].includes(itemType) || !itemId || !['buy', 'rent'].includes(action)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const source = itemType === 'book' ? getBooks() : getGames();
  const item = source.find((x) => Number(x.id) === itemId);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const unitPrice = action === 'buy' ? toInr(item.buy_price) : toInr(item.rent_price);
  const key = `${itemType}-${itemId}-${action}`;
  const cart = ensureCart(req);

  const existing = cart.items.find((x) => x.key === key);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      key,
      item_type: itemType,
      item_id: itemId,
      title: item.title,
      action,
      unit_price: unitPrice,
      quantity
    });
  }

  const { subtotal, totalQty } = totals(cart.items);
  return res.json({ success: true, count: totalQty, subtotal });
});

app.post('/api/cart/remove', requireLogin, (req, res) => {
  const key = String(req.body.key || '');
  const cart = ensureCart(req);
  const before = cart.items.length;
  cart.items = cart.items.filter((x) => x.key !== key);
  const { subtotal, totalQty } = totals(cart.items);
  return res.json({ success: true, removed: before - cart.items.length, count: totalQty, subtotal });
});

app.post('/api/cart/clear', requireLogin, (req, res) => {
  req.session.cart = { items: [] };
  return res.json({ success: true, count: 0, subtotal: 0 });
});

app.post('/api/cart/checkout', requireLogin, (req, res) => {
  const cart = ensureCart(req);
  if (!cart.items.length) return res.status(400).json({ error: 'Cart is empty' });

  const buyer = typeof req.body.buyer === 'object' && req.body.buyer ? req.body.buyer : {};
  const paymentMethod = String(req.body.paymentMethod || 'Demo').trim() || 'Demo';
  const { subtotal } = totals(cart.items);

  const rows = getPurchases();
  const purchase = {
    id: nextId(rows),
    user_id: Number(req.session.user_id || 0),
    purchase_date: new Date().toISOString(),
    total_amount: subtotal,
    buyer_name: String(buyer.name || ''),
    buyer_email: String(buyer.email || ''),
    payment_method: paymentMethod,
    delivery_status: 'Processing',
    items_json: JSON.stringify(cart.items)
  };
  rows.push(purchase);
  savePurchases(rows);

  req.session.cart = { items: [] };
  return res.status(201).json({ success: true, purchase_id: purchase.id, message: 'Checkout complete. Thank you!' });
});

app.get('/api/purchase/history', requireLogin, (req, res) => {
  const uid = Number(req.session.user_id || 0);
  const rows = getPurchases()
    .filter((x) => Number(x.user_id) === uid)
    .sort((a, b) => String(b.purchase_date).localeCompare(String(a.purchase_date)))
    .map((x) => ({
      id: x.id,
      date: x.purchase_date,
      total: x.total_amount,
      paymentMethod: x.payment_method || 'Demo',
      buyer: {
        name: x.buyer_name || '',
        email: x.buyer_email || ''
      },
      items: JSON.parse(x.items_json || '[]'),
      deliveryStatus: x.delivery_status || 'Processing'
    }));

  return res.json(rows);
});

app.get('/community', (req, res) => {
  if (!(req.session.user || req.session.user_id || req.session.community_email)) {
    req.flash('info', 'Join the community with your email to access updates.');
    return res.redirect('/');
  }
  return render(res, 'community.html');
});

app.post('/community/join', (req, res) => {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email' });
  }

  const community = getCommunity();
  let sub = community.subscribers.find((s) => s.email === email);
  if (!sub) {
    sub = {
      id: nextId(community.subscribers),
      user_id: Number(req.session.user_id || 0) || null,
      email,
      joined_at: new Date().toISOString(),
      display_name: '',
      photo_path: ''
    };
    community.subscribers.push(sub);
  } else if (req.session.user_id) {
    sub.user_id = Number(req.session.user_id);
  }

  saveCommunity(community);
  req.session.community_email = email;
  return res.json({ success: true });
});

app.get('/api/community/messages', (_req, res) => {
  const community = getCommunity();
  const rows = [...community.messages].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 50);
  return res.json(rows);
});

app.post('/api/community/messages', requireLogin, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admins only' });
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ error: 'Message cannot be empty' });

  const community = getCommunity();
  const row = {
    id: nextId(community.messages),
    user_id: Number(req.session.user_id || 0),
    author: String(req.session.user || 'admin'),
    content,
    is_admin: 1,
    created_at: new Date().toISOString()
  };
  community.messages.push(row);
  saveCommunity(community);
  return res.json({ success: true, id: row.id });
});

app.get('/api/community/subscribers', (req, res) => {
  const admin = isAdmin(req);
  const community = getCommunity();
  const rows = [...community.subscribers]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 200)
    .map((s) => ({
      id: s.id,
      email: admin ? s.email : maskEmail(s.email),
      display_name: s.display_name || '',
      joined_at: s.joined_at || '',
      photo_url: s.photo_path ? `/static/${s.photo_path}` : null
    }));
  return res.json(rows);
});

app.post('/community/profile', upload.single('photo'), (req, res) => {
  const email = String(req.session.community_email || '').trim().toLowerCase();
  if (!email) {
    return res.status(403).json({ success: false, error: 'Join the community with your email first from Home' });
  }

  const displayName = String(req.body.display_name || '').trim();
  const community = getCommunity();
  let sub = community.subscribers.find((s) => s.email === email);
  if (!sub) {
    sub = {
      id: nextId(community.subscribers),
      user_id: Number(req.session.user_id || 0) || null,
      email,
      joined_at: new Date().toISOString(),
      display_name: '',
      photo_path: ''
    };
    community.subscribers.push(sub);
  }

  if (displayName) sub.display_name = displayName;
  if (req.file) {
    sub.photo_path = path.join('uploads', 'community', path.basename(req.file.filename)).replaceAll('\\', '/');
  }

  saveCommunity(community);

  const uid = Number(req.session.user_id || 0);
  if (uid) {
    const users = getUsers();
    const user = users.find((u) => Number(u.id) === uid);
    if (user) {
      if (displayName) user.display_name = displayName;
      if (req.file) user.photo_path = sub.photo_path;
      saveUsers(users);
    }
  }

  return res.json({ success: true });
});

app.get('/api/community/me', (req, res) => {
  const email = String(req.session.community_email || '').trim().toLowerCase();
  if (!email) return res.status(404).json({ error: 'Not joined' });

  const community = getCommunity();
  const row = community.subscribers.find((s) => s.email === email);
  if (!row) return res.status(404).json({ error: 'Not found' });

  return res.json({
    email: row.email,
    display_name: row.display_name || '',
    joined_at: row.joined_at || '',
    photo_url: row.photo_path ? `/static/${row.photo_path}` : null
  });
});

app.post('/account/username', requireLogin, (req, res) => {
  const newUsername = String(req.body.username || '').trim();
  if (!newUsername || newUsername.length < 3) {
    return res.status(400).json({ success: false, error: 'Username must be at least 3 characters' });
  }

  const users = getUsers();
  if (users.some((u) => u.username === newUsername)) {
    return res.status(409).json({ success: false, error: 'Username already taken' });
  }

  const uid = Number(req.session.user_id || 0);
  const user = users.find((u) => Number(u.id) === uid);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  user.username = newUsername;
  saveUsers(users);
  req.session.user = newUsername;
  req.session.username = newUsername;
  return res.json({ success: true });
});

app.get('/admin', requireLogin, (req, res) => {
  if (!isAdmin(req)) return res.status(403).send('Forbidden: Admins only');

  const purchases = getPurchases();
  const bookings = getCafeBookings();

  const totals = {
    orders: purchases.length,
    revenue: Number(purchases.reduce((sum, p) => sum + Number(p.total_amount || 0), 0).toFixed(2))
  };

  const methodTotals = {};
  const dailyMap = {};

  purchases.forEach((p) => {
    const method = String(p.payment_method || 'Demo').toLowerCase();
    if (!methodTotals[method]) methodTotals[method] = { orders: 0, revenue: 0 };
    methodTotals[method].orders += 1;
    methodTotals[method].revenue = Number((methodTotals[method].revenue + Number(p.total_amount || 0)).toFixed(2));

    const dKey = String(p.purchase_date || '').slice(0, 10);
    if (!dailyMap[dKey]) dailyMap[dKey] = { date: dKey, orders: 0, revenue: 0 };
    dailyMap[dKey].orders += 1;
    dailyMap[dKey].revenue = Number((dailyMap[dKey].revenue + Number(p.total_amount || 0)).toFixed(2));
  });

  const dailyRevenue = Object.values(dailyMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
  const dailyMax = Math.max(0, ...dailyRevenue.map((d) => Number(d.revenue || 0)));

  const membersMap = {};
  purchases.forEach((p) => {
    const uid = Number(p.user_id || 0);
    if (!membersMap[uid]) membersMap[uid] = { user_id: uid, orders: 0, spent: 0, bookings: 0 };
    membersMap[uid].orders += 1;
    membersMap[uid].spent = Number((membersMap[uid].spent + Number(p.total_amount || 0)).toFixed(2));
  });
  bookings.forEach((b) => {
    const uid = Number(b.user_id || 0);
    if (!membersMap[uid]) membersMap[uid] = { user_id: uid, orders: 0, spent: 0, bookings: 0 };
    membersMap[uid].bookings += 1;
  });

  const members = Object.values(membersMap).sort((a, b) => b.spent - a.spent || b.orders - a.orders).slice(0, 50);

  const methodTotalsView = {
    ...methodTotals,
    items: () => Object.entries(methodTotals)
  };

  return render(res, 'admin.html', {
    totals,
    purchases: [...purchases].sort((a, b) => String(b.purchase_date).localeCompare(String(a.purchase_date))).slice(0, 25),
    bookings: [...bookings].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)),
    members,
    method_totals: methodTotalsView,
    daily_revenue: dailyRevenue,
    daily_max: dailyMax
  });
});

app.post('/admin/purchase/:id/delivery', requireLogin, (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admins only' });

  const pid = Number(req.params.id || 0);
  const statusRaw = String(req.body.status || '').trim();
  const map = {
    processing: 'Processing',
    out: 'Out for delivery',
    'out for delivery': 'Out for delivery',
    delivered: 'Delivered',
    successful: 'Delivered',
    success: 'Delivered'
  };
  const status = map[statusRaw.toLowerCase()] || statusRaw;

  if (!['Processing', 'Out for delivery', 'Delivered'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const rows = getPurchases();
  const p = rows.find((x) => Number(x.id) === pid);
  if (!p) return res.status(404).json({ error: 'Purchase not found' });

  p.delivery_status = status;
  savePurchases(rows);
  return res.json({ success: true, status });
});

app.get('/admin/revenue.csv', requireLogin, (req, res) => {
  if (!isAdmin(req)) return res.status(403).send('Forbidden: Admins only');

  const rows = getPurchases().sort((a, b) => String(b.purchase_date).localeCompare(String(a.purchase_date)));
  const header = 'id,user_id,purchase_date,total_amount,payment_method';
  const lines = rows.map((r) => `${r.id},${r.user_id},${r.purchase_date},${Number(r.total_amount || 0)},${(r.payment_method || 'Demo').replaceAll(',', ' ')}`);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=revenue.csv');
  return res.send(`${header}\n${lines.join('\n')}\n`);
});

app.get('/api/books', requireLogin, (req, res) => {
  const category = String(req.query.category || '').trim();
  const genre = String(req.query.genre || '').trim().toLowerCase();
  const search = String(req.query.search || '').trim().toLowerCase();

  let rows = getBooks();
  if (category) rows = rows.filter((b) => String(b.category || '') === category);
  if (genre) rows = rows.filter((b) => String(b.genre || '').toLowerCase().includes(genre));
  if (search) rows = rows.filter((b) => [b.title, b.author, b.description].some((x) => String(x || '').toLowerCase().includes(search)));

  return res.json(rows);
});

app.get('/api/books/:id', requireLogin, (req, res) => {
  const id = Number(req.params.id || 0);
  const book = getBooks().find((b) => Number(b.id) === id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  return res.json(book);
});

app.get('/api/games', requireLogin, (_req, res) => {
  return res.json(getGames());
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Archive Arcade JS app running on http://0.0.0.0:${PORT}`);
});
