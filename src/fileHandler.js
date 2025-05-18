import fs from 'fs/promises'; // Import
// const fs = require('fs').promises

async function readPosts(){
        try{
        const data = await fs.readFile('posts.json','utf-8');
        return JSON.parse(data); // Suppose this returns { posts: [...] }
        }
        catch(error){
                console.error("Error reading posts",error);
                return {posts:[]};
        }
}

async function writePosts(posts){
        try{
                await fs.writeFile('posts.json', JSON.stringify(posts, null, 2));
        }
        catch(error){
                console.error("Error writing posts", error);
                throw error;
        }
}

export { readPosts, writePosts};