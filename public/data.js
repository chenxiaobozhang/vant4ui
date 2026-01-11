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
    countdownTime: 30  //倒计时时间
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
        }]
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
              label_minWidth: "120px",
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
            { label: '倒计时时间', key: 'countdownTime', type: 'stepper', min: 5, max: 300 ,width: '50px'}
          ]

        }
      ]
    }
  ]
};
