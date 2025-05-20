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
  res.status(201).json(newPost);
});

// DELETE
app.delete('/posts/:id', (req, res) => {
  const postId = Number(req.params.id);
  posts = posts.filter(p => p.id !== postId);
  fs.writeFileSync('./posts.json', JSON.stringify(posts, null, 2));
  res.status(200).json({ message: 'Post deleted' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
