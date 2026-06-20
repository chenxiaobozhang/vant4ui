# data.js 配置参考手册

本文档详细说明了 `data.js` 中 `settingGroups` 配置项的编写规则。每个配置项 (`item`) 都由 `type` 属性决定其渲染组件。

## 1. 通用属性 (Common Props)

所有类型的组件都支持以下属性：

| 属性名   | 类型     | 说明                                                                                        | 示例                             |
| :------- | :------- | :------------------------------------------------------------------------------------------ | :------------------------------- |
| `type`   | String   | **必填**。组件类型，决定显示什么控件。                                                      | `'input'`, `'switch'`, `'group'` |
| `key`    | String   | **数据绑定键名**。对应 `defaultData` 中的字段名。组件的值会自动双向绑定到 `formData[key]`。 | `'serverAddress'`, `'autoLogin'` |
| `label`  | String   | 左侧显示的标签文本。                                                                        | `'服务器地址'`                   |
| `showIf` | Function | 控制组件显示/隐藏的函数。接收 `formData` 参数，返回 `true` 显示，`false` 隐藏。             | `(formData) => formData.isOpen`  |
| `desc`   | String   | 辅助说明文字，通常显示在组件下方或作为单独的提示行。                                        | `'*请谨慎修改此项'`              |

---

## 2. 组件详解 (Component Reference)

### 2.1 输入框 (input)

用于文本输入。

| 属性名        | 类型     | 说明                                             | 默认值/备注                        |
| :------------ | :------- | :----------------------------------------------- | :--------------------------------- |
| `placeholder` | String   | 输入框为空时的占位符。                           | -                                  |
| `width`       | String   | 输入框的宽度。                                   | 如 `'80px'`, `'100%'`              |
| `textAlign`   | String   | 文字对齐方式。                                   | `'left'`, `'center'`, `'right'`    |
| `showbg`      | Boolean  | 是否显示灰色背景。                               | `true` (显示背景类 `van-input-bg`) |
| `btnText`     | String   | 如果需要在输入框右侧附加一个按钮，设置按钮文字。 | -                                  |
| `btnWidth`    | String   | 附加按钮的宽度。                                 | 如 `'60px'`                        |
| `onClick`     | Function | 附加按钮的点击事件回调。                         | `({ formData, utils }) => {}`      |

### 2.2 多行文本 (textarea)

用于输入长文本。

| 属性名        | 类型   | 说明             | 默认值/备注  |
| :------------ | :----- | :--------------- | :----------- |
| `rows`        | Number | 显示的行数。     | 默认自适应   |
| `placeholder` | String | 占位符。         | -            |
| `maxlength`   | Number | 最大字符数限制。 | 固定为 `500` |

### 2.3 增强多行文本 (textareaEx)

带有行号显示的多行文本编辑器，适合编辑脚本或代码。

| 属性名        | 类型   | 说明         | 默认值/备注 |
| :------------ | :----- | :----------- | :---------- |
| `rows`        | Number | 显示的行数。 | -           |
| `placeholder` | String | 占位符。     | -           |

### 2.4 开关 (switch)

用于两种状态的切换 (True/False)。

| 属性名 | 类型   | 说明                     | 默认值/备注 |
| :----- | :----- | :----------------------- | :---------- |
| `key`  | String | 绑定数据键名（布尔值）。 | -           |

### 2.5 步进器 (stepper)

用于数字的增减。

| 属性名  | 类型   | 说明                     | 默认值/备注 |
| :------ | :----- | :----------------------- | :---------- |
| `min`   | Number | 最小值。                 | -           |
| `max`   | Number | 最大值。                 | -           |
| `step`  | Number | 步长（每次增减的数值）。 | 默认为 `1`  |
| `width` | String | 输入框部分的宽度。       | -           |

### 2.6 单选框组 (radio)

一组互斥的选项。

| 属性名        | 类型   | 说明                                                | 默认值/备注                                |
| :------------ | :----- | :-------------------------------------------------- | :----------------------------------------- |
| `options`     | Array  | 选项列表。格式：`[{ text: '显示名', value: '值' }]` | **必填**                                   |
| `justify`     | String | 排列对齐方式。                                      | `'flex-start'` (默认), `'center'`, `'end'` |
| `label_width` | String | 左侧 Label 的最小宽度。                             | `'120px'`                                  |
| `radio_width` | String | 每个单选项目的最小宽度。                            | -                                          |
| `fontSize`    | String | 字体大小。                                          | -                                          |

### 2.7 多选框组 (checkbox)

一组可以多选的选项。

| 属性名           | 类型    | 说明                                              | 默认值/备注                                |
| :--------------- | :------ | :------------------------------------------------ | :----------------------------------------- |
| `options`        | Array   | 选项列表。格式：`[{ text: '显示名', value: 1 }]`  | **必填**                                   |
| `justify`        | String  | 排列对齐方式。                                    | `'flex-start'` (默认), `'center'`, `'end'` |
| `checkbox_width` | String  | 每个多选项目的最小宽度。                          | -                                          |
| `indeterminate`  | Boolean | 是否启用全选状态联动（半选状态）。                | 配合 `childrenKeys` 使用                   |
| `childrenKeys`   | Array   | 该多选框控制的子数据 `key` 列表（用于全选逻辑）。 | `['key1', 'key2']`                         |

### 2.8 下拉选择器 (picker)

点击弹出底部滚动选择器。

| 属性名    | 类型  | 说明                                                | 默认值/备注 |
| :-------- | :---- | :-------------------------------------------------- | :---------- |
| `options` | Array | 选项列表。格式：`[{ text: '显示名', value: '值' }]` | **必填**    |

### 2.9 时间范围 (timeRange)

选择开始时间和结束时间（时:分）。

| 属性名                    | 类型   | 说明                           | 默认值/备注                       |
| :------------------------ | :----- | :----------------------------- | :-------------------------------- |
| `startKey`                | String | **必填**。开始时间绑定的键名。 | 数据格式必须为数组 `['08', '00']` |
| `endKey`                  | String | **必填**。结束时间绑定的键名。 | 数据格式必须为数组 `['10', '00']` |
| `minHour` / `maxHour`     | Number | 可选的小时范围。               | 0-23                              |
| `minMinute` / `maxMinute` | Number | 可选的分钟范围。               | 0-59                              |

### 2.10 穿梭框/列表选择 (transfer)

用于从大量选项中选择多个项目，支持弹窗搜索/勾选。

| 属性名       | 类型   | 说明             | 默认值/备注                     |
| :----------- | :----- | :--------------- | :------------------------------ |
| `options`    | Array  | 数据源列表。     | `[{ text: 'A', value: 1 }]`     |
| `fieldNames` | Object | 自定义字段映射。 | `{ text: 'name', value: 'id' }` |

### 2.11 按钮 (button)

执行特定动作的按钮。

| 属性名     | 类型     | 说明                                                   | 默认值/备注                       |
| :--------- | :------- | :----------------------------------------------------- | :-------------------------------- |
| `btnText`  | String   | 按钮上显示的文字。                                     | -                                 |
| `btnWidth` | String   | 按钮宽度。                                             | -                                 |
| `onClick`  | Function | 点击事件回调。参数包含 `formData`, `utils`, `bridge`。 | 使用 `utils.showToast()` 提示信息 |

### 2.12 展示单元格 (cell)

仅用于展示数据，只读。

| 属性名    | 类型   | 说明                                                                        | 默认值/备注                          |
| :-------- | :----- | :-------------------------------------------------------------------------- | :----------------------------------- |
| `value`   | String | 显示的内容。支持 `${key}` 语法动态引用 `formData` 或 `constData` 中的数据。 | `'第${loop}次循环'`                  |
| `icon`    | String | 左侧图标名称（Vant Icon）。                                                 | -                                    |
| `justify` | String | 内容对齐方式。                                                              | `'start'` (左对齐), `'end'` (右对齐) |
| `style`   | Object | 自定义文本样式。                                                            | `{ color: 'red' }`                   |

### 2.13 描述文本 (desc)

纯文本提示，通常用于解释说明。

| 属性名  | 类型   | 说明         | 默认值/备注 |
| :------ | :----- | :----------- | :---------- |
| `desc`  | String | 文本内容。   | -           |
| `style` | Object | 自定义样式。 | -           |

### 2.14 组合容器 (group)

将多个小型组件排列在一行显示。

| 属性名     | 类型   | 说明                 | 默认值/备注                         |
| :--------- | :----- | :------------------- | :---------------------------------- |
| `children` | Array  | 包含的子组件列表。   | **不支持嵌套 group**                |
| `justify`  | String | 子组件排列对齐方式。 | `'flex-start'`, `'center'`, `'end'` |

**Group 支持的子组件类型 (`children` item type):**

- `button`: 同上。
- `stepper`: 同上。
- `checkbox` (单个): `text` (显示文本), `v-model` (绑定布尔值/数组需自行处理，通常绑定到 boolean key)。
- `radio` (单个): `text`, `value` (选中后的值), `name` (单选组的值)。
- `input` (简易版): `width`, `placeholder`, `textAlign`。
- `text` (纯文本): `text` 内容, `style` 样式。
- `switch`: 同上。

---

## 3. 点击事件回调 (onClick)

`button` 和带按钮的 `input` 组件支持 `onClick` 回调。

```javascript
onClick: ({ formData, constData, utils, bridge, components }) => {
  // formData: 当前表单数据 (可读写)
  // constData: 全局常量数据 / 脚本回传数据
  // utils: 工具函数集 { showToast, showDialog, showSuccessToast, showFailToast }
  // bridge: 脚本通信桥 { callLuaFun(name, args), js2lua, lua2js }
  // components: 组件注册表 (如 components.logs)

  // 示例：提示当前输入的值
  utils.showToast("输入是：" + formData.myInput);

  // 示例：调用 Lua 脚本函数
  if (bridge) {
    bridge.callLuaFun("RunScript", formData.scriptName);
  }
};
```
