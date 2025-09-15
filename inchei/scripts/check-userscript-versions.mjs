#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';
import process from 'process';
import readline from 'readline';
import userscript from 'userscript-meta';
import { resolve } from 'path';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

function getModifiedUserScriptFiles() {
    try {
        const output = execSync('git diff --name-only --diff-filter=M origin/master...HEAD', { encoding: 'utf8' });
        return output.split('\n')
            .filter(file => file.startsWith('inchei/') && file.endsWith('.user.js'))
            .map(file => resolve(file.slice(7))).filter(file => fs.existsSync(file));
    } catch (error) {
        console.error('Error getting modified files:', error);
        return [];
    }
}

function checkVersionUpdated(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const meta = userscript.parse(content);

        if (!meta || !meta.version) {
            console.warn(`${filePath}: No version found in metadata`);
            return true;
        }

        let oldVersion = null;
        try {
            const oldContent = execSync(`git show origin/master:${filePath}`, { encoding: 'utf8' });
            const oldMeta = userscript.parse(oldContent);
            oldVersion = oldMeta?.version;
        } catch {
            oldVersion = null;
        }

        const newVersion = meta.version;

        if (oldVersion && oldVersion === newVersion) {
            console.error(`${filePath}: Version not updated (still ${oldVersion})`);
            return false;
        }

        console.log(`${filePath}: Version updated from ${oldVersion || 'none'} to ${newVersion}`);
        return true;
    } catch (error) {
        console.error(`Error checking ${filePath}:`, error);
        return false;
    }
}

async function main() {
    const modifiedFiles = getModifiedUserScriptFiles();

    if (modifiedFiles.length === 0) {
        console.log('No modified *.user.js files found');
        process.exit(0);
    }

    console.log('Checking userscript versions...');

    let allUpdated = true;
    modifiedFiles.forEach(file => {
        if (!checkVersionUpdated(file)) {
            allUpdated = false;
        }
    });

    if (!allUpdated) {
        console.log('\nThere were some problems with what you posted…');
        console.log('You updated the code but didn\'t increase the @version number. Those who previously installed your script may not get the updated code.');
        // 改用 await 调用 Promise 形式的 prompt
        const proceed = await prompt('Are you sure to push? (y/N)') === 'y';
        rl.close();
        if (!proceed) {
            console.log('Push aborted.');
            process.exit(1);
        }
        process.exit();
    }

    rl.close();
    console.log('\nAll userscript versions are properly updated!');
}

main();
