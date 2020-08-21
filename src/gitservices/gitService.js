const simpleGit = require('simple-git');

class GitService {
    constructor(sourceDirectory) {
        this.simpleGitInstance = simpleGit({
            baseDir: sourceDirectory,
            binary: 'git',
            maxConcurrentProcesses: 6,
        });
    }
}

module.exports = GitService;