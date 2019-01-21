var express=require('express');
var cookieParser=require("cookie-parser");
var bodyParser=require("body-parser");
var session=require('express-session'); //session模块
var mysql=require("mysql"); //数据库模块
var fs=require('fs'); //文件操作
//引入模板引擎    模板引擎是前端的一个划时代的技术点，有了它，拼字符串的日子不复存在
var swig=require('swig');


var app=express(); //创建web应用程序

//session的使用配置
app.use(session({
    secret:'keyboard cat',
    resave:true,
    saveUninitialized:true,
    cookie:{maxAge:1000*60}     //最大时间为60秒
}));

//配置swig
app.engine("html",swig.renderFile);     //模板引擎的名称，用来强调后缀名   解析模板引擎的方法
app.set("views","./view");               //第一个参数固定，值设置模板引的网页在哪里     页面位置
app.set("view engine","html");          //注册引擎 可以开始使用了
swig.setDefaults({cache:false});        //关闭缓存


app.use("/public",express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));

var pool=mysql.createPool({     //数据连接池
    host:'127.0.0.1',
    port:3306,
    database:'blogs',
    user:'root',
    password:'a'
});

//路由：考虑到把所有的业务请求，写在一个server.js里面，这个文件的逻辑就会比较混乱，也比较难找
//所以，我们可以将一些功能类似的，放在一个模块里面，然后，让这个模块，搭建在主模块里面
//这样就相当于，一个主模块，分支了很多支线模块
//app.get("/",function(req,res){
//    res.sendFile();
//});
app.use("/",require("./router/main"));   //所有的主模块，都在这里
app.use("/admin",require("./router/admin")); //所有的后台模块，都在这里
app.use("/api",require("./router/api"));   //登录模块


app.listen(80,"127.0.0.1",function(err){
    if(err){
        console.log(err);
    }else{
        console.log("服务器启动成功");
    }
});

