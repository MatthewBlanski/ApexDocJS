const simpleGit = require('simple-git');

class GitService {
    constructor(sourceDirectory,mainBranch) {
        this.simpleGitInstance = simpleGit({
            baseDir: sourceDirectory,
            binary: 'git',
            maxConcurrentProcesses: 6,
        });
        this.mainBranch = mainBranch;
    }

    async checkIsRepoRoot() {
        await this.simpleGitInstance.checkIsRepo('root')
        .then( (response) => {
            if(response) {
                this.isRepoRoot = true;
            } else {
                console.log(this.sourceDirectory + ' is not a root directory for a git repo!')
            }
        });

        return this.isRepoRoot;
    }

    async getRemotes() {
        await this.simpleGitInstance.getRemotes(true)
        .then((response) => {
            this.remotes = response;
        });
        return this.remotes;
    }

    getSourceUrlFromRemotes() {
        if(!this.remotes) {
            return null;
        }

        this.remotes.forEach(remote => {
            if(remote.name == 'origin') {
                if(remote.refs.fetch) {
                    this.hostedSourceUrl = this.parseRemoteReference(remote.refs.fetch);
                } else if(remote.refs.push) {
                    this.hostedSourceUrl = this.parseRemoteReference(remote.refs.push);
                } else {
                    console.log('Something went horribly wrong trying to find the source URL from origin!');
                }
            }
        });

        return this.hostedSourceUrl;
    }

    //TODO: Make this polymorphic to handle different contexts like bitbucket as well as github
    parseRemoteReference(remoteReference) {
        if(remoteReference.startsWith('https')) {
            return remoteReference.replace(/\.git$/,'') + '/tree/' + this.mainBranch + '/';
        }
        
        return remoteReference.replace(/^[^@]+@([^:]+):/,'https://$1/').replace(/\.git$/,'') + '/tree/'  + this.mainBranch;
    }
}

module.exports = GitService;