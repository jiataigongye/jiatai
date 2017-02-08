/**
 * Created by mooshroom on 2016/9/7.
 */
/*………………………………………………………………………………………………全局配置………………………………………………………………………………………………*/
//var apiURL = 'jtgy.saas.tansuyun.cn?i=';
var apiURL = 'http://jtgy.saas.tansuyun.cn/index.php?i='


/*………………………………………………………………………………………………index的视图模型………………………………………………………………………………………………*/
require([
    'avalon',
    'mmRequest',
    'text!../../nav.json',
    '../../lib/pop/popAlert.js',
    '../../plugins/cache/cloudCache.js',
    '../../plugins/Gate/Gate.js',
    '../../lib/picChange/picChange.js'
], function (avalon, mmRequest, nav, popAlert, cc) {
    //定义顶级视图模型
    var vm = avalon.define({
        $id: "index",
        ready: function () {

            require(['../../plugins/Gate/Gate'], function () {
                window.cc = new cc('JTID')
                //导航获取
                window.cc.Get('nav', function (res) {
                    vm.NavF = res
                    start()
                })

            })


            function start() {

                //门禁系统的配置
                window.Gate = newGate({
                    autoLoginAPI: "User/User/autoLogin",
                    haveLogin: function (res) {
                        console.log(1111)
                    },
                    notLogin: function (res) {
                        console.log(222)

                    },
                })


                //构建路由
                require([
                    "mmRouter",
                ], function () {
                    avalon.router.get("/", function () {
                        goto('#!/Home/0')
                    });
                    avalon.router.error(function () {
                        try {
                            window.location.href = 'index.html';
                        } catch (err) {
                        }
                    })
                    var navList = JSON.parse(nav).nav;
                    //构建导航的路由
                    getMap(navList);
                    console.log("路由构建完毕")
                    //开始监听
                    avalon.history.start();
                    //vm.toggleSide(0)
                    avalon.scan();
                    vm.uid = cache.go('UID')
                    vm.un = cache.go('UN')
                    vm.G = addUp(String(cache.go('G')).split(','))
                })
            }


        },
        reset: function () {
        },
        showMap:false,


        //当前用户的信息
        admin: false,
        uid: "",
        un: "",
        G: "",
        g: "", //用户切换页面标记
        //切换到后台的时候调用的方法
        toggleSide: function (i) {
            switch (i) {
                case 0:
                    //跳转到前台
                    vm.nav = vm.NavF
                    window.location.href = '#!/MemberList/0'
                    vm.g = 1
                    break
                case 1:
                    //跳转到后台
                    vm.nav = vm.NavB
                    window.location.href = '#!/CoachList/0'
                    vm.g = 2
                    break
            }
        },
        //登出
        logout: function () {
            $$.call({
                    i: 'User/logout',
                    data: {},
                    success: function (res) {
                        window.location.href = "#!/Login/0"
                        Gate.reset()
                        index.uid = ""
                    },
                    err: function (err) {
                        tip.on(err, 1)
                    }
                }
            )
        },
        //jumpToMember:function(){
        //    for(var i = 0; i < vm.G.length; i++){
        //        //if(window.location.href=='#!/CoachList/0'){
        //            if(vm.G[i]==1){
        //                vm.toggleSide(0)
        //                vm.g=1
        //            }
        //        //}
        //    }
        //},
        //jumpToCoach:function(){
        //for(var i = 0; i < vm.G.length; i++) {
        //    //if (window.location.href == '#!/MemberList/0') {
        //        if (vm.G[i] == 2) {
        //            vm.toggleSide(1)
        //            vm.g = 2
        //        //}
        //    }
        //}
        //},

        html: '',
        nowTop: '',

        //导航条
        nav: [{
            name: "",
            en: "",
            href: ""
        }],
        NavF: [],
        NavB: [
            {
                name: "首页设置",
                en: "HomeSetting",
                href: "#!/HomeSetting/0"
            }, {
                name: "文章管理",
                en: "ArticleManage",
                href: '#!/ArticleManage/1',
            }, {
                name: "案例管理",
                en: "CaseManage",
                href: '#!/CaseManage/1'
            },
        ],

        //组件配置
        //提示框配置
        $opta: {
            id: "tip"
        },
//                模态框配置
//        $optb: {
//            id: "modal"
//        },
        //websocket配置
//        $optc: {
//            id: "ws",
//            server: "ws://180.97.81.190:46032",//线上版本
////                    server: "ws://my.s.tansuyun.cn:46080",//测试版本
//            debug: false
//        },
        //进度条配置
        $optd: {
            id: "pb"
        },
        //返回顶部
        //$optTop: {
        //    id: "toTop"
        //},
        //弹出框
        $optpop: {
            id: 'pop',
            width: "960",
        },
        $optpop2: {
            id: 'pop2',
            width: "560",
        },


    })

    //执行开始
    require([
        '../../lib/tip/tip.js',
        '../../lib/progressbar/progressbar.js'
    ], function () {

        avalon.scan();
        vm.ready()

    })

    window.index = vm

    /*………………………………………………………………………………………………路由处理函数………………………………………………………………………………………………*/

    //这个函数用来对用户进行权限控制，未来可能会添加多种限制条件
    function checkLimit(fn, limit) {


        if (cache.go("UnitID") == 23) {
            fn()
        } else {
            tip.on("您的账户没有访问改模块的权限")
            //history.go(-1)
        }

    }

    /*路由*/
    function newRouter(n) {
        var en = n.en;
        n.vm = '../../package/' + en + "/" + en + '.js'
        avalon.router.get('/' + en + '/:i', function (i) {

            //检查权限
            if (n.only > 0) {
                Gate.comeIn({
                    haveLogin: function (res) {
                        //做权限判断
                        loadVM()
                    },
                    notLogin: function () {
                        goto('#!/login/0')
                    }
                })
            } else {
                loadVM()
            }

            function loadVM() {
                //开启进度条
                try {
                    pb.startT()
                } catch (err) {

                }


                //tip.on("正在加载……",1)
                if (n.vm) {
                    require([n.vm], function () {
                        try {
                            avalon.vmodels[en].ready(i)
                        } catch (err) {
                        }

                        index.nowTop = n.bePartOf
                        if (n.front) {
                            vm.nav = vm.NavF
                            vm.g = 1
                        } else {
                            vm.nav = vm.NavB
                            vm.g = 2
                        }
                        //tip.off("正在加载……",1)
                        if (pop.state != 0) {
                            pop.close()
                        }
                        //结束进度条
                        try {
                            pb.endT()
                        } catch (err) {
                        }
                    })
                }
                if (n.fn) {
                    n.fn(i)

                    //结束进度条
                    try {
                        pb.endT()
                    } catch (err) {
                    }
                }

                document.getElementById("title").innerText = n.name
                console.log(n.name + "模块加载完毕")
            }

        });
        console.log(n.name + "路由创建完毕")
    }

    function getMap(nav) {
        console.log("开始构建路由")
        var l = nav
        var ll = l.length
        var lsl;
        for (var i = 0; i < ll; ++i) {
            if (l[i].sub) {
                //有第二级导航
                lsl = l[i].sub.length
                for (var o = 0; o < lsl; ++o) {
                    newRouter(l[i].sub[o])
                }
            }
            else {
                //直接渲染项目
                newRouter(l[i])

            }
        }

    }


})


/*………………………………………………………………………………………………全局函数………………………………………………………………………………………………*/
//跨浏览器事件对象方法
var EventUtil = new Object;
EventUtil.addEventHandler = function (oTarget, sEventType, fnHandler) {
    if (oTarget.addEventListener) {
        oTarget.addEventListener(sEventType, fnHandler, false);
    } else if (oTarget.attachEvent) {
        oTarget.attachEvent("on" + sEventType, fnHandler);
    } else {
        oTarget["on" + sEventType] = fnHandler;
    }
};

EventUtil.removeEventHandler = function (oTarget, sEventType, fnHandler) {
    if (oTarget.removeEventListener) {
        oTarget.removeEventListener(sEventType, fnHandler, false);
    } else if (oTarget.detachEvent) {
        oTarget.detachEvent("on" + sEventType, fnHandler);
    } else {
        oTarget["on" + sEventType] = null;
    }
};

EventUtil.formatEvent = function (oEvent) {
    if (isIE && isWin) {
        oEvent.charCode = (oEvent.type == "keypress") ? oEvent.keyCode : 0;
        oEvent.eventPhase = 2;
        oEvent.isChar = (oEvent.charCode > 0);
        oEvent.pageX = oEvent.clientX + document.body.scrollLeft;
        oEvent.pageY = oEvent.clientY + document.body.scrollTop;
        oEvent.preventDefault = function () {
            this.returnValue = false;
        };

        if (oEvent.type == "mouseout") {
            oEvent.relatedTarget = oEvent.toElement;
        } else if (oEvent.type == "mouseover") {
            oEvent.relatedTarget = oEvent.fromElement;
        }

        oEvent.stopPropagation = function () {
            this.cancelBubble = true;
        };

        oEvent.target = oEvent.srcElement;
        oEvent.time = (new Date).getTime();
    }
    return oEvent;
};

EventUtil.getEvent = function () {
    if (window.event) {
        return this.formatEvent(window.event);
    } else {
        return EventUtil.getEvent.caller.arguments[0];
    }
}

//批量绑定快捷键
function bindK(obj) {
    require(['../../plugins/shortcut/shortcut.js'], function () {
        /*快捷键设置*/

        var x
        for (x in obj) {
            if (x.charAt(0) != "$") {
                if (obj.$opt != undefined) {
                    shortcut.add(x, obj[x], obj.$opt)
                } else {
                    shortcut.add(x, obj[x])
                }

                //console.log(x + "快捷键绑定成功")
            }

        }
    })
}

//批量删除快捷键
function removeK(obj) {
    require(['../../plugins/shortcut/shortcut.js'], function () {
        /*快捷键设置*/

        var x
        for (x in obj) {
            if (x.charAt(0) != "$") {
                shortcut.remove(x)
                //console.log(x + "已解除绑定")
            }

        }
    })
}

//安全相加 把所传入的数组的每一项转化为数值然后相加，返回加的结果
function addUp(arr) {
    var result = 0
    for (var i = 0; i < arr.length; i++) {
        result += Number(arr[i])
    }
    return result
}

//输入框输入限制
function minNumber(el) {
    if (el.value == "" || el.value < 0) {
        el.value = ""
    }
}

/*根据时间戳获取字符串*/
function getDateFromTimestamp(Timestamp) {
    //for (var i = Timestamp.length; i < 13; i++) {
    //    Timestamp += '0';
    //}
    var date = new Date();
    date.setTime(Timestamp);

    var month = (date.getMonth() + 1) + ''
    for (var o = month.length; o < 2; o++) {
        month = '0' + month
    }
    var day = date.getDate() + ''
    for (var p = day.length; p < 2; p++) {
        day = '0' + day
    }
    return date.getFullYear() + "-" + month + "-" + day
}


//根据字符串获取时间戳
function newDateAndTime(Str) {
    var dateStr = Str.replace("T", " ")
    var ds = dateStr.split(" ")[0].split("-");
    var ts = dateStr.split(" ")[1] ? dateStr.split(" ")[1].split(":") : ['00', '00', '00'];
    if (ts.length < 3) {
        for (var i = ts.length; i < 3; i++) {
            ts.push('00')
        }
    }
    var ts = dateStr.split(" ")[1] ? dateStr.split(" ")[1].split(":") : ['00', '00', '00'];
    var r = new Date();
    r.setFullYear(ds[0], ds[1] - 1, ds[2]);
    r.setHours(ts[0], ts[1], ts[2], 0);
    return r;
}

//将日期转换为可填入input的格式
function T2I(Timestamp) {
    return new Date(Timestamp).toISOString().replace("Z", '')
}

//遍历数组和对象
/*
 * for each 语句，
 * 实现for 和for(var i in y)的功能
 * 调用时
 ForEach(obj,function(i){
 })
 * */
function ForEach(obj, func) {
    if (typeof obj == "object") {
        if (obj.length == undefined) {
            for (var x in obj) {
                //传入（每一项，每一项的序列号）
                func(obj[x], x);
            }
        } else {
            for (var i = 0; i < obj.length; i++) {
                //传入（每一项，每一项的序列号）
                func(obj[i], i);
            }
        }
    } else {
        console.log('类型错误:' + JSON.stringify(obj))
    }
}


//界面跳转的封装函数
function goto(href) {
    window.location.href = href
}

//列表类页面的参数构建
function buildListParams(p, k, t) {
    var params = []
    params.push(p)
    params.push(k)
    params.push(t.join("_"))
    return params.join("&&")
}

//转换为10为时间戳发送给后端
/*
 * s 要进行转换的时间戳
 * u 转换后的时间单位 字符串 'ms' 毫秒 's' 秒
 * */
function timeLengthFormat(s,u){
    switch (u){
        case 'ms':

            return Math.ceil(s*1000)
            break
        case 's':
            return Math.ceil(s/1000)

            break
    }
}