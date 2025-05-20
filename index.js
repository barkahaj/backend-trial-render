const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // serve uploaded images

// Ensure uploads folder exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// File upload config
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (_, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

let posts = require('./posts.json');

// SSE clients array
const clients = [];

// Helper to send events to all connected clients
function sendEventToAll(data) {
  const eventData = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => client.res.write(eventData));
}

// SSE endpoint
app.get('/events', (req, res) => {
  // Set headers for SSE
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  // Send initial comment to keep connection alive in some proxies
  res.write(': connected\n\n');

  // Add this client to the list
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  // Send initial full posts data on connect
  res.write(`data: ${JSON.stringify(posts)}\n\n`);

  // Remove client when connection closes
  req.on('close', () => {
    const index = clients.findIndex(c => c.id === clientId);
    if (index !== -1) clients.splice(index, 1);
  });
});

// GET posts
app.get('/posts', (req, res) => {
  res.json(posts);
});

// POST with image
app.post('/posts', upload.single('image'), (req, res) => {
  const { title, content } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const newPost = {
    id: Date.now(),
    title,
    content,
    image: imageUrl
  };

  posts.push(newPost);
  fs.writeFileSync('./posts.json', JSON.stringify(posts, null, 2));

  // Notify all SSE clients about new post
  sendEventToAll(posts);

  res.status(201).json(newPost);
});

// DELETE
app.delete('/posts/:id', (req, res) => {
  const postId = Number(req.params.id);
  posts = posts.filter(p => p.id !== postId);
  fs.writeFileSync('./posts.json', JSON.stringify(posts, null, 2));

  // Notify all SSE clients about updated posts
  sendEventToAll(posts);

  res.status(200).json({ message: 'Post deleted' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
