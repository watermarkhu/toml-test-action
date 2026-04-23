import { chmod, readFile, writeFile } from 'fs/promises';

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';

import { ungzip } from 'node-gzip';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tomlTestURL = 'https://github.com/BurntSushi/toml-test/releases/download/v2.1.0/toml-test-v2.1.0-linux-amd64.gz';

async function run() {
    const tomlTestPath = await core.group("Download toml-test binary", async () => {
        const tomlTestGzipPath = await tc.downloadTool(tomlTestURL);
        console.log("toml-test release downloaded to:", tomlTestGzipPath);

        const tomlTestExtractedPath = tomlTestGzipPath.slice(0, tomlTestGzipPath.lastIndexOf('/')) + '/toml-test';
        const zipped = await readFile(tomlTestGzipPath);
        const unzipped = await ungzip(zipped);
        await writeFile(tomlTestExtractedPath, unzipped);
        await chmod(tomlTestExtractedPath, 0o777);
        console.log("toml-test binary extracted to:", tomlTestExtractedPath);

        core.addPath(tomlTestExtractedPath);
        return tomlTestExtractedPath;
    });

    const args = [];

    // Add toml-test options first
    if (core.getInput('encoder', { required: false })) {
        args.push('-encoder');
    }

    const run_arg = core.getInput('run', { required: false });
    if (run_arg) {
        args.push('-run', run_arg);
    }

    const skip_arg = core.getInput('skip', { required: false });
    if (skip_arg) {
        args.push('-skip', skip_arg);
    }

    const parallel_arg = core.getInput('parallel', { required: false });
    if (parallel_arg) {
        args.push('-parallel', parallel_arg);
    }

    const timeout_arg = core.getInput('timeout', { required: false });
    if (timeout_arg) {
        args.push('-timeout', timeout_arg);
    }

    const test_dir_arg = core.getInput('test_dir', { required: false });
    if (test_dir_arg) {
        args.push('-testdir', test_dir_arg);
    }

    // Add verbosity and command last
    args.push('-v', '-v', '--');
    const command_arg = core.getInput('command', { required: true });
    args.push(...command_arg.split(' '));

    await exec.exec(`"${tomlTestPath}"`, args);
}

run().catch((e) => {
    core.setFailed(e);
});
