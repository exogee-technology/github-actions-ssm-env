const getInput = (inputName) => {
	switch (inputName) {
		case 'application-name':
			return 'go-collect';
		case 'decryption':
			return 'true';
		case 'mask-values':
			return 'true';
		case 'requests-per-second':
			return '40';
		case 'safe-values':
			return '["0", "1", "true", "false"]';
	}
};

module.exports = {
	debug: console.log,
	info: console.log,
	setFailed: console.log,
	setSecret: () => {},
	exportVariable: (key, value) => console.log(`Exporting variable '${key}': '${value}'`),
	getInput,
	getMultilineInput: getInput,
	getBooleanInput: (inputName) => Boolean(getInput(inputName)),
};
