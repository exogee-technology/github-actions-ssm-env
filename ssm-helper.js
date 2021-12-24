const { SSMClient, paginateGetParametersByPath } = require('@aws-sdk/client-ssm');
const core = require('@actions/core');
// const core = require('./core-stub');

const ssmPaths = (applicationName) => {
	if (!applicationName) throw new Error('No applicationName.');
	if (!process.env.GITHUB_REF) throw new Error('No GITHUB_REF environment variable.');

	let branch = process.env.GITHUB_REF.replace('refs/heads/', '');
	if (branch === 'master' || branch === 'main') {
		branch = 'development';
	}

	return {
		sharedPath: `/${applicationName}/shared`,
		environmentPath: `/${applicationName}/${branch}`,
	};
};

const getAllParametersAtPath = async ({ ssm, path, decryption }) => {
	const results = [];
	const paginator = paginateGetParametersByPath(
		{ client: ssm },
		{
			Path: path,
			Recursive: true,
			WithDecryption: decryption,
		}
	);

	for await (const page of paginator) {
		results.push(...page.Parameters);
	}

	return results;
};

const getParameters = async ({ applicationName, decryption }) => {
	if (!process.env.AWS_DEFAULT_REGION)
		throw new Error('No AWS_DEFAULT_REGION environment variable.');

	const ssm = new SSMClient({ region: process.env.AWS_DEFAULT_REGION });

	const { sharedPath, environmentPath } = ssmPaths(applicationName);

	core.debug(`Getting variables at SSM path '${sharedPath}'`);
	const shared = await getAllParametersAtPath({ ssm, path: sharedPath, decryption });

	core.debug(`Getting variables at SSM path '${environmentPath}'`);
	const environment = await getAllParametersAtPath({ ssm, path: environmentPath, decryption });

	return [...shared, ...environment];
};

module.exports = { getParameters };
