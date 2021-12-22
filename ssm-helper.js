const AWS = require('aws-sdk');

const ssmPath = (applicationName) => {
	if (!applicationName) throw new Error('No applicationName.');
	if (!process.env.GITHUB_REF) throw new Error('No GITHUB_REF environment variable.');

	return `/${applicationName}/${process.env.GITHUB_REF.replace('refs/heads/', '')}`;
};

const getParameters = async ({ applicationName, decryption }) => {
	if (!process.env.AWS_DEFAULT_REGION)
		throw new Error('No AWS_DEFAULT_REGION environment variable.');

	AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });
	const ssm = new AWS.SSM();

	const { Parameters } = await ssm
		.getParametersByPath({
			Path: ssmPath(applicationName),
			WithDecryption: decryption,
		})
		.promise();

	return Parameters;
};

module.exports = { getParameters };
