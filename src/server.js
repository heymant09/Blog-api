import express from 'express';
import { config } from 'dotenv';
import { readPosts, writePosts } from './fileHandler.js';
import jwt from 'jsonwebtoken'; // jwt for authentication
import Joi from 'joi'; // Joi for input validation
const SECRET_KEY = '12345'; // move to .env later
const users = [{username: 'admin' , password: 'pass'}]; // dummy for now

const app = express();
config(); // or require('dotenv').config();

// middleware to pass json requests which are being used in req.body etc - 
// without this we would have to pass parameteres in query strings or URL paramters 
app.use(express.json());
app.use(express.static('public'));


app.post('/login',(req,res)=>{
        const {username,password} = req.body;
        const user = users.find( u => u.username === username && u.password === password);
        if(user){
                const token = jwt.sign({username},SECRET_KEY,{expiresIn: '1h'});
                res.json({token});
        }
        else{
                res.status(401).send("Invalid Credentials");
        }
});
// defining Authentication middleware
const authMiddleware = (req,res,next)=>{
        const token = req.headers['authorization']?.split(' ')[1];
        if(!token) return res.status(401).send('No token');
        try{
                jwt.verify(token, SECRET_KEY);
                next();
        }
        catch (error){
                res.status(403).send("Invalid token");
        }
};

// Defining a validation schema
const validate_post = (req, res, next) => {
        const schema = Joi.object({
                title: Joi.string().min(1).required().message('Title is required'), // Means title must be string, minimum 1 char long and is mandatory
                content: Joi.string().min(1).required().message("Content is required")
        });
        const {error} = schema.validate(req.body);
        if(error) return res.status(400).json({ errors: error.details.map(e => e.message) });
        // else 
        next();
}
// but we can also use Express validator

// get all posts
app.get('/posts', async (req, res) => {
        const data = await readPosts();
        res.json(data.posts)
});

// get a single post by id
app.get('/posts/:id', async (req,res) =>{
        const data = await readPosts();
        const post = data.posts.find(p => p.id == req.params.id);
        if(post){

                res.json(post);
        }
        else{
                res.status(404).send("No post with given Id found");
        }
});

// create a new post
app.post('/posts', authMiddleware, validate_post, async (req,res) =>{
        // incase no error from schema then create a new post
        const data = await readPosts();
        const newPost = {
                id: data.posts.length +1,
                title: req.body.title,
                content: req.body.content,
                date: new Date().toISOString()
        };
        data.posts.push(newPost);
        await writePosts(data);
        res.status(201).json(newPost);
});

// Update a post
app.put('/posts/:id', authMiddleware, validate_post, async (req, res)=>{        
        const data = await readPosts();
        const postIndex = data.posts.findIndex(p => p.id == req.params.id);
        if(postIndex != -1){
                data.posts[postIndex] = {
                        ...data.posts[postIndex],
                        title: req.body.title || data.posts[postIndex].title,
                        content: req.body.content || data.posts[postIndex].content,
                };
                await writePosts(data);
                res.json(data.posts[postIndex]);
        }
        else{
                res.status(404).send("Post not found");
        }
});

// Delete a post
app.delete('/posts/:id', authMiddleware, async (req, res)=>{
        const data = await readPosts();
        const newPosts = data.posts.filter(p=> p.id != req.params.id); // This will create a list of all the posts with id not equal to id

        if(newPosts.length < data.posts.length){
                data.posts = newPosts;
                await writePosts(data);
                res.send("Post deleted");
        }
        else{
                res.status(404).send("Post not found");
        }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', ()=>{
        console.log(`Server is running on port ${PORT}`);
});