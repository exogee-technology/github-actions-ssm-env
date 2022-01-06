const ssm = require('./ssm-helper');
const core = require('@actions/core');
// const core = require('./core-stub');

const run_action = async () => {
	try {
		const applicationName = core.getInput('application-name', { required: true });
		const decryption = core.getBooleanInput('decryption');
		const maskValues = core.getBooleanInput('mask-values');
		const safeValues = parseSafeValues();

		const params = await ssm.getParameters({ applicationName, decryption });
		core.debug(`Got ${params.length} params.`);

		for (const param of params) {
			core.debug(`Parsing value for parameter '${param.Name}'.`);
			const parsedValue = parseValue(param.Value);
			if (typeof parsedValue === 'object') {
				// Assume basic JSON structure
				for (var key in parsedValue) {
					setEnvironmentVar({ key, value: parsedValue[key], maskValues, safeValues });
				}
			} else {
				// Set environment variable with ssmPath name as the env variable
				var split = param.Name.split('/');
				var envVarName = split[split.length - 1];
				core.debug(`Using end of ssmPath for env var name: ${envVarName}`);
				setEnvironmentVar({ key: envVarName, value: parsedValue, maskValues, safeValues });
			}
		}
	} catch (error) {
		core.setFailed(error.message);
	}
};

const parseSafeValues = () => {
	try {
		const parsedSafe = JSON.parse(core.getMultilineInput('safe-values'));
		if (Array.isArray(parsedSafe)) {
			return new Set(parsedSafe);
		} else {
			core.setFailed('safe-values must be a JSON array.');
		}
	} catch (error) {
		core.setFailed(error.message);
	}
};

const parseValue = (val) => {
	try {
		return JSON.parse(val);
	} catch {
		core.debug('JSON parse failed - treating parameter as a string literal');
		return val;
	}
};

const setEnvironmentVar = ({ key, value, maskValues, safeValues }) => {
	core.debug(`Setting var: '${key.toUpperCase()}'`);

	if (maskValues && !safeValues.has(value.toString())) {
		core.debug('Masking value.');
		core.setSecret(value);
	} else if (!maskValues) {
		core.debug('Not masking value because maskValues is disabled');
	} else {
		core.debug('Not masking value because value is in safeValues');
	}

	core.exportVariable(key.toUpperCase(), value);
};

run_action();
