$(function(){

    //注册
    $(".sign-up-htm #register").on("click",function(){
        var uname=$('#username').val();
        var pwd=$('#password').val();
        var repwd=$('#apassword').val();
        if(uname==""   ||  uname==null  ||  pwd==""   ||  pwd==null){
            alert("用户名或密码不能为空");
            return;
        }
        if( pwd!=repwd){
            alert("输入的两次密码不能为空");
            return;
        }
        //通过ajax提交请求
        $.ajax({
            type:'post',
            url:'/api/user/register',
            data:{
                username:$('#username').val(),
                password:$('#password').val()
            },
            dataType:'json',
            success:function(result){
                if(result.code==2){
                    //注册成功
                   alert("注册成功");
                }else{
                    $('#warning1').html(result.message).css("color","red");
                }
            },
        });
    });

    //登录
    $(".sign-in-htm #login").on("click",function(){
        var uname=$('#uname').val();
        var pwd=$('#pass').val();
        if(uname==""   ||  uname==null  ||  pwd==""   ||  pwd==null){
            alert("用户名或密码不能为空");
            return;
        }
        //通过ajax提交请求
        $.ajax({
            type:'post',
            url:'/api/user/login',
            data:{
                username:$('#uname').val(),
                password:$('#pass').val()
            },
            dataType:'json',
            success:function(result){
               if(result.code==2){
                   //跳转页面
                    location.href="http://127.0.0.1";
                }else{
                   $('#warning2').html(result.message).css("color","red");
               }
            }
        });
    });

})