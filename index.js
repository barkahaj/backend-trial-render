const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let posts = require('./posts.json');
let clients = [];

// GET all posts
app.get('/posts', (req, res) => {
  res.json(posts);
});

// POST a new blog post
app.post('/posts', (req, res) => {
  const newPost = {
    id: Date.now(),
    title: req.body.title,
    content: req.body.content
  };
  posts.push(newPost);
  fs.writeFileSync('./posts.json', JSON.stringify(posts, null, 2));
  res.status(201).json(newPost);
  broadcastPosts(); // 🔔 send update to all SSE clients
});

// DELETE a blog post
app.delete('/posts/:id', (req, res) => {
  const postId = Number(req.params.id);
  const index = posts.findIndex(post => post.id === postId);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }
  posts.splice(index, 1);
  fs.writeFileSync('./posts.json', JSON.stringify(posts, null, 2));
  res.status(200).json({ message: 'Post deleted' });
  broadcastPosts(); // 🔔 send update to all SSE clients
});

// SSE endpoint
app.get('/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();
  clients.push(res);

  // Remove client on close
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// Broadcast to all connected clients
function broadcastPosts() {
  const data = `data: ${JSON.stringify(posts)}\n\n`;
  clients.forEach(client => client.write(data));
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
