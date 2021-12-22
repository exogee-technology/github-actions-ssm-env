const core = require('@actions/core');
const ssm = require('./ssm-helper');

const run_action = async () => {
	try {
		const applicationName = core.getInput('application-name', { required: true });
		const decryption = core.getBooleanInput('decryption');
		const maskValues = core.getBooleanInput('mask-values');

		const params = await ssm.getParameters({ applicationName, decryption });
		core.debug(`Got ${params.length} params.`);

		for (const param of params) {
			const parsedValue = parseValue(param.Value);
			if (typeof parsedValue === 'object') {
				// Assume JSON object
				core.debug(`parsedValue: ${JSON.stringify(parsedValue)}`);
				// Assume basic JSON structure
				for (var key in parsedValue) {
					setEnvironmentVar(key, parsedValue[key], maskValues);
				}
			} else {
				core.debug(`parsedValue: ${parsedValue}`);
				// Set environment variable with ssmPath name as the env variable
				var split = param.Name.split('/');
				var envVarName = split[split.length - 1];
				core.debug(`Using end of ssmPath for env var name: ${envVarName}`);
				setEnvironmentVar(envVarName, parsedValue, maskValues);
			}
		}
	} catch (e) {
		core.setFailed(e.message);
	}
};

const parseValue = (val) => {
	try {
		return JSON.parse(val);
	} catch {
		core.debug('JSON parse failed - assuming parameter is to be taken as a string literal');
		return val;
	}
};

const setEnvironmentVar = (key, value, maskValues) => {
	core.debug(`Setting var: '${key.toUpperCase()}': '${value}'`);

	if (maskValues) core.setSecret(value);
	core.exportVariable(key.toUpperCase(), value);
};

run_action();
