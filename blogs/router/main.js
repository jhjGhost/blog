var express=require("express");
var mysql=require("mysql");

var pool=mysql.createPool({
    host:"127.0.0.1",
    port:3306,
    database:"blogs",
    user:"root",
    password:"a"
});
//路由操作，第一步，加载路由
var router=express.Router();



//加载main.js的时候，我们就必定是首页的内容，而首页里面的内容，绝对要分类
var alltype;
router.use(function(req,res,next){
    pool.getConnection(function(err,conn){
        conn.query("select * from type order by tid",function(err,result){
            conn.release();
            alltype=result;
            //一定要执行next
            next();     //next指继续往下执行，让程序查完sql语句之后，继续往下执行
        });
    });
});


router.get("/",function(req,res){   //分页查找
    //console.log(req.query);
    //如果req.query.page有值，则req.query.page。否则为1
    var page=Number( req.query.page || 1 );     //当前的页数，默认第一页
    var mytype=Number( req.query.mytype || 1 );     //当前的类型，默认1 代表首页

    pool.getConnection(function(err,conn){

        //我们现在需要同时查两个东西     所有的文章类型  所有的文章内容
        //绝对不能再释放连接之后再去查找
        if(mytype==1){
            var sql1="select c.*,t.tname,u.uname from contents c,type t,user u where c.tid=t.tid and c.uid=u.uid";
        }else{
            var sql1="select c.*,t.tname,u.uname from contents c,type t,user u where c.tid=t.tid and c.uid=u.uid and c.tid="+mytype;
        }
        conn.query(sql1,function(err2,result2){
            //记录总条数
            var count=result2.length;
            //我们规定，一次默认分6条数据
            var size=3;
            //计算总页数
            var pages=Math.ceil( count/size );
            //控制页数
            page=Math.min(page,pages);
            page=Math.max(page,1);

            //开始的条数
            var beginSize=(page-1)*size;

            //分页查找
            if(mytype==1){
                var sql2="select c.*,t.tname,u.uname from contents c,type t,user u where c.tid=t.tid and c.uid=u.uid limit ?,?";
            }else{
                var sql2="select c.*,t.tname,u.uname from contents c,type t,user u where c.tid=t.tid and c.uid=u.uid and c.tid="+mytype+" limit ?,?";
            }
            conn.query(sql2,[beginSize,size],function(err2,result2){
                conn.release();
                //现在，数据有了result 问题是如何将这个数据，传到网页上去
                //网页路径  传到这个网页的模板引擎的参数
                res.render("main/index",{
                    types:alltype,
                    contents:result2,
                    page:page,
                    pages:pages,
                    size:size,
                    count:count,
                    mytype:mytype,
                    userInfo:req.session.userInfo
                });
            });
        });
    });

});


//查看文章详情
//查看文章详情
router.get("/view",function(req,res){
    var cid=req.query.cid;
    var mytype=Number( req.query.mytype || 1 );  //当前的类型，默认1 代表首页
    pool.getConnection(function(err,conn){
        conn.query("select c.*,t.tname,u.uname from contents c,type t,user u where c.tid=t.tid and c.uid=u.uid and c.cid=?",
            [cid],function(err,result){
            conn.release();
            if(err){
                console.log(err);
            }else{
                res.render("main/view",{
                    types:alltype,
                    mytype:mytype,
                    content:result,
                    userInfo:req.session.userInfo           //取session
                });
            }
        });
    });
})

//第三步，将这个支线模块，加载到主模块里面去
module.exports=router;


