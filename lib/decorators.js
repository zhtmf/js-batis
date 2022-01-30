const ExactException = require('./exact-exception');
const Engine = require('./dynamic_sql_engine');
const AsyncLocalStorage = require('async_hooks').AsyncLocalStorage;

const DEFAULT_DATASOURCE_NAME = "__default_datasource";
const DEFAULT_CATEGORRY_NAME = "_JS_BATIS";
const DS_REGISTRY_NAME = Symbol.for("__JSBATIS_DS_REGISTRY");
const PARAM_NAME_REGISTRY_NAME = Symbol.for("__JSBATIS_PARAM_NAME_REGISTRY");
const CLASS_DATASOURCE_NAME = "CLASS";
const ENGINE_NAME = Symbol.for("__JSBATIS_ENGINE");
const RESULT_MAP_NAME = Symbol.for("__JSBATIS_RESULT_MAP");
const RUNTIME_DATASOURCE_IMPL_CACHE = Symbol.for("__RUNTIME_DATASOURCE_IMPL");
const RUNTIME_DATASOURCE_NAME_CACHE = Symbol.for("__RUNTIME_DATASOURCE_NAME");
const DATASOURCE_TYPES_REGISTRY = {};
const TRANSACTION_ASYNC_STORAGE = new AsyncLocalStorage();
const FALLBACK_LOGGER_NAME = "JS-BATIS";
const PREDEFINED_OPTION_NAMES = {
	TYPE: 1,
	CAMELCASE: 1,
	LEVEL: 1,
	LOGGER: 1,
};
const DATA_SOURCES = {};

DATASOURCE_TYPES_REGISTRY["mysql"] = require("./plugins/mysql");
DATASOURCE_TYPES_REGISTRY["sqlite"] = require("./plugins/sqlite")._BATIS_SQLITE_DATASOURCE;
DATASOURCE_TYPES_REGISTRY["pg"] = require("./plugins/pg");

function configureLogger(groupName, options) {
	function configureLogLevel(groupName, options) {
		try {
			var loglevel = require('loglevel');
		} catch (e) {
			console.trace(e);
			return false;
		}
		let _logger;
		let level = (options.LEVEL || 'info').toLowerCase();
		return function(message) {
			if (!_logger) {
				let loggers = loglevel.getLoggers();
				if (loggers[groupName]) {
					_logger = loglevel.getLogger(groupName);
				} else if (loggers[DEFAULT_CATEGORRY_NAME]) {
					_logger = loglevel.getLogger(DEFAULT_CATEGORRY_NAME);
				} else {
					_logger = loglevel;
				}
			}
			_logger[level](message);
		}
	}
	function configureWinston(groupName, options) {
		try {
			var winston = require('winston');
		} catch (e) {
			console.trace(e);
			return false;
		}
		let _logger;
		let level = (options.LEVEL || 'info').toLowerCase();
		return function(message) {
			if (!_logger) {
				if (winston.loggers.has(groupName)) {
					_logger = winston.loggers.get(groupName);
				} else if (winston.loggers.has(DEFAULT_CATEGORRY_NAME)) {
					_logger = winston.loggers.get(DEFAULT_CATEGORRY_NAME);
				} else {
					_logger = winston;
				}
			}
			_logger.log(level, message);
		}
	}
	function configureLog4JS(groupName, options) {
		try {
			var log4js = require('log4js');
		} catch (e) {
			console.trace(e);
			return false;
		}
		let level = options.LEVEL || 'INFO';
		let _logger;
		/*
		 * log4js does not expose an API to tell whether a certain category is configured.
		 * so we cannot reliably fall back to default category if a category is not configured via log4js.configure
		 */
		return function(message) {
			if (!_logger) {
				if (groupName === DEFAULT_DATASOURCE_NAME) {
					_logger = log4js.getLogger(DEFAULT_CATEGORRY_NAME);
				} else {
					_logger = log4js.getLogger(groupName);
				}
			}
			_logger.log(level, message);
		}
	}
	function configureConsoleLogger(groupName, options) {
		return console.log;
	}
	if (!options.LOGGER) {
		return configureConsoleLogger(groupName, options);
	} else if (options.LOGGER.toLowerCase() === 'winston') {
		return configureWinston(groupName, options) || configureConsoleLogger(groupName, options);
	} else if (options.LOGGER.toLowerCase() === 'log4js') {
		return configureLog4JS(groupName, options) || configureConsoleLogger(groupName, options);
	} else if (options.LOGGER.toLowerCase() === 'loglevel') {
		return configureLogLevel(groupName, options) || configureConsoleLogger(groupName, options);
	} else if (options.LOGGER.toLowerCase() === 'none') {
		return function(message) { }
	} else {
		return configureConsoleLogger(groupName, options);
	}
}

for (let name in process.env) {
	let result = /^BATIS_DB(_[^_]+)?_([^_]+)$/.exec(name);
	if (result) {
		let group = result[1];
		group =
			group && group.length
				? group.substring(1)
				: DEFAULT_DATASOURCE_NAME;
		let propertyName = result[2];
		(DATA_SOURCES[group] = DATA_SOURCES[group] || {})[propertyName] =
			process.env[name];
	}
}

for (let group in DATA_SOURCES) {
	let groupName = group;
	group = DATA_SOURCES[groupName];
	if (group.TYPE) {

		let options = {};
		for (let option in group) {
			if (!PREDEFINED_OPTION_NAMES[option]) {
				let lower = group[option].toLowerCase();
				if (lower === 'true')
					lower = true;
				else if (lower === 'false')
					lower = false;
				else
					lower = group[option];
				options[option] = lower;
			}
		}

		let name = group.TYPE.toLowerCase();
		let impl = DATASOURCE_TYPES_REGISTRY[name];
		if (!impl) {
			throw new ExactException(
				"decorators",
				1,
				`unknown data source type ${group.TYPE}`
			);
		}

		try {
			DATA_SOURCES[groupName].impl = new impl(options);
		} catch (e) {
			throw new ExactException(
				"decorators",
				0,
				`data source type ${name} cannot be instantiated, which is required for data source ${groupName}: ${e}`
			);
		}

		DATA_SOURCES[groupName].logger = configureLogger(groupName, group);
	}
	if (group.CAMELCASE) {
		group.CAMELCASE = group.CAMELCASE === "true";
	}
}

function isDecoratedOnInstanceMethods(target, propertyKey, descriptor) {
	let func = target[propertyKey];
	return (
		typeof target === "object" &&
		typeof func === "function" &&
		propertyKey !== undefined &&
		descriptor !== undefined &&
		typeof descriptor !== "number"
	);
}

/**
 * Sort an array using result of keyFunc as key of each element in a way such that elements with same key are grouped together.
 * Groups are sorted according to where first element in each of them appears in the original array.
 * And this sort preserves relative order between any two elements in the same group as they appears in the original array.
 */
function groupSort(array, keyFunc) {
	let aux = {};
	let tmp = [];
	for (let i = 0; i < array.length; ++i) {
		let value = array[i];
		let key = keyFunc(value);
		let pos = aux[key];
		if (pos === undefined) {
			aux[key] = tmp.length;
			let node = { value };
			node.next = node.tail = node;
			tmp.push(node);
		} else {
			let node = tmp[pos];
			node.tail.next = node.tail = { value };
			node.tail.next = node.tail;
		}
	}
	let len = tmp.length;
	for (let i = 0; i < len; ++i) {
		let elem = tmp[i];
		for (; ;) {
			tmp.push(tmp[i].value);
			if (tmp[i].next === tmp[i]) break;
			tmp[i] = tmp[i].next;
		}
	}
	return tmp.slice(len);
}

function toCamelCase(str) {
	let st = 0;
	let ret = "";
	let underlined = false;
	for (let i = 0; i < str.length; ++i) {
		let char = str[i];
		if (char === "_") {
			underlined = true;
		} else {
			if (underlined) {
				underlined = false;
				ret += str.slice(st, i - 1);
				ret += str[i].toUpperCase();
				st = i + 1;
			}
		}
	}
	if (st < str.length) {
		ret += str.slice(st);
	}
	return ret;
}

function getDataSourceNameForMethod(target, propertyKey) {
	if (target[propertyKey][RUNTIME_DATASOURCE_NAME_CACHE]) {
		return target[propertyKey][RUNTIME_DATASOURCE_NAME_CACHE];
	}

	if (!target[DS_REGISTRY_NAME]) target[DS_REGISTRY_NAME] = {};
	let dataSourceName =
		target[DS_REGISTRY_NAME][propertyKey] ||
		target[DS_REGISTRY_NAME][CLASS_DATASOURCE_NAME] ||
		DEFAULT_DATASOURCE_NAME;

	target[propertyKey][RUNTIME_DATASOURCE_NAME_CACHE] = dataSourceName;

	return dataSourceName;
}

function getDataSourceImplForMethod(target, propertyKey) {
	if (target[propertyKey][RUNTIME_DATASOURCE_IMPL_CACHE]) {
		return target[propertyKey][RUNTIME_DATASOURCE_IMPL_CACHE];
	}

	let dataSourceName = getDataSourceNameForMethod(target, propertyKey);

	let dataSourceOptions = DATA_SOURCES[dataSourceName];

	target[propertyKey][RUNTIME_DATASOURCE_IMPL_CACHE] = dataSourceOptions.impl;

	return dataSourceOptions.impl;
}

function DataSourceClass(name) {
	return function(constructor) {
		if (typeof constructor !== "function" || arguments.length !== 1) {
			throw new ExactException(
				"decorators",
				10,
				`@DataSourceClass can only be used as class decorator`
			);
		}
		if (typeof name === "string") name = [name];
		for (let n = 0; n < name.length; ++n) {
			let dataSourceName = name[n];
			if (
				DATA_SOURCES[dataSourceName] &&
				DATA_SOURCES[dataSourceName].impl
			) {
				throw new ExactException(
					"decorators",
					7,
					`this data source ${dataSourceName} already has an implementation`
				);
			}
			let instance = new constructor(DATA_SOURCES[dataSourceName]);
			DATA_SOURCES[dataSourceName] = DATA_SOURCES[dataSourceName] || {};
			DATA_SOURCES[dataSourceName].impl = instance;
		}
	};
}

function DataSource(name) {
	return function(target, propertyKey, descriptor) {
		name = name || DEFAULT_DATASOURCE_NAME;

		if (!DATA_SOURCES[name] || !DATA_SOURCES[name].impl) {
			throw new ExactException(
				"decorators",
				4,
				`Data source ${name} has not been defined in DotEnv files or through @DataSourceClass decorator`
			);
		}

		if (typeof target === "function") {
			if (propertyKey === undefined) {
				//class decorator
				(target.prototype[DS_REGISTRY_NAME] =
					target.prototype[DS_REGISTRY_NAME] || {})[
					CLASS_DATASOURCE_NAME
				] = name;
			} else {
				throw new ExactException(
					"decorators",
					5,
					`@DataSource decorator can only be used on instance methods`
				);
			}
		} else {
			if (isDecoratedOnInstanceMethods(target, propertyKey, descriptor)) {
				//annotation on instance member
				(target[DS_REGISTRY_NAME] = target[DS_REGISTRY_NAME] || {})[
					propertyKey
				] = name;
			} else {
				throw new ExactException(
					"decorators",
					6,
					`@DataSource decorator can only be used on instance methods`
				);
			}
		}
	};
}

function Param(name, mode) {
	if (!name || (name + '').trim() === '') {
		throw new ExactException(
			"decorators",
			21,
			"@Param name should be non empty"
		);
	}
	name = name + '';
	return function(target, propertyKey, parameterIndex) {
		if (typeof target === "function" || typeof parameterIndex !== "number") {
			throw new ExactException(
				"decorators",
				9,
				`@Param can only be used on instance methods`
			);
		}

		if (!target[PARAM_NAME_REGISTRY_NAME])
			target[PARAM_NAME_REGISTRY_NAME] = {};
		if (!target[PARAM_NAME_REGISTRY_NAME][propertyKey])
			// because maybe not all parameters are decorated,
			// if we use an array, there maybe still some gaps in it,
			// so using a plain object with numeric keys is better
			target[PARAM_NAME_REGISTRY_NAME][propertyKey] = {};

		let collection = target[PARAM_NAME_REGISTRY_NAME][propertyKey];

		for (let key in collection) {
			if (collection[key] === name || collection[key].name === name) {
				throw new ExactException(
					"decorators",
					8,
					`another parameter of method ${propertyKey} has already be named as ${name}`
				);
			}
		}

		collection[parameterIndex] = mode ? { name, mode } : name;
	};
}

function aggregate(shape, data) {
	if (!data || !data.length) return shape.list ? [] : undefined;

	let prefixes = undefined;
	if (shape.sub) {
		prefixes = [];
		let stack = [shape];
		while (stack.length) {
			let e = stack.pop();
			for (let key in e.sub) {
				let subEntity = e.sub[key];
				prefixes.push(subEntity.prefix);
				stack.push(subEntity);
			}
		}
	}

	let id = shape.id ? (shape.prefix || "") + shape.id : undefined;
	let coerce = shape.coerce || {};
	let result = [];
	let shapePrefix = shape.prefix || "";

	if (!id) {
		//treat all elements as distinct objects if id is absent
		for (let row of data) {
			let object = {};
			for (let prop in row) {
				if (shapePrefix && !prop.startsWith(shapePrefix))
					continue;

				let value = row[prop];
				switch (coerce[prop]) {
					case Boolean:
						value = !!value;
						break;
					case Number:
						value = +value;
						break;
					case String:
						value = value + "";
						break;
				}
				object[!shapePrefix ? prop : prop.replace(shapePrefix, "")] = value;
			}

			for (let key in shape.sub) {
				let _sub = shape.sub[key];
				object[key] = aggregate(_sub, data);
			}
			result.push(object);
		}
	} else {

		let object = undefined;
		let remaining = [];

		data = groupSort(data, (e) => e[id]);

		//avoid duplicating the aggregation logic after the loop
		data.push({ [id]: NaN });

		for (let row of data) {
			if (object == undefined || row[id] !== object[id]) {
				if (
					object !== undefined &&
					(id == Symbol.for("undefined") ||
						(object[id] != null && object[id] !== undefined))
				) {
					for (let key in shape.sub) {
						let _sub = shape.sub[key];
						object[key] = aggregate(_sub, remaining);
					}
					if (shapePrefix) delete object[id];
					result.push(object);
				}
				object = { [id]: row[id] };
				remaining = [];
			}
			for (let prop in row) {
				//only take keys that are prefixed with prefixes in shape or sub objects
				if (
					(!prefixes || !prefixes.some((p) => prop.startsWith(p))) &&
					(!shapePrefix || prop.startsWith(shapePrefix))
				) {
					let value = row[prop];
					let func = coerce[prop] || coerce[prop.replace(shapePrefix, "")];
					switch (func) {
						case Boolean:
							value = !!value;
							break;
						case Number:
							value = +value;
							break;
						case String:
							value = value + "";
							break;
					}
					object[prop.replace(shapePrefix, "")] = value;

					delete row[prop];
				}
			}
			remaining.push(row);
		}

		--data.length;
	}

	if (shape.scalar && result.length) {
		let singlePropertyName = undefined;
		let obj = result[0];
		for (let n in obj) {
			if (!obj.hasOwnProperty(n))
				continue;
			if (!singlePropertyName) {
				singlePropertyName = n;
			} else {
				//object has more than one property, scalar has no effect
				singlePropertyName = undefined;
				break;
			}
		}
		if (singlePropertyName) {
			for (let i = 0; i < result.length; ++i) {
				result[i] = result[i][singlePropertyName];
			}
		}
	}

	return shape.list ? result : result[0];
}

function sql_decorator(sql, type, target, propertyKey, descriptor) {
	if (!isDecoratedOnInstanceMethods(target, propertyKey, descriptor)) {
		throw new ExactException(
			"decorators",
			11,
			`sql statement decorators can only be used on instance methods`
		);
	}

	descriptor.value = async function(...args) {
		let dataSourceName = getDataSourceNameForMethod(target, propertyKey);
		let dataSourceImpl = getDataSourceImplForMethod(target, propertyKey);
		let logger = DATA_SOURCES[dataSourceName].logger;

		let camelcase = DATA_SOURCES[dataSourceName].CAMELCASE;

		if (!target[ENGINE_NAME]) {
			target[ENGINE_NAME] = {};
		}
		if (!target[ENGINE_NAME][dataSourceName]) {
			target[ENGINE_NAME][dataSourceName] = new Engine(
				dataSourceImpl.sqlParameterPlaceholder.bind(dataSourceImpl)
			);
		}

		let context = {};
		let methodParamMap = {};
		if (
			target[PARAM_NAME_REGISTRY_NAME] &&
			target[PARAM_NAME_REGISTRY_NAME][propertyKey]
		) {
			methodParamMap = target[PARAM_NAME_REGISTRY_NAME][propertyKey];
		}

		let hasOutParameter = false;
		for (let n = 0; n < args.length; ++n) {
			let arg = args[n];
			let paramObj = methodParamMap[n];
			if (!paramObj || typeof paramObj === 'string') {
				context[paramObj || `arg${n}`] = arg;
			} else {
				context[paramObj.name] = arg;
				hasOutParameter = true;
			}
		}

		let prefix = target.constructor.name + '.' + propertyKey;

		let engine = target[ENGINE_NAME][dataSourceName];
		let engineResult = engine.generate(sql, this.partials || {}, context);
		//show current class and method name
		logger(`>=== ${prefix} statement: ${engineResult.sql.replace(/[\r\n]/gi, "")}`);
		// print Buffers directly will make some logger libraries like log4js stuck in infinite loop printing garbage
		logger(`>=== ${prefix} parameters: ${engineResult.parameters.map(e => {
			if (e instanceof Buffer)
				return `Buffer[${e.length}]`;
			return e;
		})}`);

		let store = TRANSACTION_ASYNC_STORAGE.getStore();
		let connection;
		let timeout;
		if (store && store.currentDataSourceName() !== undefined) {
			if (store.currentDataSourceName() !== dataSourceName) {
				throw new ExactException(
					"decorators",
					19,
					`data source ${dataSourceName} specified for current method ${propertyKey} is different from ${store.currentDataSourceName()} used by current transaction`
				);
			}
			connection = store.currentConnection();
			timeout = store.currentTimeout();
		} else {
			connection = await dataSourceImpl.getConnection();
		}

		let transformedParameterArray = engineResult.parameters;
		if (hasOutParameter) {
			transformedParameterArray = [];
			for (let n = 0; n < args.length; ++n) {
				let paramObj = methodParamMap[n];
				if (!paramObj) {
					transformedParameterArray.push({ name: `arg${n}`, value: engineResult.parameters[n], out: false });
				} else if (typeof paramObj === 'string') {
					transformedParameterArray.push({ name: paramObj, value: engineResult.parameters[n], out: false });
				} else {
					transformedParameterArray.push({ name: paramObj.name, value: engineResult.parameters[n], out: true })
				}
			}
		}

		try {
			var sqlResult = await dataSourceImpl[hasOutParameter ? "call" : "execute"](connection, engineResult.sql, transformedParameterArray, timeout);
		} finally {
			if (!store) {
				await dataSourceImpl.release(connection);
			}
		}

		if (sqlResult.rows) {
			logger(`<=== ${prefix} result: ${sqlResult.rows.length} row(s)`);
		} else if (sqlResult.insertId) {
			logger(`<=== ${prefix} generated key: ${sqlResult.insertId}`)
		} else if (sqlResult.affectedRows !== undefined && sqlResult.affectedRows !== null) {
			logger(`<=== ${prefix} affected rows: ${sqlResult.affectedRows}`)
		} else {
			logger(`<=== ${prefix} affected rows: 0`)
		}

		function convertCamelCase(rows) {
			if (!rows.length) {
				for (let prop in rows) {
					rows[toCamelCase(prop)] = rows[prop];
					delete rows[prop];
				}
				return;
			}
			for (let i = 0, row = rows[i]; i < rows.length; row = rows[++i]) {
				for (let prop in row) {
					row[toCamelCase(prop)] = row[prop];
					delete row[prop];
				}
			}
		}

		/*
			[{"name":"value"}]
			list:true,scalar:false [{"name":"value"}]
			list:false,scalar:false {"name":"value"}
			list:true,scalar:true ["value"]
			list:false,scalar:true "value"
			select = list:true,scalar:true
			selectOne = list:false,scalar:true
			list=true will make empty result returned as empty array rather than undefined
		 **/
		switch (type) {
			case "select":
			case 'selectOne': {
				let { rows } = sqlResult;
				let resultShape;
				if (target[RESULT_MAP_NAME] && target[RESULT_MAP_NAME][propertyKey]) {
					//make a copy as this object may be shared and modification to it may affect other codes
					resultShape = { ...target[RESULT_MAP_NAME][propertyKey] };
				} else {
					resultShape = {};
				}
				if (type === 'select') {
					resultShape.list = resultShape.list === undefined ? true : resultShape.list;
					resultShape.scalar = resultShape.scalar === undefined ? true : resultShape.scalar;
				} else {
					resultShape.list = resultShape.list === undefined ? false : resultShape.list;
					resultShape.scalar = resultShape.scalar === undefined ? true : resultShape.scalar;
				}
				rows = aggregate(resultShape, rows);
				if (camelcase) convertCamelCase(rows);
				return rows;
			}
			case "update":
				return sqlResult.affectedRows;
			case "insert":
				return sqlResult.insertId != undefined
					? sqlResult.insertId
					: sqlResult.affectedRows;
		}
	};
}

function Select(sql) {
	return sql_decorator.bind(undefined, sql, "select");
}

function SelectOne(sql) {
	return sql_decorator.bind(undefined, sql, "selectOne");
}

function Update(sql) {
	return sql_decorator.bind(undefined, sql, "update");
}

function Insert(sql) {
	return sql_decorator.bind(undefined, sql, "insert");
}

function Delete(sql) {
	return sql_decorator.bind(undefined, sql, "update");
}

function Result(map) {
	return function(target, propertyKey, descriptor) {
		if (!isDecoratedOnInstanceMethods(target, propertyKey, descriptor)) {
			throw new ExactException(
				"decorators",
				14,
				`@Result can only be used on instance methods`
			);
		}

		let stack = [map];
		while (stack.length) {
			let e = stack.pop();
			for (let key in e.sub) {
				let subEntity = e.sub[key];
				let prefix = subEntity.prefix;
				if (typeof prefix !== "string")
					throw new ExactException(
						"decorators",
						16,
						`sub entity declarations should have non-empty prefix property`
					);
				stack.push(subEntity);
			}
		}

		if (!target[RESULT_MAP_NAME]) target[RESULT_MAP_NAME] = {};
		target[RESULT_MAP_NAME][propertyKey] = map;
	};
}

class TransactionStack {

	constructor() {
		this.stack = [];
	}

	push(dataSourceName, connection, timeout) {
		this.stack.push({ dataSourceName, connection, timeout });
	}

	pop() {
		return this.stack.pop();
	}

	currentTimeout() {
		return this.stack.length
			? this.stack[this.stack.length - 1].timeout
			: undefined;
	}

	currentDataSourceName() {
		return this.stack.length
			? this.stack[this.stack.length - 1].dataSourceName
			: undefined;
	}
	currentConnection() {
		return this.stack.length
			? this.stack[this.stack.length - 1].connection
			: undefined;
	}
}

function Transactional(level, timeout) {

	timeout = +timeout || undefined;

	let levelStr = level ? ` at level ${level}` : '';

	return function(target, propertyKey, descriptor) {
		if (!isDecoratedOnInstanceMethods(target, propertyKey, descriptor)) {
			throw new ExactException(
				"decorators",
				17,
				"@Transactional should only be used on instance methods"
			);
		}

		let originalMethod = descriptor.value;
		descriptor.value = async function(...args) {
			let dataSourceName = getDataSourceNameForMethod(target, propertyKey);
			let dataSourceImpl = getDataSourceImplForMethod(target, propertyKey);
			let logger = DATA_SOURCES[dataSourceName].logger;

			let store = TRANSACTION_ASYNC_STORAGE.getStore();
			let connection;
			if (!store) {
				//not in a transaction at all
				connection = await dataSourceImpl.getConnection();
				store = new TransactionStack();
				store.push(dataSourceName, connection, timeout);

				try {
					logger(
						`>=== begin transaction for data source ${dataSourceName}${levelStr}`
					);
					await dataSourceImpl.beginTransaction(connection, level);
					let self = this;
					let result = await TRANSACTION_ASYNC_STORAGE.run(
						store,
						async function() {
							return await originalMethod.apply(self, args);
						}
					);
					logger(
						`<=== commit transaction for data source ${dataSourceName}`
					);
					await dataSourceImpl.commit(connection);
					return result;
				} catch (e) {
					logger(
						`<=== roll back transaction for data source ${dataSourceName}`
					);
					await dataSourceImpl.rollback(connection);
					throw e;
				} finally {
					store.pop();
					await dataSourceImpl.release(connection);
				}
			} else if (store.currentDataSourceName() !== dataSourceName) {
				//inside a transaction, but initiated by a different DataSource
				//start a new transaction for this DataSource
				connection = await dataSourceImpl.getConnection();
				store.push(dataSourceName, connection, timeout);
				try {
					logger(
						`>=== begin embedded transaction for data source ${dataSourceName}${levelStr}`
					);
					await dataSourceImpl.beginTransaction(connection, level);
					let result = await originalMethod.apply(this, args);
					logger(
						`<=== commit transaction for data source ${dataSourceName}`
					);
					await dataSourceImpl.commit(connection);
					return result;
				} catch (e) {
					logger(`<=== roll back transaction for data source ${dataSourceName}`);
					await dataSourceImpl.rollback(connection);
					throw e;
				} finally {
					store.pop();
					await dataSourceImpl.release(connection);
				}
			} else {
				//inside a transaction started by the same DataSource
				return await originalMethod.apply(this, args);
			}
		};
	};
}

function Cleanup() {
	return function(target, propertyKey, descriptor) {
		if (typeof descriptor !== 'object') {
			throw new ExactException(
				"decorators",
				20,
				"@Cleanup should be decorated on methods"
			);
		}
		descriptor.value = async function() {
			for (let groupName in DATA_SOURCES) {
				if (DATA_SOURCES[groupName].impl)
					await DATA_SOURCES[groupName].impl.destroy();
			}
		}
	}
}

module.exports = {
	DATA_SOURCES,
	DEFAULT_DATASOURCE_NAME,
	DS_REGISTRY_NAME,
	PARAM_NAME_REGISTRY_NAME,
	CLASS_DATASOURCE_NAME,
	getDataSourceNameForMethod,
	aggregate,
	// "public" exports
	DataSourceClass,
	DataSource,
	Select,
	SelectOne,
	Insert,
	Update,
	Delete,
	Result,
	Param,
	Transactional,
	Cleanup,
	DEFAULT_CATEGORRY_NAME
};