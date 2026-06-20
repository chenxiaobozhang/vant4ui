/**
 * 格式化时间戳为指定格式 of 指定 of 字符串
 * @param {number} timestamp - Unix 时间戳（秒或毫秒）
 * @param {string} format - 格式字符串，例如 "YYYY-MM-DD HH:mm:ss"
 * @returns {string} - 格式化后的日期时间字符串
 */
export function formatTimestamp(timestamp, format = "YYYY-MM-DD HH:mm:ss") {
	// 如果时间戳是秒，转换为毫秒；如果是毫秒，则直接使用
	timestamp = Number(timestamp) //强制转为数字
	const date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
	// 检查时间戳是否有效
	if (isNaN(date.getTime())) {
		return "Invalid Timestamp";
	}
	// 定义时间部分的映射
	const map = {
		"YYYY": date.getFullYear(), // 四位年份
		"MM": String(date.getMonth() + 1).padStart(2, "0"), // 月份（01-12）
		"DD": String(date.getDate()).padStart(2, "0"), // 日期（01-31）
		"HH": String(date.getHours()).padStart(2, "0"), // 小时（00-23）
		"mm": String(date.getMinutes()).padStart(2, "0"), // 分钟（00-59）
		"ss": String(date.getSeconds()).padStart(2, "0"), // 秒（00-59）
		"SSS": String(date.getMilliseconds()).padStart(3, "0") // 毫秒（000-999）
	};
	// 替换格式字符串中的占位符
	return format.replace(/(YYYY|MM|DD|HH|mm|ss|SSS)/g, (match) => map[match]);
}

export function encodeBase64(str) {
	// 确保输入是字符串
	if (typeof str !== "string") {
		throw new Error("Input must be a string");
	}
	// 使用 TextEncoder 将字符串编码为 UTF-8 字节数组
	const bytes = new TextEncoder().encode(str);
	// 将字节数组转换为二进制字符串
	const binaryStr = String.fromCharCode(...bytes);
	// 使用 btoa 将二进制字符串编码为 Base64
	const encodedStr = btoa(binaryStr);
	return encodedStr;
}

export function decodeBase64(str) {
	// 使用 atob 解码 Base64 为二进制字符串
	const binaryStr = atob(str);
	// 将二进制字符串转为 Uint8Array
	const bytes = new Uint8Array([...binaryStr].map(char => char.charCodeAt(0)));
	// 使用 TextDecoder 将字节解码为 UTF-8 字符串
	const decodedStr = new TextDecoder("utf-8").decode(bytes);
	return decodedStr;
}

// 强类型协议包装器 (LRJL 规范)
function wrapArg(arg) {
	const type = typeof arg;
	return {
		__bridge_type__: (arg && type === "object") ? "object" : type,
		__bridge_data__: arg
	};
}

// 强类型协议解包器 (LRJL 规范)
function unwrapArg(raw) {
	try {
		const pkg = JSON.parse(raw);
		if (pkg && pkg.hasOwnProperty("__bridge_type__")) {
			return pkg.__bridge_data__;
		}
	} catch (e) {}

	// 兼容普通字符串与隐式解析
	const trimmed = raw.trim();
	if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
		try { return JSON.parse(trimmed); } catch (e) {}
	}
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;
	const num = Number(trimmed);
	if (!isNaN(num) && trimmed !== "") return num;
	return raw;
}

export const Webview = {
	callbacks: {},
	anonCallbacks: {}, // 专门存放 JS 主动调用 Lua 时的临时匿名回调
	anonCallbackId: 0,

	callLua(luaFuncName, ...args) {
		const isLRJL = window.bridge && typeof window.bridge.callLua === "function";
		const isAJJL = window.webView && typeof window.webView.postMessage === "function";

		// 检测最后一个参数是否为回调函数 (AJJL 传统回调写法)
		let cid = null;
		let finalArgs = args;
		if (args.length > 0 && typeof args[args.length - 1] === 'function') {
			const callback = args[args.length - 1];
			cid = "cb_" + (this.anonCallbackId++);
			this.anonCallbacks[cid] = callback;
			finalArgs = args.slice(0, -1);
		}

		if (isLRJL) {
			// ================= 懒人精灵环境 =================
			const b64Name = encodeBase64(luaFuncName);
			const wrappedArgs = finalArgs.map(arg => wrapArg(arg));
			
			// 如果存在匿名回调，将回调ID作为包装对象附加在参数最后传递给 Lua
			if (cid !== null) {
				wrappedArgs.push(wrapArg({ __callback_id__: cid }));
			}

			const b64Args = wrappedArgs.map(wrapped => encodeBase64(JSON.stringify(wrapped)));
			
			let luaCall = `Webview.trigger('${b64Name}'`;
			if (b64Args.length > 0) {
				luaCall += `, '${b64Args.join("', '")}'`;
			}
			luaCall += `)`;
			
			console.log("[Webview] LRJL 通道调用 Lua:", luaCall);
			window.bridge.callLua(luaCall);

		} else if (isAJJL) {
			// ================= 按键精灵环境 =================
			let sendArgs = finalArgs;
			// 兼容单 Object 参数扁平化处理 (AJJL 的参数传递习惯)
			if (finalArgs.length === 1 && typeof finalArgs[0] === 'object' && finalArgs[0] !== null && !Array.isArray(finalArgs[0])) {
				sendArgs = finalArgs[0];
			}

			console.log("[Webview] AJJL 通道调用 Lua:", luaFuncName, sendArgs, cid);
			window.webView.postMessage(JSON.stringify({
				func: luaFuncName,
				args: sendArgs,
				callbackId: cid
			}));

		} else {
			console.warn(`[Webview] 非脚本运行环境，callLua [${luaFuncName}] 已忽略`, args);
		}
	},

	register(funcName, handler) {
		this.callbacks[funcName] = handler;
		console.log(`[Webview] 注册 JS 监听器: ${funcName}`);
	},

	trigger(funcName, ...args) {
		console.log(`[Webview] 收到 Native 触发事件: ${funcName}`, args);
		
		// 1. 处理 Q 语言/Lua 异步匿名回调返回 (onLuaCallback 或 onCallback)
		if (funcName === "onLuaCallback" || funcName === "onCallback") {
			const [id, result] = args;
			// 解密可能存在的 Base64 编码的回调数据
			const decodedId = (typeof id === 'string' && !id.startsWith("cb_")) ? decodeBase64(id) : id;
			let decodedResult = result;
			if (typeof result === 'string') {
				try { decodedResult = unwrapArg(decodeBase64(result)); } catch (e) { decodedResult = unwrapArg(result); }
			}
			
			if (this.anonCallbacks[decodedId]) {
				this.anonCallbacks[decodedId](decodedResult);
				delete this.anonCallbacks[decodedId];
				return;
			}
		}

		// 2. 正常分发命名事件监听
		const isLRJL = window.bridge && typeof window.bridge.callLua === "function";
		const processedArgs = args.map(arg => {
			// 如果是 LRJL，需要进行 Base64 和强类型还原；AJJL 已在注入前在 Java 层还原完毕
			if (isLRJL && typeof arg === 'string') {
				try { return unwrapArg(decodeBase64(arg)); } catch (e) { return unwrapArg(arg); }
			}
			return arg;
		});

		const handler = this.callbacks[funcName];
		if (handler) {
			handler(...processedArgs);
		} else {
			// 尝试从 window 中寻找全局函数
			const fn = window[funcName];
			if (typeof fn === 'function') {
				fn(...processedArgs);
			} else {
				console.error(`[Webview] JS端未注册回调方法或全局函数: ${funcName}`);
			}
		}
	}
};

window.Webview = Webview;

// ================= 向上兼容按键精灵底层注入入口 =================
// 按键精灵 evaluate 注入的脚本为 window.onLuaCallJs
window.onLuaCallJs = function(funcname, argsJson) {
	try {
		const args = JSON.parse(argsJson);
		
		// 如果是直接触发事件总线
		if (funcname === "Webview.trigger" || funcname === "window.Webview.trigger") {
			Webview.trigger(...args);
			return;
		}

		// 支持旧版直接执行全局 window 下函数的逻辑
		const parts = funcname.split('.');
		let fn = window;
		for (let i = 0; i < parts.length; i++) {
			fn = fn[parts[i]];
			if (!fn) break;
		}
		if (typeof fn === 'function') {
			fn.apply(null, args);
		} else if (Webview.callbacks[funcname]) {
			// 兜底：如果没挂载到全局 window，但注册在 Webview 监听中，也能匹配触发
			Webview.callbacks[funcname](...args);
		} else {
			console.error(`[onLuaCallJs] 网页未定义全局函数/监听器: ${funcname}`);
		}
	} catch (e) {
		console.error(`[onLuaCallJs] 分发异常: ${e.message}`);
	}
};

// 向上兼容按键精灵 onLuaCallback 回调触发
window.onLuaCallback = function(id, result) {
	if (Webview.anonCallbacks[id]) {
		Webview.anonCallbacks[id](result);
		delete Webview.anonCallbacks[id];
	}
};

export function js2lua(data) {
	let input = data; // 避免覆盖原始参数
	try {
		// 处理对象类型（排除 null）
		if (input && typeof input === "object") {
			input = JSON.stringify(input);
		}
		// 确保输入是字符串
		if (typeof input !== "string") {
			input = String(input); // 转为字符串
		}
		return encodeBase64(input);
	} catch (e) {
		console.error("js2lua 转换失败:", e.message);
		return encodeBase64(""); // 返回默认值
	}
}

export function lua2js(data) {
	if (typeof data !== "string" || data === "") {
		return null; // 无效输入返回 null
	}
	const decoded = decodeBase64(data); // 解码 Base64
	try {
		return JSON.parse(decoded); // 尝试解析为对象
	} catch (e) {
		return decoded; // 不是 JSON，返回原始字符串
	}
}

export function strToObject(jsonString) {
	try {
		// 尝试将字符串解析为对象
		return JSON.parse(jsonString);
	} catch (error) {
		console.error("字符串不是合法的 JSON 格式:", error.message);
		// 判断原始字符串是否像数组或对象
		if (jsonString.trim().startsWith("[")) {
			return []; // 返回空数组
		} else {
			return {}; // 返回空对象
		}
	}
}

export function removeTxtExtension(str) {
	return str.replace(/\.txt$/, '');
}

export function callLuaFun(_fun, param) {
	Webview.callLua(_fun, param);
}

// 全局组件注册表
export const componentRegistry = {};

export function registerComponent(name, instance) {
	if (name && instance) {
		componentRegistry[name] = instance;
		console.log(`Component registered: ${name}`);
	}
}

export function unregisterComponent(name) {
	if (name && componentRegistry[name]) {
		delete componentRegistry[name];
		console.log(`Component unregistered: ${name}`);
	}
}

export function _debug(_data) {
	console.log("_debug:", _data);
	callLuaFun("_debug", _data);
}

export function logToLua(_data) {
	console.log("[logToLua]:", _data);
	Webview.callLua("logToLua", _data);
}