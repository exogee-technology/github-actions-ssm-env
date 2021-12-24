const { SSMClient, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const core = require('@actions/core');

const requestsPerSecond = parseInt(core.getInput('requests-per-second'));
const rateLimit = Math.ceil(1000 / requestsPerSecond);

const wait = (durationInMs) => new Promise((resolve) => setTimeout(resolve, durationInMs));

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
	let done = false;
	let NextToken;

	while (!done) {
		await wait(rateLimit);
		const result = await ssm.send(
			new GetParametersByPathCommand({
				Path: path,
				Recursive: true,
				WithDecryption: decryption,
				MaxResults: 10, // Maximum from AWS.
				NextToken,
			})
		);
		NextToken = result.NextToken;

		results.push(...result.Parameters);

		done = result.Parameters.length < 10;
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
