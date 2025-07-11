const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const {body,validationResult} = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');


app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());


app.get('/', (req,res) => {
    res.render("home");
});

app.get('/register',(req,res) => {
    res.render("register");
});

app.post('/register', 
    body("username").trim().isLength({min: 3}),
    body("email").trim().isLength({min: 13}),
    body("password").trim().isLength({min: 5}),

    async (req,res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            res.status(400).json({
                errors: errors.array(),
                message: "Invalid data",
            })
        }

        const {username,email,password} = req.body;

        const user = await userModel.findOne({email})
        if(user) return res.status(400).send("User is already registered")

        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            username,
            email,
            password: hashPassword,
        });

        res.redirect('/login');
    }
);

app.get('/login',(req,res) => {
    res.render("login");
});

app.post('/login', 
    body("email").trim().isLength({min: 13}),
    body("password").trim().isLength({min: 5}),

    async (req,res) => {
        const errors = validationResult(req);

        if(!errors.isEmpty()){
            return res.status(400).json({
                error: errors.array,
                message: "Invalid data",
            })
        }

        const {email,password} = req.body;

        const user = await userModel.findOne({email});

        if(!user) {
            res.status(400).json({
                message: "No such account exists ! Register yourself first"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            res.status(400).json({
                message: "Username or password is incorrect",
            })
        }

        const token = jwt.sign({
            userId: user._id,
            email: user.email,
            username: user.username,
        },
        "shhhh"
    );

        res.cookie("token",token);
        res.redirect("/profile")
    }
);

app.get('/logout', (req,res) => {
    res.cookie("token","");
    res.redirect('/login')
});

app.get('/profile',isLoggedIn, async (req,res) => {
    
    let user = await userModel.findOne({email: req.user.email}).populate("posts");
    res.render("profile",{user});
});

app.post('/post', isLoggedIn , async (req,res) => {
    const user = await userModel.findOne({email: req.user.email});
    const {content,title} = req.body;
    let post = await postModel.create({
        user: user._id,
        content,
        title,
    });

    user.posts.push(post._id);
    await user.save();
    
    
})

function isLoggedIn(req,res,next){
    if(req.cookies.token === "") return res.status(400).redirect('/login');
        else {
            let data = jwt.verify(req.cookies.token,"shhhh");
            req.user = data;
            next();
        }
};  

app.get('/like/:id', isLoggedIn , async (req,res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    if(post.likes.indexOf(req.user.userId) === -1 ){
        post.likes.push(req.user.userId)
    } else {
        post.likes.splice(post.likes.indexOf(req.user.userId),1);
    }
    await post.save();
    res.redirect("/profile")
});

app.get('/edit/:id', isLoggedIn , async (req,res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    
    res.render("edit",{post})
});

app.post('/update/:id', isLoggedIn , async (req,res) => {
    let post = await postModel.findOneAndUpdate({_id: req.params.id},{content: req.body.content});
    
    res.redirect("/profile");
});

app.get('/post/:id', isLoggedIn , async (req,res) => {
    let post = await postModel.findOne({_id: req.params.id});
    
    res.render("userPost",{post});
});



app.listen(3000,function(){
    console.log(`Server is running at http://localhost:3000`);
});