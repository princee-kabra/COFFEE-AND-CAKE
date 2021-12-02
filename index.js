const express=require("express");
const app=express()
const path=require('path');
const morgan = require('morgan');
const {Pool} =require('pg');
const pg =require('pg');
const session=require('express-session');
const flash=require('connect-flash')
const fileUpload=require('express-fileupload');
require('dotenv').config();
let pool=new Pool();
const port = process.env.PORT;

const {v4:uuid}=require('uuid');
uuid();
/*app.get('/',(req,res) => {
    res.send("homepage")
})
app.get('/r/:subreddit/:postId',(req,res) =>{
	const { subreddit,postId } = req.params;
	res.send(`<h1>Viewing Post ID: ${postId} Browsing the ${subreddit} </h1>`)
}) 

app.get('/cats',(req,res) =>{
	res.send("MEOW")
})*/
const sessionOptions={secret:'thisisnotagoodsecret',resave:false,saveUninitialized:false}
//app.use(session({secret :'thisisnotagoodsecret'}));
app.use(session(sessionOptions));
app.use(flash());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended:true}))
app.use(express.json())
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'/views'))
app.use(fileUpload());
app.use('/public', express.static('public'))

app.get('/info/get',(req,res) =>{
	try{
	pool.connect(async(error,client,release) =>{
    let resp=await client.query('SELECT * FROM test');
    res.send(resp.rows);
})
}
catch(error){
	console.log(error);
}
});
const comments=[
{   id:uuid(),
	username:'Todd',
	comments:'lol'
},
{   id:uuid(),
	username:'sky',
	comments:'plz'
}
]
app.get('/comments',(req,res) =>{
	res.render('comments/index',{comments});
})
app.get('/comments/new',(req,res) =>{
	res.render('comments/new');
})
app.get('/comments/:id',(req,res) =>{
	const {id} =req.params;
	const com=comments.find(c => c.id === id);
res.render('comments/show',{com})
})
app.post('/comments',(req,res)=>{
const {username,comment}=req.body;
comments.push({username,comment,id:uuid()})
	//res.send('works');
	res.redirect('/comments');
})
app.get('/',(req,res) =>{
	let k;
	if(req.session.loggedinuser){
        k=1;
	}
	else{
		k=0;
	}
	res.render('cafe/index.ejs',{k})
})
app.get('/logout',(req,res)=>{
	req.session.loggedinuser=null;
	res.redirect('/')
})
app.get('/login',(req,res) =>{
	res.render('cafe/login.ejs',{messages:req.flash('success'),error:req.flash('error')})
})
app.post("/login", function (req, res) {
    let f=0;
    let m=0;
    const { nname, email, pass1, pass2 } = req.body;
    try {
            pool.connect(async function (err, client, release) {
            if(pass1===pass2)
            {    
                let resp1 = await client.query(`SELECT nname FROM login`);
                for(let i=0;i<resp1.rows.length;i++)
                {
                    if(resp1.rows[i].nname===nname)
                    {
                        f=1;
                        req.flash("error","Username already taken.")
                        res.redirect("/login");
                        break;
                    }
                }
                let resp2 = await client.query(`SELECT email FROM login`);
                if(f===0)
                {
                    for(let i=0;i<resp2.rows.length;i++)
                    {
                        if(resp2.rows[i].email===email)
                        {
                            m=1;
                            req.flash("error","Email address already used by some other user.")
                            res.redirect("/login");
                            break;
                        }
                    }
                }
                if(f===0 && m===0)
                {
                    let resp3 = await client.query(`INSERT INTO login VALUES('${nname}','${email}','${pass1}','${pass2}')`);
                                     req.flash("success","Your account has been created successfully")

                                    res.redirect("/login")
                }
            }  
            else
            {
                req.flash("error","Password does not match.")
                res.redirect("/login")
            }
        })
    }
    catch (err) {
        console.log(err);
    }
})
app.get('/aboutus',(req,res) =>{
	res.render('cafe/about.ejs')
})
app.get('/must',(req,res) =>{
	res.render('cafe/must.ejs')
})
app.get('/reserve',(req,res) =>{
	res.render('cafe/reserve.ejs',{messages:req.flash('success')})
})
app.post('/reserve',(req,res) =>{
    const {nname,dat,time,mem,adult,children,email,phone}=req.body;
    console.log(time);
	try{
    pool.connect(async(error,client,release) =>{

	let resp = await client.query(`INSERT INTO reserve VALUES('${nname}','${dat}','${time}','${mem}','${adult}','${children}','${email}','${phone}')`);
		req.flash('success','Your seats are reserved.Grinded and Baked things are waiting for you!');
	res.redirect('reserve')
})}
catch(err)
{
    console.log(err);}
})
app.get('/log',(req,res) =>{
	res.render('cafe/log.ejs',{error:req.flash('error')})
})

app.post('/log',(req,res) =>{
 const {email,pass}=req.body;
 try{
 	pool.connect(async(error,client,release) =>{
 		let es=await client.query(`SELECT * from login where email='${email}'`);
        if(es.rows.length >0){
 		let re=await client.query(`SELECT pass1 from login where email='${email}'`);
 		           // console.log(re.rows[0].pass1); 			

 		if(re.rows[0].pass1===pass){
             req.session.loggedinuser=es.rows[0].nname;
             console.log(req.session.loggedinuser);
 			res.redirect('/')
 		}
 		else{
 	      req.flash("error","Oops!Password do not match")
 	             res.redirect('/log')

 		}
        }
        else{
       req.flash("error","Invalid Email");
       res.redirect('/log')

        }
 	})
 }
catch(err){
	    console.log(err);}


})
app.get('/random',(req,res) =>{
	const cats=[
       'jmi','roberson','winston'
	]
	res.render('random',{cats:cats})
})




app.listen(3000,() => {
	console.log("LISTENING ON PORT 3000!")
})






