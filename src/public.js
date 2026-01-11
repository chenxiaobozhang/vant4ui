/**
 * 格式化时间戳为指定格式的字符串
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
	if (window.bridge) {
		const paramStr = `'${js2lua(param)}'`; // 单个参数加单引号
		const luaCall = `${_fun}(${paramStr})`;
		console.log("调用 Lua:", luaCall);
		window.bridge.callLua(luaCall);
	}
}