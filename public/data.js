// 外部配置文件
// 修改此文件后刷新网页即可生效

window.UI_DATA = {
  // 应用标题
  appTitle: "蝴蝶 2.44", //应用标题
  configsLimit: 20,     //多配置数量限制
  activeTab:0,          //默认打开的tab
  // 默认数据配置
  defaultData: {
    autoPromote: false,
    autoHarvest: true,
    autoDate: false,
    autoAffairs: true,
    autoAffairs2: true,
    itemCount: 5,
    dungeonDifficulty: '2',
    lmfb: [1, 2],
    tasks: ['a'],
    server: 's1',
    server2:'s4',
    jc_startTime: ['08', '00'],
    jc_endTime: ['10', '00'],
    jc_startTime1: ['08', '00'],
    jc_endTime1: ['10', '00'],
    remarks: "",
    jc_endTime1: ['10', '00'],
    remarks: "",
    scriptContent: "aa",  
    countdownTime: 30,  //倒计时时间
    viewScale: 0.8,
    transferSelected:[],
    palace:true,
    palace_select:24,
    sjmk:true,
    sjmk_select:10
  },


  // 界面设置项配置：Tabs -> Groups -> Items
  settingGroups: [
    {
      title: '基础设置',
      icon: 'setting',
      groups: [
        {
          title: '基础功能',
          name: '1',
          items: [
            { label: '当前进度', key: 'progress', type: 'cell', title: '当前进度:第${loop}循环第${account}个账号', icon: 'location-o' ,value: '123',ref:true},
            { label: '测试数据', key: 'a', type: 'input', placeholder: '请输入测试数据', btnText: '确认' },
            { label: '自动升堂', key: 'autoPromote', type: 'switch' },
            { label: '自动收菜', key: 'autoHarvest', type: 'switch' },
            {
              label: '营业时间',
              type: 'timeRange',
              startKey: 'jc_startTime',
              endKey: 'jc_endTime',
              placeholder: '请选择营业时间'
            },
            {
              label: '营业时间2',
              type: 'timeRange',
              startKey: 'jc_startTime1',
              endKey: 'jc_endTime1',
              placeholder: '请选择营业时间',
              minHour: 10,
              maxHour: 20,
              minMinute: 30,
              maxMinute: 40
            },
            {
              type: 'transfer',
              key:'transfer1',
              options:[
                { id: 101, name: '苹果 (Apple)' },
                { id: 102, name: '香蕉 (Banana)' },
                { id: 103, name: '橙子 (Orange)' },
                { id: 104, name: '葡萄 (Grape)' },
                { id: 105, name: '西瓜 (Watermelon)' }
              ]
            }
          ]
        },
        {
          title: '政务设置',
          name: '3',
          items: [
            { label: '一键处理', key: 'autoAffairs', type: 'switch' },
            { label: '提示', desc: '请告诉我您的具体意图，我将为您提供最准确的帮助。', type: 'desc' }
          ]
        }
      ]
    },
    {
      title: '活动相关',
      icon: 'fire',
      groups: [
        {
          title: '政务设置2',
          name: '3',
          items: [
            { label: '一键处理2', key: 'autoAffairs2', type: 'switch' },
            { label: '提示2', desc: '请告诉我您的具体意图，我将为您提供最准确的帮助。', type: 'desc' }
          ]
        },
        {
          title:"皇宫膜拜",
          name:'8',
          items:[
            { label: '自动膜拜', key: 'palace', type: 'switch' },
            {
              label:"选择宫殿",key:"palace_select",type:'picker',options:[
                  {text: "1.武林盟主",value: 1 }
                  ,{text: "2.汉世宗",value: 2 }
                  ,{text: "3.隋开皇",value: 3 }
                  ,{text: "4.贞观",value: 4 }
                  ,{text: "5.武曌",value: 5 }
                  ,{text: "6.建隆",value: 6 }
                  ,{text: "7.永乐",value: 7 }
                  ,{text: "8.雍正",value: 8 }
                  ,{text: "9.至元",value: 9 }
                  ,{text: "10.銮殿殿",value: 10 }
                  ,{text: "11.太和殿",value: 11 }
                  ,{text: "12.仁帝殿",value: 12 }
                  ,{text: "13.义帝殿",value: 13 }
                  ,{text: "14.礼帝殿",value: 14 }
                  ,{text: "15.智帝殿",value: 15 }
                  ,{text: "16.忠帝殿",value: 16 }
                  ,{text: "17.孝帝殿",value: 17 }  //第1屏
                  ,{text: "18.政帝殿",value: 18 }  //第2屏
                  ,{text: "19.文帝殿",value: 19 }
                  ,{text: "20.魅帝殿",value: 20 }
                  ,{text: "21.武帝殿",value: 21 }
                  ,{text: "22.文宣王",value: 22 }
                  ,{text: "23.摄政王",value: 23 }
                  ,{text: "24.武成王",value: 24 }
                  ,{text: "25.镇南王",value: 25 }
                  ,{text: "26.宣烈王",value: 26 }
                  ,{text: "27.平西王",value: 27 }
                  ,{text: "28.逍遥王",value: 28 }
                  ,{text: "29.八贤王",value: 29 }
                  ,{text: "30.靖安王",value: 30 }
                  ,{text: "31.智恒王",value: 31 }

              ]
            }
          ]
        },
        {
          title:"升级门客",
          name:'9',
          items:[
            { label: '自动升级', key: 'sjmk', type: 'switch' },
            {
              label:"选择门客",key:"sjmk_select",type:'picker',options:[
    {text: "B.白莲教首", value: 1},
    {text: "B.白起", value: 2},
    {text: "B.包龙星", value: 3},
    {text: "B.包有为", value: 4},
    {text: "B.包拯", value: 5},
    {text: "B.八阿哥·胤裸", value: 6},
    {text: "C.曹雪芹", value: 7},
    {text: "C.陈近南", value: 8},
    {text: "C.程咬金", value: 9},
    {text: "D.大师父长眉", value: 10},
    {text: "D.大师兄阿亮", value: 11},
    {text: "D.大阿哥·胤裎", value: 12},
    {text: "D.东方朔", value: 13},
    {text: "D.杜甫", value: 14},
    {text: "E.二阿哥·胤初", value: 15},
    {text: "F.范雎", value: 16},
    {text: "F.范蠡", value: 17},
    {text: "F.樊梨花", value: 18},
    {text: "F.范文程", value: 19},
    {text: "G.噶尔丹", value: 20},
    {text: "G.干将", value: 21},
    {text: "G.高渐离", value: 22},
    {text: "G.高长恭", value: 23},
    {text: "G.公孙策", value: 24},
    {text: "G.公孙胜", value: 25},
    {text: "G.管仲", value: 26},
    {text: "H.韩信", value: 27},
    {text: "H.花木兰", value: 28},
    {text: "H.洪承畴", value: 29},
    {text: "H.胡雪岩", value: 30},
    {text: "H.华安", value: 31},
    {text: "H.霍去病", value: 32},
    {text: "J.纪昀", value: 33},
    {text: "J.荆轲", value: 34},
    {text: "J.九阿哥·胤糖", value: 35},
    {text: "L.雷豹", value: 36},
    {text: "L.老子", value: 37},
    {text: "L.廉颇", value: 38},
    {text: "L.梁红玉", value: 39},
    {text: "L.李白", value: 40},
    {text: "L.李广", value: 41},
    {text: "L.李莲英", value: 42},
    {text: "L.李卫", value: 43},
    {text: "L.林冲", value: 44},
    {text: "L.林则徐", value: 45},
    {text: "L.柳如烟", value: 46},
    {text: "L.刘邦", value: 47},
    {text: "L.刘墉", value: 48},
    {text: "L.卢俊义", value: 49},
    {text: "L.陆湘湘", value: 50},
    {text: "L.罗成", value: 51},
    {text: "M.墨子", value: 52},
    {text: "M.穆桂英", value: 53},
    {text: "N.纳兰明珠", value: 54},
    {text: "N.年羹尧", value: 55},
    {text: "O.欧阳修", value: 56},
    {text: "P.胖师父大头", value: 57},
    {text: "Q.秦桧", value: 58},
    {text: "Q.秦良玉", value: 59},
    {text: "Q.秦琼", value: 60},
    {text: "Q.秦小莲", value: 61},
    {text: "S.三阿哥·胤祉", value: 62},
    {text: "S.商鞅", value: 63},
    {text: "S.圣·杜康", value: 64},
    {text: "S.圣·孔子", value: 65},
    {text: "S.圣·李时珍", value: 66},
    {text: "S.圣·陆羽", value: 67},
    {text: "S.圣·张仲景", value: 68},
    {text: "S.圣·吴道子", value: 69},
    {text: "S.司马迁", value: 70},
    {text: "S.司马懿", value: 71},
    {text: "S.宋江", value: 72},
    {text: "S.索尼", value: 73},
    {text: "S.苏秦", value: 74},
    {text: "S.苏轼", value: 75},
    {text: "S.孙武", value: 76},
    {text: "S.四阿哥·胤禛", value: 77},
    {text: "S.守陵人", value: 78},
    {text: "S.十阿哥·胤被", value: 79},
    {text: "S.十三阿哥·胤祥", value: 80},
    {text: "S.十四阿哥·胤禵", value: 81},
    {text: "T.桃花", value: 82},
    {text: "T.铁木真", value: 83},
    {text: "W.卫青", value: 84},
    {text: "W.魏征", value: 85},
    {text: "W.魏忠贤", value: 86},
    {text: "W.吴用", value: 87},
    {text: "W.王安石", value: 88},
    {text: "W.王羲之", value: 89},
    {text: "X.项羽", value: 90},
    {text: "X.小蜻蜓", value: 91},
    {text: "X.小师弟光明", value: 92},
    {text: "X.萧剑", value: 93},
    {text: "Y.岳飞", value: 94},
    {text: "Y.嬴政", value: 95},
    {text: "Y.尉迟恭", value: 96},
    {text: "Z.展昭", value: 97},
    {text: "Z.张衡", value: 98},
    {text: "Z.张廷玉", value: 99},
    {text: "Z.赵高", value: 100},
    {text: "Z.郑板桥", value: 101},
    {text: "Z.周培公", value: 102}
]
            }
          ]
        }
      ]
    },
    {
      title: '高级设置',
      icon: 'user-circle-o',
      groups: [
        {
          title: '高级设置',
          name: '4',
          items: [
            { label: '使用道具数量', key: 'itemCount', type: 'stepper', min: 1, max: 99 },
            {
              label: '副本难度偏好',
              key: 'dungeonDifficulty',
              type: 'radio',
              options: [{ text: '简单', value: '1' }, { text: '普通', value: '2' }, { text: '困难', value: '3' }]
            },
            {
              label: '开联盟副本',
              key: 'lmfb',
              type: 'checkbox',
              options: [{ text: '一级', value: 1 }, { text: '二级', value: 2 }, { text: '三级', value: 3 }]
            },
            {
              label: '开联盟副本222',
              label_width: "120px",
              checkbox_width: "60px",
              key: 'lmfb',
              type: 'checkbox',
              options: [{ text: '一级', value: 1 }, { text: '二级', value: 2 }, { text: '三级', value: 3 },
              { text: '4级', value: 4 }, { text: '5级', value: 5 }, { text: '6级', value: 6 },
              { text: '7级', value: 7 }, { text: '8级', value: 8 }, { text: '9级', value: 9 },
              { text: '10级', value: 10 }, { text: '11级', value: 11 }, { text: '12级', value: 12 },
              { text: '13级', value: 13 }, { text: '14级', value: 14 }, { text: '15级', value: 15 },
              { text: '16级', value: 16 }, { text: '17级', value: 17 }, { text: '18级', value: 18 }
              ]
            },
            { label: '提示', type: 'desc', desc: '**设置为0表示不争夺，资质大于设置数值的门客参与该等级资源的争夺\n*设置的高等级资源的最低资质务必大于等于低等级资源的最低资质，\n\r否则可能出现意料之外的后果，即<10级资源最低资质=9级资源最低资质>=8级资源最低资质……' },
            {
              label: '选择服务器',
              key: 'server',
              type: 'picker',
              options: [{ text: 'S1 - 风起云涌', value: 's1' }, { text: 'S2 - 逐鹿中原', value: 's2' }]
            },
            {
              label: '选择服务器2',
              key: 'server2',
              type: 'picker',
              options: [{ text: 'S3 - 风起云涌', value: 's3' }, { text: 'S4 - 逐鹿中原', value: 's4' }]
            },
            { label: '自定义配置', key: 'customConfig', type: 'input', placeholder: '请输入自定义配置' },
            {
              label: '账号相关',
              key: 'remarks',
              type: 'textarea',
              placeholder: '请输入详细备注信息...',
              rows: 4,
              maxlength: 500
            },
            {
              label: '脚本命令',
              key: 'scriptContent',
              type: 'textareaEx',
              placeholder: '请输入指令，每行一条',
              rows: 6
            },
            { label: '提示', desc: '请告诉我您的具体意图，我将为您提供最准确的帮助。', type: 'desc' }
          ]
        }
      ]
    },
    {
      title: '系统设置',
      icon: 'desktop-o',
      groups: [
        {
          title: '其他设置',
          name: '5',
          items: [
            { label: '使用道具数量', key: 'itemCount', type: 'stepper', min: 1, max: 99 },
            { label: '倒计时时间', key: 'countdownTime', type: 'stepper', min: 5, max: 300 ,width: '50px'},
            { label: '界面缩放', key: 'viewScale', type: 'stepper', min: 0.5, max: 1.0, step: 0.1, width: '50px' },
            { label: '日志管理', key: 'openLogs', type: 'button', btnText: '查看日志' },
            { label: '提示', desc: '*界面缩放只在移动端生效，PC端无效。', type: 'desc' }
          ]

        }
      ]
    }
  ]
};
