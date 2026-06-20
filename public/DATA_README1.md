# data.js 配置文档

`data.js` 是本应用的外部配置文件，用于定义界面结构、默认数据以及一些全局设置。修改此文件后，**刷新网页即可生效**。

## 1. 文件结构

整个配置挂载在 `window.UI_DATA` 对象上，主要包含以下几个部分：

- **`appTitle`**: 应用标题，显示在顶部导航栏。
- **`configsLimit`**: 多配置列表的最大数量限制。
- **`activeTab`**: 默认打开的设置页签索引（从0开始）。
- **`defaultData`**: 所有配置项的默认值对象。所有的表单数据都存储在这个对象中。
- **`settingGroups`**: 界面配置项的定义，决定了设置页面的显示结构。

---

## 2. defaultData (默认数据)

`defaultData` 对象定义了各项配置的**初始默认值**。

- **键名 (Key)**: 必须与 `settingGroups` 中各配置项的 `key` 属性对应。
- **值 (Value)**: 该配置项的默认值。

**示例**：

```javascript
defaultData: {
  resetLoop: false,       // 开关默认关闭
  startLoop: 1,           // 数字输入框默认值
  server: 's1',           // 下拉选择默认值
  lmfb: [1, 2],           // 多选框默认选中项（数组）
  tasks: ['a'],           // 任务列表
  // ... 其他数据
}
```

---

## 3. settingGroups (界面设置)

`settingGroups` 是一个数组，每个元素代表一个**页签 (Tab)**。

### 3.1 结构层级

1.  **SettingGroup (页签)**
    - `title`: 页签标题。
    - `icon`: 页签图标 (使用 Vant 图标名称)。
    - `groups`: 该页签下的**分组列表**。
2.  **Group (分组)**
    - `title`: 分组标题。
    - `name`: 分组唯一标识（用于折叠面板）。
    - `items`: 该分组下的**配置项列表**。
3.  **Item (配置项)**
    - 具体的一个输入框、开关、按钮等组件。

### 3.2 Item 配置项属性详解

每个配置项 (`item`) 是一个对象，支持以下通用属性和特定属性：

#### 通用属性

- **`type`**: 组件类型 (见下文支持的组件类型)。
- **`label`**: 左侧显示的标签文本。
- **`key`**: **(重要)** 对应 `defaultData` 中的键名，用于通过 `formData` 读写数据。
- **`desc`**: 下方显示的辅助说明/提示文字（支持 `style` 属性自定义颜色）。
- **`showIf`**: (可选) 函数，返回 `true/false` 来控制该项是否显示。 `(formData) => formData.switchOpen`

#### 支持的组件类型 (Type)

1.  **`input` (输入框)**
    - `placeholder`: 占位符文本。
    - `width`: 输入框宽度 (如 `'80px'`)。
2.  **`switch` (开关)**
    - 绑定值为 `true` 或 `false`。
3.  **`stepper` (步进器)**
    - `min`: 最小值。
    - `max`: 最大值。
    - `step`: 步长。
    - `width`: 组件宽度。
4.  **`checkbox` (多选框)**
    - `options`: 选项数组 `[{ text: '文本', value: 1 }]`。
    - `indeterminate`: 是否开启全选/半选状态控制。
    - `childrenKeys`: 全选控制的子项 key 数组。
5.  **`radio` (单选框)**
    - `options`: 选项数组 `[{ text: '文本', value: '1' }]`。
6.  **`picker` (选择器/下拉框)**
    - `options`: 选项数组 `[{ text: '显示文本', value: '实际值' }]`。
    - 点击弹出底部选择器。
7.  **`timeRange` (时间范围选择)**
    - `startKey`: 开始时间的 key (对应 defaultData 中的数组 `['08', '00']`)。
    - `endKey`: 结束时间的 key。
    - `minHour`, `maxHour`: 小时限制。
    - `minMinute`, `maxMinute`: 分钟限制。
8.  **`transfer` (穿梭框/列表选择)**
    - `options`: 可选列表 `[{ text: '名称', value: 101 }]`。
    - 用于从左侧列表选入右侧列表。
9.  **`button` (按钮)**
    - `btnText`: 按钮文字。
    - `onClick`: 点击回调函数 `({ formData, utils, bridge, components }) => { ... }`。
10. **`cell` (展示单元格)**
    - `value`: 显示的内容，支持模板字符串 `${keyname}` 动态替换数据。
11. **`text` (纯文本)**
    - `text`: 文本内容。
12. **`group` (组合容器)**
    - `children`: 包含一组子 item，常用于将多个小组件放在同一行。
    - `justify`: 对齐方式 ('start', 'center', 'end')。
13. **`textarea` / `textareaEx` (多行文本)**
    - `rows`: 行数。
    - `placeholder`: 占位符。

---

## 4. 特殊功能示例

### 4.1 动态进度显示

```javascript
{
  label: '当前进度',
  type: 'cell',
  value: '第${loop}循环,第${account}个账号' // 自动替换 formData.loop 和 formData.account
}
```

### 4.2 按钮点击事件

```javascript
{
  type: 'button',
  btnText: '测试',
  onClick: ({ utils, formData }) => {
    // 使用 utils 工具类显示提示
    utils.showToast(`当前值: ${formData.someKey}`);
  }
}
```

### 4.3 组合布局 (Inline Group)

将多个组件放在一行显示：

```javascript
{
  type: 'group',
  label: '混合测试',
  children: [
     { type: 'input', key: 'customInput' },
     { type: 'text', text: '次' },
     { type: 'button', btnText: '执行', onClick: ... }
  ]
}
```

## 5. Lua 脚本调用

在 `onClick` 事件中，可以通过 `bridge` 对象调用底层 Lua 方法：

```javascript
onClick: ({ bridge, formData }) => {
  if (window.bridge) {
    bridge.callLuaFun("luaFunctionName", formData.someValue);
  }
};
```
