var express=require("express");
var mysql=require("mysql");
var bodyParser=require("body-parser");
var multer=require("multer");
var fs=require('fs'); //文件操作


var app=express();
var pool=mysql.createPool({
    host:"127.0.0.1",
    port:3306,
    database:"blogs",
    user:"root",
    password:"a"
});
var upload=multer({dest:"./public/photo"});
//路由操作，第一步，加载路由

var router=express.Router();

router.use(function(req,res,next){
    //console.log(req.session.userInfo);
    if( req.session.userInfo==null || req.session.userInfo==undefined || req.session.userInfo.isAdmin==0 ){
        res.send("<script>alert('非法操作,请先登录');location.href='http://127.0.0.1/'</script>");
        return;
    }
    next();
});

//第二步，处理请求
router.get("/",function(req,res){
    res.render("admin/enter",{
        userInfo:req.session.userInfo
    });

});

//用户首页请求
router.get("/user",function(req,res){
    var page=Number( req.query.page || 1 );
    var size=6;
    pool.getConnection(function(err,conn){
        conn.query("select * from user order by uid",function(err,result){
            if(err){
                console.log(err);
            }
            var count=result.length;
            var pages=Math.ceil( count/size );
            page=Math.min(page,pages);
            page=Math.max(page,1);
            var beginSize=(page-1)*size;

            //开始分页查询
            conn.query("select * from  user order by uid limit ?,?",[beginSize,size],function(err,result2){
                //释放链接
                conn.release();
                res.render("admin/user",{
                    userInfo:req.session.userInfo,
                    users:result2,
                    tag:"user",
                    page:page,
                    pages:pages,
                    size:size,
                    count:count
                });
            });
        });
    });
});


//分类首页请求
router.get("/kind",function(req,res){
    var page=Number( req.query.page || 1 );
    var size=6;
    pool.getConnection(function(err,conn){
        conn.query("select * from type order by tid",function(err,result){
            if(err){
                console.log(err);
            }
            var count=result.length;
            var pages=Math.ceil( count/size );
            page=Math.min(page,pages);
            page=Math.max(page,1);
            var beginSize=(page-1)*size;

            //开始分页查询
            conn.query("select * from  type order by tid limit ?,?",[beginSize,size],function(err,result2){
                //释放链接
                conn.release();
                res.render("admin/kindFirst",{
                    userInfo:req.session.userInfo,
                    types:result2,
                    tag:"kind",
                    page:page,
                    pages:pages,
                    size:size,
                    count:count
                });
            });
        });
    });
});

//添加分类
var msg={
    code:-1,
    message:""
};
//渲染请求
router.get("/kind/add",function(req,res){
    res.render("admin/kindAdd",{
        userInfo:req.session.userInfo,
    })
});
router.post("/kind/add",function(req,res){
    var tname=req.body.tname;
    pool.getConnection(function(err,conn){
        conn.query("insert into type values(0,?)",[tname],function(err,result){
            conn.release();
            if(err){
                console.log(err);
                msg.code=0;
                msg.message="类型名不能重复";
                res.json(msg);
            }else{
                msg.code=1;
                msg.message="添加成功";
                res.json(msg);
            }
        });
    });
});

//修改分类类型
router.post("/kind/edit",function(req,res){
    var tid=req.body.tid;
    var tname=req.body.tname;
    pool.getConnection(function(err,conn){
        conn.query("update type set tname=? where tid=?",[tname,tid],function(err,result){
            conn.release();
            if(err){
                console.log(err);
            }else if(result.affectedRows>0){
                res.send("1");
            }else{
                res.send("0");
            }
        });
    });
});

//删除分类类型
router.post("/kind/del",function(req,res){
    pool.getConnection(function(err,conn){
        var tid=req.body.tid;
        var flag=false;
        conn.query("select * from contents where tid=?",[tid],function(err,resu){
            if(err){
                console.log(err);
            }else if(resu.length>0){
                //意味着这个tid在contents有数据，不能删除
                //这个时候，想要删除，那么，就要所有的内容为tid的数据，转换为首页的数据
                conn.query("update contents set tid=1 where tid=?",[tid],function(err,re){
                    conn.query("delete from type where tid=?",[tid],function(err,result){
                        conn.release();
                        if(err){
                            console.log(err);
                            res.send("0");
                        }else if(result.affectedRows>0){        //affectedRows  受影响的行
                            res.send("1");
                        }else{
                            res.send("0");
                        }
                    });
                });
            }else{
                conn.query("update contents set tid=1 where tid=?",[tid],function(err,result){
                    conn.release();
                    if(err){
                        console.log(err);
                        res.send("0");
                    }else if(result.affectedRows>0){
                        res.send("1");
                    }else{
                        res.send("0");
                    }
                });
            }
        });
        //要删除，可以，但是这个数据，不能在contents里面
    });
});

//内容首页请求
router.get("/content",function(req,res){
    var page=Number( req.query.page || 1 );
    var size=6;
    pool.getConnection(function(err,conn){
        conn.query("select * from contents",function(err,result){
            if(err){
                console.log(err);
            }
            var count=result.length;
            var pages=Math.ceil( count/size );
            page=Math.min(page,pages);
            page=Math.max(page,1);
            var beginSize=(page-1)*size;

            //开始分页查询
            conn.query("select c.*,t.tname,u.uname from contents c,type t,user u where c.tid=t.tid and c.uid=u.uid order by cid limit ?,?",[beginSize,size],function(err,result2){
                //释放链接
                conn.release();
                res.render("admin/contentFirst",{
                    userInfo:req.session.userInfo,
                    contents:result2,
                    tag:"content",
                    page:page,
                    pages:pages,
                    size:size,
                    count:count
                });
            });
        });
    });
});


//添加内容
router.get("/content/add",function(req,res){
    pool.getConnection(function(err,conn){
        conn.query("select * from type order by tid",function(err,result){
            res.render("admin/contentAdd",{
                userInfo:req.session.userInfo,
                types:result
            });
        });
    });
});
router.post("/content/add",upload.array("photo"),function(req,res){
    //剩下的数据，都是通过form表单提交的，所以用body
    var tid=Number(req.body.category);      //form表单提交，键都是name
    var title=req.body.title;
    var addDay=req.body.addDay;
    var addMonth=req.body.addMonth;
    var des=req.body.description;
    var content=req.body.content;
    pool.getConnection(function(err,conn){
        if(err){
            console.log(err);
        }else{
            //先处理图片路径
            var fileName="" ;
            var filePath="";
            var file;
            var str=__dirname;
            var dirname=str.split("router")[0];
            for(var i=0;i<req.files.length;i++){
                //得到文件
                file=req.files[i];
                //为了图片不重名，改为时间格式
                fileName=new Date().getTime()+"_"+file.originalname;           //12345678812456_xx.jpg
                //重命名
                fs.renameSync(file.path,dirname+"public/photo/"+fileName);
                //累加名字
                filePath+="public/photo/"+fileName;
            }
            conn.query("insert into contents values(0,?,?,?,?,?,?,?,0,?)",
                [tid,req.session.userInfo.uid,title,addDay,addMonth,des,content,filePath],function(err,result){
                    conn.release();
                    if(err){
                        res.send("0");
                    } else{
                        res.send("1");
                    }
            });
        }
    });
});


//修改内容
router.get("/content/edit",function(req,res){
    var cid=req.query.cid;
    pool.getConnection(function(err,conn){
        conn.query("select * from type order by tid",function(err,resu){
            conn.query("select c.*,t.tname from contents c,type t where c.tid=t.tid and c.cid=?",[cid],function(err,result){
                conn.release();
                if(err){
                    console.log(err);
                }
                res.render("admin/contentEdit",{
                    userInfo:req.session.userInfo,
                    content:result[0],
                    types:resu
                });
            });
        });
    });
});
//修改
router.post("/content/edit",function(req,res){
    //这个数据是在网页上面的，所以要用query
    var cid=Number(req.query.cid);
    //剩下的数据，都是通过form表单提交的，所以用body
    var tid=Number(req.body.category);      //form表单提交，键都是name
    var title=req.body.title;
    var des=req.body.description;
    var content=req.body.content;

    pool.getConnection(function(err,conn){
        conn.query("update contents set tid=?,title=?,description=?,content=? where cid=?",
            [tid,title,des,content,cid],function(err,result){
                conn.release();
                if(err){
                    console.log(err);
                }
                res.send("<script>alert('修改成功');location.href='./';</script>");
            });
    });
});


router.post("/content/del",function(req,res){
    var cid=req.body.cid;
    pool.getConnection(function(err,conn){
        conn.query("delete from contents where cid=?",[cid],function(err,result){
            if(err){
                console.log(err);
            }
            if(result.affectedRows>0){
                res.send("1");
            }else{
                res.send("0");
            }
        });
    });
});


//第三步，将这个支线模块，加载到主模块里面去
module.exports=router;


