const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let posts = require('./posts.json');

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
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// DELETE a post by ID
app.delete('/posts/:id', (req, res) => {
  const postId = Number(req.params.id);
  const index = posts.findIndex(post => post.id === postId);

  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  posts.splice(index, 1); // remove from memory
  fs.writeFileSync('./posts.json', JSON.stringify(posts, null, 2)); // persist change
  res.status(200).json({ message: 'Post deleted' });
});

