let token = null; // Store the JWT token here

// Load posts only if logged in
window.onload = () => {
  if (token) loadPosts(); // If token exists (e.g., from a previous session), load posts
};

// Login function
async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  if (!username || !password) {
    alert('Please enter both username and password');
    return;
  }

  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (response.ok) {
    const data = await response.json();
    token = data.token; // Store the token
    document.getElementById('login').style.display = 'none'; // Hide login form
    document.getElementById('post-form').style.display = 'block'; // Show post form
    loadPosts(); // Load posts after login
  } else {
    alert('Login failed—check your credentials');
  }
}

// Load posts with token
async function loadPosts() {
  if (!token) {
    alert('Please log in first');
    return;
  }

  const response = await fetch('/posts', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (response.ok) {
    const posts = await response.json();
    const postsDiv = document.getElementById('posts');
    postsDiv.innerHTML = '';
    posts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.className = 'post';
      postDiv.innerHTML = `
        <h2>${post.title}</h2>
        <p>${post.content}</p>
        <small>${post.date}</small>
        <button onclick="editPost(${post.id})">Edit</button>
        <button onclick="deletePost(${post.id})">Delete</button>
      `;
      postsDiv.appendChild(postDiv);
    });
  } else {
    alert('Failed to load posts—please log in again');
    token = null; // Clear token if it’s invalid
    document.getElementById('login').style.display = 'block';
    document.getElementById('post-form').style.display = 'none';
  }
}

// Create a post with token
async function createPost() {
  if (!token) {
    alert('Please log in first');
    return;
  }

  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;

  const response = await fetch('/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, content })
  });

  if (response.ok) {
    document.getElementById('title').value = '';
    document.getElementById('content').value = '';
    loadPosts();
  } else {
    const errorData = await response.json();
    alert('Error: ' + errorData.errors?.join(', ') || 'Something went wrong');
  }
}

// Edit a post with token
async function editPost(id) {
  if (!token) {
    alert('Please log in first');
    return;
  }

  const title = prompt('New title:');
  const content = prompt('New content:');
  if (title || content) {
    const response = await fetch(`/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content })
    });
    if (response.ok) {
      loadPosts();
    } else {
      alert('Failed to update post');
    }
  }
}

// Delete a post with token
async function deletePost(id) {
  if (!token) {
    alert('Please log in first');
    return;
  }

  if (confirm('Delete this post?')) {
    const response = await fetch(`/posts/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      loadPosts();
    } else {
      alert('Failed to delete post');
    }
  }
}